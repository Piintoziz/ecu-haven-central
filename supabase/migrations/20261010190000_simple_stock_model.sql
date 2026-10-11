-- =============================================================================
-- Modelo de stock simples (como a folha de Excel da equipa):
--   marca(s) do veículo · referência · código da etiqueta · quantidade · preço opcional
-- Tudo o resto (título, URL, fabricante da centralina, família, categoria,
-- texto para o Google) é calculado automaticamente.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Produtos: preço opcional ("sob consulta"), código da etiqueta, chave única
-- ---------------------------------------------------------------------------
alter table public.products alter column price_cents drop not null;
alter table public.products add column if not exists label_code text
  check (char_length(label_code) <= 40);
-- referência principal normalizada + '#' + código normalizado (evita duplicados)
alter table public.products add column if not exists ref_key text
  check (char_length(ref_key) <= 120);
create unique index if not exists products_ref_key_uidx on public.products (ref_key);

-- ---------------------------------------------------------------------------
-- Marcas do veículo ligadas diretamente ao produto (sem exigir modelo/motor)
-- ---------------------------------------------------------------------------
create table if not exists public.product_brands (
  product_id uuid not null references public.products (id) on delete cascade,
  vehicle_brand_id uuid not null references public.vehicle_brands (id) on delete cascade,
  primary key (product_id, vehicle_brand_id)
);
create index if not exists product_brands_brand_idx on public.product_brands (vehicle_brand_id);
alter table public.product_brands enable row level security;
revoke insert, update, delete on public.product_brands from anon;

create policy "product_brands: anon lê" on public.product_brands for select to anon
  using (exists (select 1 from public.products p where p.id = product_id and p.is_active));
create policy "product_brands: auth lê" on public.product_brands for select to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.is_active)
         or private.is_staff((select auth.uid())));
create policy "product_brands: staff insere" on public.product_brands for insert to authenticated
  with check (private.is_staff((select auth.uid())));
create policy "product_brands: staff apaga" on public.product_brands for delete to authenticated
  using (private.is_staff((select auth.uid())));

-- ---------------------------------------------------------------------------
-- Dados de referência em falta (marcas do Excel, fabricantes, pesados)
-- ---------------------------------------------------------------------------
insert into public.vehicle_brands (slug, name) values
  ('alfa-romeo', 'Alfa Romeo'), ('chevrolet', 'Chevrolet'), ('chrysler', 'Chrysler'),
  ('dacia', 'Dacia'), ('daewoo', 'Daewoo'), ('daihatsu', 'Daihatsu'), ('ferrari', 'Ferrari'),
  ('honda', 'Honda'), ('hyundai', 'Hyundai'), ('jaguar', 'Jaguar'), ('jeep', 'Jeep'),
  ('kia', 'Kia'), ('lancia', 'Lancia'), ('land-rover', 'Land Rover'), ('lexus', 'Lexus'),
  ('mazda', 'Mazda'), ('mitsubishi', 'Mitsubishi'), ('porsche', 'Porsche'), ('rover', 'Rover'),
  ('saab', 'Saab'), ('smart', 'Smart'), ('subaru', 'Subaru'), ('suzuki', 'Suzuki')
on conflict (slug) do nothing;

insert into public.ecu_manufacturers (slug, name) values
  ('hitachi', 'Hitachi'), ('mitsubishi-electric', 'Mitsubishi Electric'),
  ('lucas', 'Lucas'), ('sagem', 'Sagem')
on conflict (slug) do nothing;

insert into public.categories (slug, short_code, name, description, position) values
  ('pesados', 'HD', 'Camiões e pesados', 'Centralinas de motor e módulos para veículos pesados.', 7)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Deteção automática a partir da referência normalizada
-- ---------------------------------------------------------------------------
create or replace function private.detect_manufacturer(p_norm text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_norm ~ '^02(61|81|80|27|60|65|85|86)' then 'bosch'
    when p_norm ~ '^(IAW|6LP|MJD|61600|8GMK)' then 'magneti-marelli'
    when p_norm ~ '^(5WS|5WK|5WY|S1[0-9]{8}|K1[0-9]{8}|H1[0-9]{8}|SIM2K|A2C)' then 'siemens-vdo'
    when p_norm ~ '^(28[0-9]{6}$|DCM[0-9]|DDCR)' then 'delphi'
    when p_norm ~ '^((MB|TN)?0?79700|27[59][0-9]00)' then 'denso'
    when p_norm ~ '^(A1[18]|A56|A64|MEC)' then 'hitachi'
    when p_norm ~ '^(E2T|E6T)' then 'mitsubishi-electric'
    else null
  end;
$$;

create or replace function private.detect_category(p_norm text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_norm ~ '^0285' or p_norm ~ '^(95910|95920|89170|77960|98820)'
      or p_norm ~ '14B321|14B056' or p_norm ~ '^[0-9A-Z]{3}959655' then 'airbag'
    when p_norm ~ '^0265' then 'abs'
    when p_norm ~ '^0260' or p_norm ~ '^[0-9A-Z]{3}927[0-9]' then 'transmissao'
    when p_norm ~ '15K600|14A073' or p_norm ~ '^A[0-9]{3}(820|870|900|901|446|545)[0-9]'
      or p_norm ~ '^[0-9A-Z]{3}(937|959433)' then 'conforto'
    else 'motor'
  end;
$$;

-- Título, fabricante, família e URL calculados. O URL só é gerado uma vez
-- (enquanto for o provisório "p-<uuid>"), para nunca partir links indexados.
create or replace function private.refresh_product(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v public.products%rowtype;
  v_ref text;
  v_norm text;
  v_brands text;
  v_brand_slug text;
  v_maker_id uuid;
  v_maker text;
  v_label text;
  v_title text;
  v_slug text;
  v_base text;
  n integer := 1;
begin
  select * into v from public.products where id = p_id;
  if not found then return; end if;

  select r.value into v_ref from public.product_references r
  where r.product_id = p_id
  order by r.is_primary desc, (r.type in ('hardware', 'oem')) desc, r.created_at
  limit 1;
  v_norm := public.normalize_reference(coalesce(v_ref, ''));

  select string_agg(vb.name, ' / ' order by vb.name), min(vb.slug)
    into v_brands, v_brand_slug
  from public.product_brands pb join public.vehicle_brands vb on vb.id = pb.vehicle_brand_id
  where pb.product_id = p_id;

  -- fabricante da centralina: só preenche se estiver vazio
  v_maker_id := v.manufacturer_id;
  if v_maker_id is null then
    select m.id into v_maker_id from public.ecu_manufacturers m
    where m.slug = private.detect_manufacturer(v_norm);
  end if;
  select m.name into v_maker from public.ecu_manufacturers m where m.id = v_maker_id;

  select case c.slug
           when 'motor' then 'Centralina de motor'
           when 'abs' then 'Módulo ABS/ESP'
           when 'airbag' then 'Módulo airbag'
           when 'transmissao' then 'Centralina de caixa (TCU)'
           when 'conforto' then 'Módulo de conforto/BCM'
           when 'imobilizador' then 'Módulo imobilizador'
           when 'pesados' then 'Centralina de camião'
           else 'Centralina' end
    into v_label
  from public.categories c where c.id = v.category_id;

  v_title := concat_ws(' ',
    coalesce(v_label, 'Centralina'),
    coalesce(v_maker, v_brands),
    coalesce(v_ref, ''),
    case when nullif(v.label_code, '') is not null then '· ' || v.label_code end,
    case when v_maker is not null and v_brands is not null then '— ' || v_brands end);

  v_slug := v.slug;
  if v_slug ~ '^p-[0-9a-f]{32}$' then
    v_base := private.slugify(concat_ws('-', coalesce(v_brand_slug, (select m.slug from public.ecu_manufacturers m where m.id = v_maker_id)),
                                        lower(v_norm), lower(public.normalize_reference(coalesce(v.label_code, '')))));
    v_base := left(coalesce(nullif(v_base, ''), 'centralina'), 100);
    v_slug := v_base;
    while exists (select 1 from public.products x where x.slug = v_slug and x.id <> p_id) loop
      n := n + 1;
      v_slug := v_base || '-' || n;
    end loop;
  end if;

  update public.products set
    title = left(trim(v_title), 200),
    manufacturer_id = v_maker_id,
    ecu_family = coalesce(ecu_family,
      case when upper(v_ref) ~ '^IAW\s*[0-9]+[A-Z]*' then 'IAW ' || substring(upper(v_ref) from '^IAW\s*([0-9]+[A-Z]*)') end),
    slug = v_slug,
    ref_key = case when v_norm <> '' then v_norm || '#' || public.normalize_reference(coalesce(v.label_code, '')) else ref_key end
  where id = p_id;
end;
$$;
-- schema private não é exposto pela API; corre com as permissões (RLS) de quem chama
revoke execute on function private.refresh_product(uuid) from public, anon;
grant execute on function private.refresh_product(uuid) to authenticated, service_role;
grant execute on function private.detect_manufacturer(text) to authenticated, service_role;
grant execute on function private.detect_category(text) to authenticated, service_role;

-- Chamada pelo backoffice depois de guardar um produto (só staff).
create or replace function public.admin_refresh_product(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not private.is_staff((select auth.uid())) then raise exception 'forbidden'; end if;
  perform private.refresh_product(p_id);
end;
$$;
revoke execute on function public.admin_refresh_product(uuid) from public, anon;
grant execute on function public.admin_refresh_product(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Importação do Excel de stock (lotes até 500 linhas já agregadas no browser)
-- linha: { brands: [slug], reference, alt_refs: [..], code, quantity,
--          price_eur?, category?, condition?, notes? }
-- O ficheiro define o stock absoluto; preços/estado já editados não são apagados.
-- ---------------------------------------------------------------------------
create or replace function public.import_stock(p_rows jsonb)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_row jsonb;
  v_idx integer := 0;
  v_ok integer := 0;
  v_created integer := 0;
  v_errors jsonb := '[]'::jsonb;
  v_ref text;
  v_code text;
  v_norm text;
  v_key text;
  v_id uuid;
  v_stock integer;
  v_qty integer;
  v_price integer;
  v_cat uuid;
  v_alt text;
  v_maker text;
begin
  if not private.is_staff(v_uid) then raise exception 'forbidden'; end if;
  if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows) > 500 then
    raise exception 'invalid_rows';
  end if;

  for v_row in select e from jsonb_array_elements(p_rows) e loop
    v_idx := v_idx + 1;
    begin
      v_ref := left(trim(v_row ->> 'reference'), 64);
      v_code := nullif(left(trim(coalesce(v_row ->> 'code', '')), 40), '');
      v_norm := public.normalize_reference(v_ref);
      if v_norm = '' then raise exception 'Referência em falta'; end if;
      v_qty := coalesce((v_row ->> 'quantity')::integer, 0);
      if v_qty < 0 then raise exception 'Quantidade negativa'; end if;
      v_price := case when nullif(v_row ->> 'price_eur', '') is not null
                      then round((v_row ->> 'price_eur')::numeric * 100)::integer end;
      v_key := v_norm || '#' || public.normalize_reference(coalesce(v_code, ''));
      v_maker := private.detect_manufacturer(v_norm);

      select c.id into v_cat from public.categories c
      where c.slug = coalesce(nullif(v_row ->> 'category', ''), private.detect_category(v_norm));

      select id, stock_quantity into v_id, v_stock from public.products where ref_key = v_key;

      if v_id is null then
        insert into public.products (slug, title, category_id, condition, price_cents, is_active,
                                     label_code, ref_key, description)
        values ('p-' || replace(gen_random_uuid()::text, '-', ''), v_ref, v_cat,
                coalesce(nullif(v_row ->> 'condition', ''), 'used_tested')::public.product_condition,
                v_price, true, v_code, v_key, nullif(v_row ->> 'notes', ''))
        returning id into v_id;
        v_stock := 0;
        v_created := v_created + 1;
        insert into public.product_references (product_id, type, value, is_primary)
        values (v_id, case when v_maker is null then 'oem' else 'hardware' end::public.reference_type, v_ref, true);
      else
        update public.products set
          label_code = coalesce(v_code, label_code),
          price_cents = coalesce(v_price, price_cents),
          category_id = case when nullif(v_row ->> 'category', '') is not null then v_cat else category_id end
        where id = v_id;
      end if;

      -- referências alternativas (ex.: 0 261 203 650/651) e código pesquisável
      for v_alt in select jsonb_array_elements_text(coalesce(v_row -> 'alt_refs', '[]'::jsonb)) loop
        if public.normalize_reference(v_alt) not in ('', v_norm) then
          insert into public.product_references (product_id, type, value)
          values (v_id, 'alternative', left(trim(v_alt), 64))
          on conflict (product_id, type, value_normalized) do nothing;
        end if;
      end loop;
      if v_code is not null and char_length(public.normalize_reference(v_code)) >= 4 then
        insert into public.product_references (product_id, type, value)
        values (v_id, 'alternative', v_code)
        on conflict (product_id, type, value_normalized) do nothing;
      end if;

      insert into public.product_brands (product_id, vehicle_brand_id)
      select v_id, vb.id from public.vehicle_brands vb
      where vb.slug in (select jsonb_array_elements_text(coalesce(v_row -> 'brands', '[]'::jsonb)))
      on conflict do nothing;

      if v_qty <> v_stock then
        insert into public.inventory_movements (product_id, delta, reason, note, actor_id)
        values (v_id, v_qty - v_stock, 'import', 'Importação do Excel de stock', v_uid);
      end if;

      perform private.refresh_product(v_id);
      v_ok := v_ok + 1;
    exception when others then
      v_errors := v_errors || jsonb_build_object('row', v_idx, 'error', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('ok', v_ok, 'created', v_created,
                            'failed', jsonb_array_length(v_errors), 'errors', v_errors);
end;
$$;
revoke execute on function public.import_stock(jsonb) from public, anon;
grant execute on function public.import_stock(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Leituras públicas: marcas diretas + preço opcional + código
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
    'label_code', p.label_code,
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
    'brands', coalesce((select jsonb_agg(x.name order by x.name) from (
                          select vb.name from public.product_brands pb
                          join public.vehicle_brands vb on vb.id = pb.vehicle_brand_id
                          where pb.product_id = p.id
                          union
                          select vb.name from public.product_compatibility pc
                          join public.vehicle_models vm on vm.id = pc.vehicle_model_id
                          join public.vehicle_brands vb on vb.id = vm.brand_id
                          where pc.product_id = p.id) x), '[]'::jsonb)
  );
$$;

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
      and (p_brand is null
           or exists (select 1 from public.product_brands pb
                      join public.vehicle_brands vb on vb.id = pb.vehicle_brand_id
                      where pb.product_id = p.id and vb.slug = p_brand)
           or exists (select 1 from public.product_compatibility pc
                      join public.vehicle_models vm on vm.id = pc.vehicle_model_id
                      join public.vehicle_brands vb on vb.id = vm.brand_id
                      where pc.product_id = p.id and vb.slug = p_brand))
      and (params.raw is null
           or (params.norm is not null and exists (
                 select 1 from public.product_references r
                 where r.product_id = p.id and r.value_normalized like '%' || params.norm || '%'))
           or p.search_vector @@ plainto_tsquery('simple', params.raw)
           or p.title ilike '%' || params.raw || '%'
           or p.ecu_family ilike '%' || params.raw || '%'
           or p.label_code ilike params.raw)
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
      from (select b.*, (select count(distinct x.product_id) from (
                            select pb.product_id from public.product_brands pb where pb.vehicle_brand_id = b.id
                            union
                            select pc.product_id from public.product_compatibility pc
                            join public.vehicle_models vm on vm.id = pc.vehicle_model_id
                            where vm.brand_id = b.id) x
                          join public.products p on p.id = x.product_id and p.is_active) as cnt
            from public.vehicle_brands b) b where cnt > 0), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------
-- Checkout: peças "sob consulta" não podem ser compradas diretamente
-- ---------------------------------------------------------------------------
do $$
declare def text;
begin
  select pg_get_functiondef('public.place_order(jsonb)'::regprocedure) into def;
  def := replace(def,
    'if v_product.stock_quantity < v_qty then raise exception ''insufficient_stock''; end if;',
    'if v_product.stock_quantity < v_qty then raise exception ''insufficient_stock''; end if;
    if v_product.price_cents is null then raise exception ''price_on_request''; end if;');
  execute def;
end $$;

-- ---------------------------------------------------------------------------
-- Produtos existentes: chave única a partir da referência principal
-- ---------------------------------------------------------------------------
update public.products p set ref_key = public.normalize_reference(r.value) || '#'
from public.product_references r
where r.product_id = p.id and r.is_primary and p.ref_key is null;
