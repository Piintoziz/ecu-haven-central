-- =============================================================================
-- Funções de catálogo (pesquisa, ficha, facetas, portes) e checkout atómico.
-- Funções de leitura: SECURITY INVOKER -> RLS aplica-se ao visitante.
-- place_order: SECURITY DEFINER, só service_role (chamado pelo servidor).
-- =============================================================================

-- Definições da loja (IVA, email de notificações administrativas, ...)
create table public.store_settings (
  key text primary key check (key ~ '^[a-z_]{2,40}$'),
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.store_settings enable row level security;
revoke all on public.store_settings from anon;
revoke insert, delete on public.store_settings from authenticated;
create trigger store_settings_updated_at before update on public.store_settings
  for each row execute function public.set_updated_at();
create policy "store_settings: staff lê" on public.store_settings for select to authenticated
  using (private.is_staff((select auth.uid())));
create policy "store_settings: admin atualiza" on public.store_settings for update to authenticated
  using (private.has_role((select auth.uid()), 'admin'))
  with check (private.has_role((select auth.uid()), 'admin'));

insert into public.store_settings (key, value) values ('vat_rate', '23'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Cartão de produto (JSON público, sem campos internos)
-- ---------------------------------------------------------------------------
create or replace function public.product_card(p public.products)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p.id,
    'slug', p.slug,
    'title', p.title,
    'ecu_family', p.ecu_family,
    'condition', p.condition,
    'warranty_months', p.warranty_months,
    'price_cents', p.price_cents,
    'stock_quantity', p.stock_quantity,
    'weight_grams', p.weight_grams,
    'manufacturer', (select jsonb_build_object('slug', m.slug, 'name', m.name)
                     from public.ecu_manufacturers m where m.id = p.manufacturer_id),
    'category', (select jsonb_build_object('slug', c.slug, 'name', c.name, 'short_code', c.short_code)
                 from public.categories c where c.id = p.category_id),
    'references', coalesce((select jsonb_agg(jsonb_build_object('type', r.type, 'value', r.value)
                                             order by r.is_primary desc, r.type, r.value)
                            from public.product_references r where r.product_id = p.id), '[]'::jsonb),
    'image', (select i.storage_path from public.product_images i
              where i.product_id = p.id order by i.position limit 1),
    'brands', coalesce((select jsonb_agg(distinct vb.name)
                        from public.product_compatibility pc
                        join public.vehicle_models vm on vm.id = pc.vehicle_model_id
                        join public.vehicle_brands vb on vb.id = vm.brand_id
                        where pc.product_id = p.id), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------
-- Pesquisa de catálogo (referência normalizada + texto + filtros)
-- ---------------------------------------------------------------------------
create or replace function public.search_catalog(
  p_q text default null,
  p_category text default null,
  p_manufacturer text default null,
  p_brand text default null,
  p_condition public.product_condition default null,
  p_in_stock boolean default false,
  p_sort text default 'relevance',
  p_limit integer default 24,
  p_offset integer default 0
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with params as (
    select
      nullif(public.normalize_reference(p_q), '') as norm,
      nullif(regexp_replace(trim(coalesce(p_q, '')), '[%_\\]', '', 'g'), '') as raw,
      least(greatest(coalesce(p_limit, 24), 1), 60) as lim,
      greatest(coalesce(p_offset, 0), 0) as off
  ),
  filtered as (
    select p.*,
      case
        when params.norm is null then 0
        when exists (select 1 from public.product_references r
                     where r.product_id = p.id and r.value_normalized = params.norm) then 3
        when exists (select 1 from public.product_references r
                     where r.product_id = p.id and r.value_normalized like params.norm || '%') then 2
        else 1
      end as rank
    from public.products p
    cross join params
    left join public.categories c on c.id = p.category_id
    left join public.ecu_manufacturers m on m.id = p.manufacturer_id
    where p.is_active
      and (p_category is null or c.slug = p_category)
      and (p_manufacturer is null or m.slug = p_manufacturer)
      and (p_condition is null or p.condition = p_condition)
      and (not coalesce(p_in_stock, false) or p.stock_quantity > 0)
      and (p_brand is null or exists (
            select 1 from public.product_compatibility pc
            join public.vehicle_models vm on vm.id = pc.vehicle_model_id
            join public.vehicle_brands vb on vb.id = vm.brand_id
            where pc.product_id = p.id and vb.slug = p_brand))
      and (params.raw is null
           or (params.norm is not null and exists (
                 select 1 from public.product_references r
                 where r.product_id = p.id and r.value_normalized like '%' || params.norm || '%'))
           or p.search_vector @@ plainto_tsquery('simple', params.raw)
           or p.title ilike '%' || params.raw || '%'
           or p.ecu_family ilike '%' || params.raw || '%')
  ),
  page as (
    select f.id, row_number() over (
      order by
        case when p_sort = 'relevance' then f.rank end desc nulls last,
        case when p_sort = 'price_asc' then f.price_cents end asc nulls last,
        case when p_sort = 'price_desc' then f.price_cents end desc nulls last,
        (f.stock_quantity > 0) desc,
        f.created_at desc,
        f.id
    ) as ord
    from filtered f
    order by ord
    limit (select lim from params) offset (select off from params)
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'items', coalesce((
      select jsonb_agg(public.product_card(p) order by pg.ord)
      from page pg join public.products p on p.id = pg.id), '[]'::jsonb)
  );
$$;

-- Sugestões rápidas para a barra de pesquisa
create or replace function public.suggest_products(p_q text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with n as (select public.normalize_reference(p_q) as norm)
  select coalesce(jsonb_agg(s order by s->>'rank' desc, s->>'title'), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'slug', p.slug,
      'title', p.title,
      'reference', r.value,
      'manufacturer', m.name,
      'rank', case when r.value_normalized = n.norm then 2 else 1 end
    ) as s
    from n
    join public.product_references r on char_length(n.norm) >= 3
      and r.value_normalized like n.norm || '%'
    join public.products p on p.id = r.product_id and p.is_active
    left join public.ecu_manufacturers m on m.id = p.manufacturer_id
    limit 8
  ) x;
$$;

-- Ficha de produto completa por slug
create or replace function public.get_product(p_slug text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select public.product_card(p) || jsonb_build_object(
    'description', p.description,
    'seo_title', p.seo_title,
    'seo_description', p.seo_description,
    'updated_at', p.updated_at,
    'images', coalesce((select jsonb_agg(jsonb_build_object('path', i.storage_path, 'alt', i.alt) order by i.position)
                        from public.product_images i where i.product_id = p.id), '[]'::jsonb),
    'compatibility', coalesce((
      select jsonb_agg(jsonb_build_object(
        'brand', vb.name, 'brand_slug', vb.slug, 'model', vm.name, 'generation', vm.generation,
        'year_from', vm.year_from, 'year_to', vm.year_to, 'engine_code', vm.engine_code,
        'engine', vm.engine_description, 'fuel', vm.fuel, 'notes', pc.notes)
        order by vb.name, vm.name, vm.year_from)
      from public.product_compatibility pc
      join public.vehicle_models vm on vm.id = pc.vehicle_model_id
      join public.vehicle_brands vb on vb.id = vm.brand_id
      where pc.product_id = p.id), '[]'::jsonb),
    'related', coalesce((
      select jsonb_agg(public.product_card(x)
               order by (x.ecu_family is not distinct from p.ecu_family) desc,
                        (x.stock_quantity > 0) desc, x.created_at desc)
      from public.products x
      where x.id in (
        select y.id from public.products y
        where y.is_active and y.id <> p.id
          and (y.category_id = p.category_id or y.ecu_family = p.ecu_family)
        order by (y.ecu_family is not distinct from p.ecu_family) desc,
                 (y.stock_quantity > 0) desc, y.created_at desc
        limit 4)), '[]'::jsonb)
  )
  from public.products p
  where p.slug = p_slug and p.is_active;
$$;

-- Facetas (contagens apenas de produtos ativos)
create or replace function public.catalog_facets()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'total', (select count(*) from public.products where is_active),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('slug', c.slug, 'name', c.name, 'short_code', c.short_code,
                                          'description', c.description, 'count', cnt) order by c.position, c.name)
      from (select c.*, (select count(*) from public.products p where p.category_id = c.id and p.is_active) as cnt
            from public.categories c) c), '[]'::jsonb),
    'manufacturers', coalesce((
      select jsonb_agg(jsonb_build_object('slug', m.slug, 'name', m.name, 'count', cnt) order by m.name)
      from (select m.*, (select count(*) from public.products p where p.manufacturer_id = m.id and p.is_active) as cnt
            from public.ecu_manufacturers m) m where cnt > 0), '[]'::jsonb),
    'brands', coalesce((
      select jsonb_agg(jsonb_build_object('slug', b.slug, 'name', b.name, 'count', cnt) order by b.name)
      from (select b.*, (select count(distinct pc.product_id)
                          from public.product_compatibility pc
                          join public.vehicle_models vm on vm.id = pc.vehicle_model_id
                          join public.products p on p.id = pc.product_id and p.is_active
                          where vm.brand_id = b.id) as cnt
            from public.vehicle_brands b) b where cnt > 0), '[]'::jsonb)
  );
$$;

-- Slugs para o sitemap
create or replace function public.sitemap_products()
returns table (slug text, updated_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.slug, p.updated_at from public.products p where p.is_active order by p.updated_at desc limit 50000;
$$;

-- Opções de envio para um país e um carrinho (peso calculado no servidor)
create or replace function public.shipping_quote(p_country text, p_items jsonb)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with items as (
    select (e->>'product_id')::uuid as product_id, least(greatest((e->>'quantity')::int, 1), 10) as qty
    from jsonb_array_elements(case when jsonb_typeof(p_items) = 'array' then p_items else '[]'::jsonb end) e
    limit 20
  ),
  w as (
    select coalesce(sum(p.weight_grams * i.qty), 0) as grams
    from items i join public.products p on p.id = i.product_id and p.is_active
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', r.id, 'carrier', r.carrier, 'service_level', r.service_level,
      'price_cents', r.price_cents, 'est_days_min', r.est_days_min, 'est_days_max', r.est_days_max)
      order by r.service_level, r.price_cents), '[]'::jsonb)
  from public.shipping_rates r
  join public.shipping_zones z on z.id = r.zone_id
  cross join w
  where r.is_active
    and upper(p_country)::char(2) = any(z.country_codes)
    and w.grams >= r.min_weight_g and w.grams < r.max_weight_g;
$$;

grant execute on function public.product_card(public.products) to anon, authenticated;
grant execute on function public.search_catalog(text, text, text, text, public.product_condition, boolean, text, integer, integer) to anon, authenticated;
grant execute on function public.suggest_products(text) to anon, authenticated;
grant execute on function public.get_product(text) to anon, authenticated;
grant execute on function public.catalog_facets() to anon, authenticated;
grant execute on function public.sitemap_products() to anon, authenticated;
grant execute on function public.shipping_quote(text, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Checkout atómico: recalcula preços, portes e IVA; reserva stock; enfileira emails
-- ---------------------------------------------------------------------------
create or replace function public.place_order(p_order jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_items jsonb := p_order -> 'items';
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_subtotal integer := 0;
  v_weight integer := 0;
  v_rate record;
  v_vat numeric(5,2);
  v_total integer;
  v_vat_cents integer;
  v_order_id uuid;
  v_code text;
  v_ref text;
  v_lines jsonb := '[]'::jsonb;
  v_country text := upper(p_order -> 'shipping_address' ->> 'country_code');
  v_email text := lower(trim(p_order ->> 'email'));
  v_admin_email text;
begin
  if jsonb_typeof(v_items) is distinct from 'array'
     or jsonb_array_length(v_items) = 0 or jsonb_array_length(v_items) > 20 then
    raise exception 'invalid_items';
  end if;
  if (select count(distinct e ->> 'product_id') from jsonb_array_elements(v_items) e)
     <> jsonb_array_length(v_items) then
    raise exception 'duplicate_items';
  end if;

  -- 1) validar produtos e stock (lock por ordem determinística)
  for v_item in select e from jsonb_array_elements(v_items) e order by e ->> 'product_id' loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 10 then
      raise exception 'invalid_quantity';
    end if;
    select * into v_product from public.products
      where id = (v_item ->> 'product_id')::uuid and is_active
      for update;
    if not found then raise exception 'product_unavailable'; end if;
    if v_product.stock_quantity < v_qty then raise exception 'insufficient_stock'; end if;
    v_subtotal := v_subtotal + v_product.price_cents * v_qty;
    v_weight := v_weight + v_product.weight_grams * v_qty;
  end loop;

  -- 2) portes válidos para o país e peso
  select r.id, r.price_cents, r.service_level, r.carrier into v_rate
  from public.shipping_rates r
  join public.shipping_zones z on z.id = r.zone_id
  where r.id = (p_order ->> 'shipping_rate_id')::uuid
    and r.is_active
    and v_country::char(2) = any(z.country_codes)
    and v_weight >= r.min_weight_g and v_weight < r.max_weight_g;
  if not found then raise exception 'shipping_unavailable'; end if;

  -- 3) totais com IVA incluído
  select coalesce((select (value #>> '{}')::numeric from public.store_settings where key = 'vat_rate'), 23)
    into v_vat;
  v_total := v_subtotal + v_rate.price_cents;
  v_vat_cents := round(v_total * v_vat / (100 + v_vat))::integer;

  insert into public.orders (
    user_id, email, phone, subtotal_cents, shipping_cents, total_cents, vat_rate, vat_cents,
    shipping_rate_id, service_level, shipping_address, billing_address,
    company_name, vat_number, customer_notes
  ) values (
    nullif(p_order ->> 'user_id', '')::uuid, v_email, nullif(p_order ->> 'phone', ''),
    v_subtotal, v_rate.price_cents, v_total, v_vat, v_vat_cents,
    v_rate.id, v_rate.service_level, p_order -> 'shipping_address',
    coalesce(p_order -> 'billing_address', p_order -> 'shipping_address'),
    nullif(p_order ->> 'company_name', ''), nullif(p_order ->> 'vat_number', ''),
    nullif(p_order ->> 'notes', '')
  )
  returning id, order_code into v_order_id, v_code;

  -- 4) linhas (snapshot) + saída de stock
  for v_item in select e from jsonb_array_elements(v_items) e loop
    v_qty := (v_item ->> 'quantity')::integer;
    select * into v_product from public.products where id = (v_item ->> 'product_id')::uuid;
    select r.value into v_ref from public.product_references r
      where r.product_id = v_product.id
      order by r.is_primary desc, (r.type = 'hardware') desc, r.created_at
      limit 1;

    insert into public.order_items (order_id, product_id, title_snapshot, reference_snapshot,
                                    condition_snapshot, unit_price_cents, quantity)
    values (v_order_id, v_product.id, v_product.title, coalesce(v_ref, v_product.slug),
            v_product.condition, v_product.price_cents, v_qty);

    insert into public.inventory_movements (product_id, delta, reason, reference_id, note)
    values (v_product.id, -v_qty, 'sale', v_order_id, v_code);

    v_lines := v_lines || jsonb_build_object('title', v_product.title, 'reference', coalesce(v_ref, ''),
                                             'quantity', v_qty, 'unit_price_cents', v_product.price_cents);
  end loop;

  -- 5) emails transacionais (processados de forma assíncrona)
  insert into public.email_outbox (type, to_email, payload)
  values ('order_confirmation', v_email, jsonb_build_object(
    'order_code', v_code, 'items', v_lines, 'subtotal_cents', v_subtotal,
    'shipping_cents', v_rate.price_cents, 'total_cents', v_total, 'vat_cents', v_vat_cents,
    'carrier', v_rate.carrier, 'service_level', v_rate.service_level));

  select value #>> '{}' into v_admin_email from public.store_settings where key = 'admin_email';
  if v_admin_email is not null and v_admin_email <> '' then
    insert into public.email_outbox (type, to_email, payload)
    values ('order_admin_new_sale', v_admin_email, jsonb_build_object(
      'order_code', v_code, 'order_id', v_order_id, 'total_cents', v_total, 'items', v_lines,
      'country', v_country));
  end if;

  return jsonb_build_object(
    'order_code', v_code, 'subtotal_cents', v_subtotal, 'shipping_cents', v_rate.price_cents,
    'total_cents', v_total, 'vat_cents', v_vat_cents, 'vat_rate', v_vat);
end;
$$;
revoke execute on function public.place_order(jsonb) from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to service_role;
