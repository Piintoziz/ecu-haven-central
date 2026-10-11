-- =============================================================================
-- Fase 2: backoffice (/admin), automação de envios/stock, fila de emails e
-- importação em massa do catálogo.
-- Triggers: SECURITY DEFINER no schema private (não exposto pela Data API).
-- Funções do backoffice: SECURITY INVOKER + verificação explícita de staff,
-- por isso as políticas RLS continuam a aplicar-se.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Utilitário: slug a partir de texto livre ("Siemens VDO" -> "siemens-vdo")
-- ---------------------------------------------------------------------------
create or replace function private.slugify(t text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(
    lower(translate(coalesce(t, ''),
      'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑáàâãäéèêëíìîïóòôõöúùûüçñ',
      'AAAAAEEEEIIIIOOOOOUUUUCNaaaaaeeeeiiiiooooouuuucn')),
    '[^a-z0-9]+', '-', 'g'));
$$;
revoke execute on function private.slugify(text) from public, anon;
grant execute on function private.slugify(text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Encomendas: pagamento capturado -> "paga"; cancelamento é final e repõe stock;
-- mudanças de estado geram email ao cliente.
-- ---------------------------------------------------------------------------
create or replace function private.orders_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'cancelled' and new.status <> 'cancelled' then
    raise exception 'order_cancelled_final';
  end if;
  if new.payment_status = 'captured' and old.payment_status <> 'captured'
     and new.status = 'pending_payment' then
    new.status := 'paid';
  end if;
  return new;
end;
$$;

create or replace function private.orders_after_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status = 'cancelled' then
    insert into public.inventory_movements (product_id, delta, reason, reference_id, note, actor_id)
    select i.product_id, i.quantity, 'cancellation', new.id, new.order_code, auth.uid()
    from public.order_items i
    where i.order_id = new.id and i.product_id is not null;
  end if;

  -- "Enviada"/"Entregue" com envio registado: o email sai do trigger de envios.
  if new.status in ('paid', 'processing', 'cancelled', 'refunded')
     or (new.status in ('shipped', 'delivered')
         and not exists (select 1 from public.shipments s where s.order_id = new.id)) then
    insert into public.email_outbox (type, to_email, payload)
    values ('order_status_update', new.email,
            jsonb_build_object('order_code', new.order_code, 'status', new.status));
  end if;
  return new;
end;
$$;

revoke execute on function private.orders_before_update() from public, anon, authenticated;
revoke execute on function private.orders_after_update() from public, anon, authenticated;

create trigger orders_before_update before update on public.orders
  for each row execute function private.orders_before_update();
create trigger orders_after_update after update on public.orders
  for each row execute function private.orders_after_update();

-- ---------------------------------------------------------------------------
-- Envios: novo envio -> encomenda "enviada"; entregue -> encomenda "entregue";
-- eventos de tracking atualizam o estado do envio; cliente recebe email.
-- ---------------------------------------------------------------------------
create or replace function private.shipments_after_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if tg_op = 'UPDATE'
     and new.status is not distinct from old.status
     and new.tracking_number is not distinct from old.tracking_number
     and new.tracking_url is not distinct from old.tracking_url then
    return new;
  end if;

  select * into v_order from public.orders where id = new.order_id;

  if new.status = 'delivered' and v_order.status in ('paid', 'processing', 'shipped') then
    update public.orders set status = 'delivered' where id = new.order_id;
  elsif new.status in ('label_created', 'in_transit', 'out_for_delivery')
        and v_order.status in ('paid', 'processing') then
    update public.orders set status = 'shipped' where id = new.order_id;
  end if;

  insert into public.email_outbox (type, to_email, payload)
  values ('shipment_update', v_order.email, jsonb_build_object(
    'order_code', v_order.order_code,
    'carrier', new.carrier,
    'service_level', new.service_level,
    'status', new.status,
    'tracking_number', new.tracking_number,
    'tracking_url', new.tracking_url));
  return new;
end;
$$;

create or replace function private.shipment_events_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Só o evento mais recente define o estado (eventos retroativos não regridem).
  if exists (select 1 from public.shipment_events e
             where e.shipment_id = new.shipment_id and e.id <> new.id
               and e.occurred_at > new.occurred_at) then
    return new;
  end if;
  update public.shipments s
     set status = new.status,
         shipped_at = case when new.status <> 'label_created'
                           then coalesce(s.shipped_at, new.occurred_at) else s.shipped_at end,
         delivered_at = case when new.status = 'delivered' then new.occurred_at else s.delivered_at end
   where s.id = new.shipment_id
     and s.status is distinct from new.status;
  return new;
end;
$$;

revoke execute on function private.shipments_after_change() from public, anon, authenticated;
revoke execute on function private.shipment_events_after_insert() from public, anon, authenticated;

create trigger shipments_after_change after insert or update on public.shipments
  for each row execute function private.shipments_after_change();
create trigger shipment_events_after_insert after insert on public.shipment_events
  for each row execute function private.shipment_events_after_insert();

-- ---------------------------------------------------------------------------
-- Fila de emails: o worker (servidor, service_role) reclama lotes de forma
-- atómica; reenvio com backoff; envios "presos" voltam à fila após 10 min.
-- ---------------------------------------------------------------------------
alter table public.email_outbox add column if not exists claimed_at timestamptz;

create or replace function public.claim_email_batch(p_limit integer)
returns setof public.email_outbox
language sql
volatile
security definer
set search_path = ''
as $$
  update public.email_outbox o
     set status = 'sending', attempts = o.attempts + 1, claimed_at = now()
   where o.id in (
     select x.id from public.email_outbox x
     where x.status = 'pending'
        or (x.status = 'failed' and x.attempts < 5
            and x.claimed_at < now() - make_interval(mins => 5 * x.attempts))
        or (x.status = 'sending' and x.claimed_at < now() - interval '10 minutes')
     order by x.created_at
     limit least(greatest(coalesce(p_limit, 10), 1), 50)
     for update skip locked)
  returning o.*;
$$;
revoke execute on function public.claim_email_batch(integer) from public, anon, authenticated;
grant execute on function public.claim_email_batch(integer) to service_role;

-- ---------------------------------------------------------------------------
-- Dashboard do backoffice
-- ---------------------------------------------------------------------------
create or replace function public.admin_dashboard(p_days integer default 30)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  d integer := least(greatest(coalesce(p_days, 30), 1), 365);
  since date := current_date - (d - 1);
begin
  if not private.is_staff((select auth.uid())) then
    raise exception 'forbidden';
  end if;
  return jsonb_build_object(
    'days', d,
    'revenue_cents', (select coalesce(sum(o.total_cents), 0) from public.orders o
                      where o.status in ('paid', 'processing', 'shipped', 'delivered')
                        and o.created_at >= since),
    'orders_count', (select count(*) from public.orders o
                     where o.created_at >= since and o.status <> 'cancelled'),
    'pending_payment', (select count(*) from public.orders o where o.status = 'pending_payment'),
    'to_ship', (select count(*) from public.orders o where o.status in ('paid', 'processing')),
    'active_products', (select count(*) from public.products p where p.is_active),
    'stock_units', (select coalesce(sum(p.stock_quantity), 0) from public.products p where p.is_active),
    'low_stock', (select count(*) from public.products p where p.is_active and p.stock_quantity = 1),
    'out_of_stock', (select count(*) from public.products p where p.is_active and p.stock_quantity = 0),
    'new_messages', (select count(*) from public.contact_messages m where m.status = 'new'),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'day', g.day, 'revenue_cents', coalesce(r.revenue, 0), 'orders', coalesce(r.n, 0))
             order by g.day), '[]'::jsonb)
      from (select generate_series(since, current_date, interval '1 day')::date as day) g
      left join (
        select o.created_at::date as day,
               sum(o.total_cents) filter (where o.status in ('paid', 'processing', 'shipped', 'delivered')) as revenue,
               count(*) filter (where o.status <> 'cancelled') as n
        from public.orders o
        where o.created_at >= since
        group by 1) r on r.day = g.day),
    'top_products', (
      select coalesce(jsonb_agg(t order by t.units desc), '[]'::jsonb)
      from (
        select i.reference_snapshot as reference, i.title_snapshot as title,
               sum(i.quantity)::integer as units, sum(i.quantity * i.unit_price_cents)::integer as revenue_cents
        from public.order_items i
        join public.orders o on o.id = i.order_id
        where o.created_at >= since and o.status in ('paid', 'processing', 'shipped', 'delivered')
        group by 1, 2
        order by 3 desc
        limit 5) t)
  );
end;
$$;
revoke execute on function public.admin_dashboard(integer) from public, anon;
grant execute on function public.admin_dashboard(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Importação em massa (CSV/Excel -> JSON no browser, lotes até 500 linhas).
-- SECURITY INVOKER: as escritas passam pelas políticas "staff" do catálogo.
-- Cada linha corre numa sub-transação: uma linha inválida não trava o lote.
-- ---------------------------------------------------------------------------
create or replace function public.import_products(p_rows jsonb)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_row jsonb;
  v_idx integer := 0;
  v_ok integer := 0;
  v_created integer := 0;
  v_errors jsonb := '[]'::jsonb;
  v_uid uuid := (select auth.uid());
  v_hw text;
  v_title text;
  v_price integer;
  v_stock integer;
  v_manu_id uuid;
  v_manu_slug text;
  v_cat_id uuid;
  v_slug text;
  v_sku text;
  v_product_id uuid;
  v_current_stock integer;
  v_condition public.product_condition;
  v_ref text;
begin
  if not private.is_staff(v_uid) then
    raise exception 'forbidden';
  end if;
  if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows) > 500 then
    raise exception 'invalid_rows';
  end if;

  for v_row in select e from jsonb_array_elements(p_rows) e loop
    v_idx := v_idx + 1;
    begin
      v_hw := nullif(trim(v_row ->> 'hardware_ref'), '');
      v_title := nullif(trim(v_row ->> 'title'), '');
      v_sku := nullif(trim(v_row ->> 'sku'), '');
      v_price := round((v_row ->> 'price_eur')::numeric * 100)::integer;
      v_stock := coalesce(nullif(v_row ->> 'stock', '')::integer, 0);

      if v_hw is null then raise exception 'Referência de hardware em falta'; end if;
      if v_price is null or v_price < 0 then raise exception 'Preço inválido'; end if;
      if v_stock < 0 then raise exception 'Stock negativo'; end if;

      v_condition := coalesce(nullif(v_row ->> 'condition', ''), 'used_tested')::public.product_condition;

      -- Fabricante (cria se não existir)
      v_manu_id := null;
      v_manu_slug := private.slugify(v_row ->> 'manufacturer');
      if v_manu_slug <> '' then
        select id into v_manu_id from public.ecu_manufacturers where slug = v_manu_slug;
        if v_manu_id is null then
          insert into public.ecu_manufacturers (slug, name)
          values (v_manu_slug, left(trim(v_row ->> 'manufacturer'), 80))
          returning id into v_manu_id;
        end if;
      end if;

      -- Categoria (tem de existir: slug ou código curto, ex. "motor" / "ECU")
      v_cat_id := null;
      if nullif(trim(v_row ->> 'category'), '') is not null then
        select id into v_cat_id from public.categories
        where slug = private.slugify(v_row ->> 'category')
           or upper(short_code) = upper(trim(v_row ->> 'category'))
        limit 1;
        if v_cat_id is null then raise exception 'Categoria desconhecida: %', v_row ->> 'category'; end if;
      end if;

      -- Mesmo formato do catálogo: fabricante + referência normalizada (bosch-0281016000)
      v_slug := private.slugify(concat_ws('-', nullif(v_manu_slug, ''), public.normalize_reference(v_hw)));
      if v_title is null then
        v_title := concat_ws(' ', (select name from public.ecu_manufacturers where id = v_manu_id),
                             nullif(trim(v_row ->> 'ecu_family'), ''), v_hw);
      end if;

      -- Produto existente: por SKU, senão por slug
      v_product_id := null;
      if v_sku is not null then
        select id, stock_quantity into v_product_id, v_current_stock from public.products where sku = v_sku;
      end if;
      if v_product_id is null then
        select id, stock_quantity into v_product_id, v_current_stock from public.products where slug = v_slug;
      end if;

      if v_product_id is null then
        insert into public.products (slug, sku, manufacturer_id, category_id, title, ecu_family,
                                     description, condition, warranty_months, price_cents,
                                     weight_grams, is_active)
        values (v_slug, v_sku, v_manu_id, v_cat_id, left(v_title, 200),
                nullif(trim(v_row ->> 'ecu_family'), ''),
                nullif(v_row ->> 'description', ''), v_condition,
                coalesce(nullif(v_row ->> 'warranty_months', '')::smallint, 12), v_price,
                coalesce(nullif(v_row ->> 'weight_grams', '')::integer, 500),
                coalesce((v_row ->> 'active')::boolean, true))
        returning id into v_product_id;
        v_current_stock := 0;
        v_created := v_created + 1;
      else
        update public.products set
          sku = coalesce(v_sku, sku),
          manufacturer_id = coalesce(v_manu_id, manufacturer_id),
          category_id = coalesce(v_cat_id, category_id),
          title = coalesce(left(nullif(trim(v_row ->> 'title'), ''), 200), title),
          ecu_family = coalesce(nullif(trim(v_row ->> 'ecu_family'), ''), ecu_family),
          description = coalesce(nullif(v_row ->> 'description', ''), description),
          condition = v_condition,
          warranty_months = coalesce(nullif(v_row ->> 'warranty_months', '')::smallint, warranty_months),
          price_cents = v_price,
          weight_grams = coalesce(nullif(v_row ->> 'weight_grams', '')::integer, weight_grams),
          is_active = coalesce((v_row ->> 'active')::boolean, is_active)
        where id = v_product_id;
      end if;

      -- Stock: o ficheiro define o valor absoluto; registamos a diferença no log.
      if v_stock <> v_current_stock then
        insert into public.inventory_movements (product_id, delta, reason, note, actor_id)
        values (v_product_id, v_stock - v_current_stock, 'import', 'Importação em massa', v_uid);
      end if;

      insert into public.product_references (product_id, type, value, is_primary)
      values (v_product_id, 'hardware', v_hw, true)
      on conflict (product_id, type, value_normalized) do nothing;
      if nullif(trim(v_row ->> 'software_ref'), '') is not null then
        insert into public.product_references (product_id, type, value)
        values (v_product_id, 'software', trim(v_row ->> 'software_ref'))
        on conflict (product_id, type, value_normalized) do nothing;
      end if;
      foreach v_ref in array regexp_split_to_array(coalesce(v_row ->> 'oem_refs', ''), '\s*[;|,]\s*') loop
        if nullif(trim(v_ref), '') is not null then
          insert into public.product_references (product_id, type, value)
          values (v_product_id, 'oem', left(trim(v_ref), 64))
          on conflict (product_id, type, value_normalized) do nothing;
        end if;
      end loop;

      v_ok := v_ok + 1;
    exception when others then
      v_errors := v_errors || jsonb_build_object('row', v_idx, 'error', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('ok', v_ok, 'created', v_created,
                            'failed', jsonb_array_length(v_errors), 'errors', v_errors);
end;
$$;
revoke execute on function public.import_products(jsonb) from public, anon;
grant execute on function public.import_products(jsonb) to authenticated;
