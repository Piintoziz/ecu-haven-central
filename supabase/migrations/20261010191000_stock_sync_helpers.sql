-- Complementos ao modelo de stock simples.

-- 1) refresh_product: categoria detetada quando vazia e tipo da referência principal
do $$
declare def text;
begin
  select pg_get_functiondef('private.refresh_product(uuid)'::regprocedure) into def;
  def := replace(def,
    '  update public.products set
    title = left(trim(v_title), 200),',
    '  update public.product_references set
    type = case when private.detect_manufacturer(v_norm) is null then ''oem'' else ''hardware'' end::public.reference_type
  where product_id = p_id and is_primary and type in (''hardware'', ''oem'');

  update public.products set
    category_id = coalesce(category_id,
      (select c.id from public.categories c where c.slug = private.detect_category(v_norm))),
    title = left(trim(v_title), 200),');
  execute def;
end $$;

-- O rótulo do título usa a categoria detetada quando ainda não há categoria.
do $$
declare def text;
begin
  select pg_get_functiondef('private.refresh_product(uuid)'::regprocedure) into def;
  def := replace(def,
    '  from public.categories c where c.id = v.category_id;',
    '  from public.categories c
  where c.id = coalesce(v.category_id,
    (select c2.id from public.categories c2 where c2.slug = private.detect_category(v_norm)));');
  execute def;
end $$;

-- 2) import_stock: publicar (ou não) as peças novas
do $$
declare def text;
begin
  select pg_get_functiondef('public.import_stock(jsonb)'::regprocedure) into def;
  def := replace(def,
    'v_price, true, v_code, v_key, nullif(v_row ->> ''notes'', ''''))',
    'v_price, coalesce((v_row ->> ''active'')::boolean, true), v_code, v_key, nullif(v_row ->> ''notes'', ''''))');
  execute def;
end $$;

-- 3) Sincronização total: peças que não vêm no ficheiro ficam com stock 0
create or replace function public.zero_missing_stock(p_keys text[])
returns integer
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  n integer;
begin
  if not private.is_staff(v_uid) then raise exception 'forbidden'; end if;
  if coalesce(array_length(p_keys, 1), 0) < 1 then raise exception 'empty_keys'; end if;
  insert into public.inventory_movements (product_id, delta, reason, note, actor_id)
  select p.id, -p.stock_quantity, 'adjustment', 'Não consta no Excel de stock', v_uid
  from public.products p
  where p.ref_key is not null and p.stock_quantity > 0 and not (p.ref_key = any (p_keys));
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke execute on function public.zero_missing_stock(text[]) from public, anon;
grant execute on function public.zero_missing_stock(text[]) to authenticated;

-- 4) Painel: quantas peças publicadas ainda não têm preço
do $$
declare def text;
begin
  select pg_get_functiondef('public.admin_dashboard(integer)'::regprocedure) into def;
  def := replace(def,
    '''new_messages'', (select count(*) from public.contact_messages m where m.status = ''new''),',
    '''new_messages'', (select count(*) from public.contact_messages m where m.status = ''new''),
    ''no_price'', (select count(*) from public.products p where p.is_active and p.price_cents is null),');
  execute def;
end $$;
