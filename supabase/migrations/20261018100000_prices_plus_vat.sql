-- Preços das peças passam a ser SEM IVA ("+ IVA"): o IVA (23%) soma-se ao subtotal.
-- Os portes continuam a ser um valor final (já com IVA, tal como a Packlink cobra).
--   total = subtotal (s/ IVA) + IVA sobre o subtotal + portes
-- As encomendas antigas (preços com IVA incluído) ficam marcadas com vat_included = true.

alter table public.orders add column if not exists vat_included boolean not null default false;
update public.orders set vat_included = true;

alter table public.orders drop constraint if exists orders_check;
alter table public.orders add constraint orders_check check (
  total_cents = subtotal_cents + shipping_cents + case when vat_included then 0 else vat_cents end
);

create or replace function public.place_order(p_order jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
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
    if v_product.price_cents is null then raise exception 'price_on_request'; end if;
    v_subtotal := v_subtotal + v_product.price_cents * v_qty;
    v_weight := v_weight + v_product.weight_grams * v_qty;
  end loop;

  select r.id, r.price_cents, r.service_level, r.carrier into v_rate
  from public.shipping_rates r
  join public.shipping_zones z on z.id = r.zone_id
  where r.id = (p_order ->> 'shipping_rate_id')::uuid
    and r.is_active
    and v_country::char(2) = any(z.country_codes)
    and v_weight >= r.min_weight_g and v_weight < r.max_weight_g;
  if not found then raise exception 'shipping_unavailable'; end if;

  select coalesce((select (value #>> '{}')::numeric from public.store_settings where key = 'vat_rate'), 23)
    into v_vat;
  v_vat_cents := round(v_subtotal * v_vat / 100)::integer;
  v_total := v_subtotal + v_vat_cents + v_rate.price_cents;

  insert into public.orders (
    user_id, email, phone, subtotal_cents, shipping_cents, total_cents, vat_rate, vat_cents, vat_included,
    shipping_rate_id, service_level, shipping_address, billing_address,
    company_name, vat_number, customer_notes
  ) values (
    nullif(p_order ->> 'user_id', '')::uuid, v_email, nullif(p_order ->> 'phone', ''),
    v_subtotal, v_rate.price_cents, v_total, v_vat, v_vat_cents, false,
    v_rate.id, v_rate.service_level, p_order -> 'shipping_address',
    coalesce(p_order -> 'billing_address', p_order -> 'shipping_address'),
    nullif(p_order ->> 'company_name', ''), nullif(p_order ->> 'vat_number', ''),
    nullif(p_order ->> 'notes', '')
  )
  returning id, order_code into v_order_id, v_code;

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

  insert into public.email_outbox (type, to_email, payload)
  values ('order_confirmation', v_email, jsonb_build_object(
    'order_code', v_code, 'items', v_lines, 'subtotal_cents', v_subtotal,
    'shipping_cents', v_rate.price_cents, 'total_cents', v_total, 'vat_cents', v_vat_cents,
    'vat_rate', v_vat, 'carrier', v_rate.carrier, 'service_level', v_rate.service_level));

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
$function$;
