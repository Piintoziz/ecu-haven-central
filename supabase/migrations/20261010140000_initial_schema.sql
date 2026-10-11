-- =============================================================================
-- Centralinas — esquema inicial (catálogo, inventário, clientes, encomendas,
-- logística, contactos). RLS ativo em TODAS as tabelas.
-- Decisões: moeda única EUR · preços com IVA incluído · checkout como convidado
-- · URL canónico /centralinas/[slug] (slug = fabricante + referência hardware).
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('admin', 'staff', 'customer');
create type public.product_condition as enum ('new', 'used_tested', 'reconditioned');
create type public.reference_type as enum ('hardware', 'software', 'oem', 'alternative');
create type public.order_status as enum (
  'pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
);
create type public.payment_status as enum ('pending', 'authorized', 'captured', 'failed', 'refunded');
create type public.shipment_status as enum (
  'label_created', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'returned'
);
create type public.service_level as enum ('standard', 'express');
create type public.customer_type as enum ('b2c', 'b2b');
create type public.inventory_reason as enum ('import', 'sale', 'adjustment', 'return', 'cancellation');

-- ---------------------------------------------------------------------------
-- Funções utilitárias
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- "0 281 010-123" -> "0281010123"
create or replace function public.normalize_reference(ref text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select upper(regexp_replace(coalesce(ref, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

-- ---------------------------------------------------------------------------
-- Papéis (tabela separada de profiles -> impede auto-promoção)
-- ---------------------------------------------------------------------------
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('admin', 'staff')
  );
$$;

revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.is_staff(uuid) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;
grant execute on function public.is_staff(uuid) to authenticated, service_role;

create policy "user_roles: ver os próprios papéis"
  on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()));
create policy "user_roles: admin vê todos"
  on public.user_roles for select to authenticated
  using (public.has_role((select auth.uid()), 'admin'));
-- Sem políticas de escrita: papéis só são atribuídos via service role.

-- ---------------------------------------------------------------------------
-- Perfis e moradas
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  phone text check (char_length(phone) <= 32),
  company_name text check (char_length(company_name) <= 160),
  vat_number text check (char_length(vat_number) <= 32),
  customer_type public.customer_type not null default 'b2c',
  locale text not null default 'pt' check (locale ~ '^[a-z]{2}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create policy "profiles: dono lê"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_staff((select auth.uid())));
create policy "profiles: dono atualiza"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Whitelist de colunas editáveis pelo cliente (anti mass-assignment)
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, phone, company_name, vat_number, customer_type, locale)
  on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(new.raw_user_meta_data ->> 'full_name', 120));
  insert into public.user_roles (user_id, role) values (new.id, 'customer');
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text check (char_length(label) <= 60),
  full_name text not null check (char_length(full_name) between 1 and 120),
  company_name text check (char_length(company_name) <= 160),
  line1 text not null check (char_length(line1) between 1 and 200),
  line2 text check (char_length(line2) <= 200),
  city text not null check (char_length(city) between 1 and 100),
  postal_code text not null check (char_length(postal_code) between 1 and 20),
  region text check (char_length(region) <= 100),
  country_code char(2) not null check (country_code ~ '^[A-Z]{2}$'),
  phone text check (char_length(phone) <= 32),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.addresses enable row level security;
create index addresses_user_id_idx on public.addresses (user_id);
create trigger addresses_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();

create policy "addresses: dono lê" on public.addresses for select to authenticated
  using (user_id = (select auth.uid()));
create policy "addresses: dono cria" on public.addresses for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "addresses: dono atualiza" on public.addresses for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "addresses: dono apaga" on public.addresses for delete to authenticated
  using (user_id = (select auth.uid()));
revoke all on public.addresses from anon;

-- ---------------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------------
create table public.ecu_manufacturers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.vehicle_brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.vehicle_models (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.vehicle_brands (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120),
  generation text check (char_length(generation) <= 60),
  year_from smallint check (year_from between 1970 and 2100),
  year_to smallint check (year_to between 1970 and 2100),
  engine_code text check (char_length(engine_code) <= 40),
  engine_description text check (char_length(engine_description) <= 120),
  fuel text check (fuel in ('diesel', 'petrol', 'hybrid', 'electric', 'lpg', 'cng')),
  created_at timestamptz not null default now(),
  unique (brand_id, slug)
);
create index vehicle_models_brand_id_idx on public.vehicle_models (brand_id);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_code text check (char_length(short_code) <= 8),
  name text not null check (char_length(name) between 1 and 80),
  description text check (char_length(description) <= 500),
  position smallint not null default 0,
  created_at timestamptz not null default now()
);
create index categories_parent_id_idx on public.categories (parent_id);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sku text unique check (char_length(sku) <= 64),
  manufacturer_id uuid references public.ecu_manufacturers (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  ecu_family text check (char_length(ecu_family) <= 60), -- ex.: EDC16C34, MED17.5, SID807
  description text check (char_length(description) <= 10000),
  condition public.product_condition not null default 'used_tested',
  warranty_months smallint not null default 12 check (warranty_months between 0 and 60),
  price_cents integer not null check (price_cents >= 0), -- IVA incluído
  currency char(3) not null default 'EUR' check (currency = 'EUR'),
  weight_grams integer not null default 500 check (weight_grams > 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default false,
  seo_title text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 170),
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(ecu_family, '') || ' ' || coalesce(sku, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_manufacturer_id_idx on public.products (manufacturer_id);
create index products_category_id_idx on public.products (category_id);
create index products_active_idx on public.products (is_active, created_at desc);
create index products_search_idx on public.products using gin (search_vector);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_references (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  type public.reference_type not null,
  value text not null check (char_length(value) between 1 and 64),
  value_normalized text generated always as (public.normalize_reference(value)) stored,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, type, value_normalized)
);
create index product_references_product_id_idx on public.product_references (product_id);
create index product_references_norm_idx on public.product_references (value_normalized);
create index product_references_trgm_idx on public.product_references
  using gin (value_normalized extensions.gin_trgm_ops);

create table public.product_compatibility (
  product_id uuid not null references public.products (id) on delete cascade,
  vehicle_model_id uuid not null references public.vehicle_models (id) on delete cascade,
  notes text check (char_length(notes) <= 300),
  primary key (product_id, vehicle_model_id)
);
create index product_compatibility_model_idx on public.product_compatibility (vehicle_model_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null check (storage_path ~ '^[0-9a-f-]{36}\.(webp|jpg|png)$'),
  alt text check (char_length(alt) <= 200),
  position smallint not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_id_idx on public.product_images (product_id, position);

-- RLS do catálogo: leitura pública do que está ativo; escrita só staff
alter table public.ecu_manufacturers enable row level security;
alter table public.vehicle_brands enable row level security;
alter table public.vehicle_models enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_references enable row level security;
alter table public.product_compatibility enable row level security;
alter table public.product_images enable row level security;

create policy "ecu_manufacturers: leitura pública" on public.ecu_manufacturers
  for select to anon, authenticated using (true);
create policy "vehicle_brands: leitura pública" on public.vehicle_brands
  for select to anon, authenticated using (true);
create policy "vehicle_models: leitura pública" on public.vehicle_models
  for select to anon, authenticated using (true);
create policy "categories: leitura pública" on public.categories
  for select to anon, authenticated using (true);

-- anon: só produtos ativos (sem chamar funções de papéis)
create policy "products: anon lê ativos" on public.products
  for select to anon using (is_active);
create policy "products: autenticado lê ativos (staff vê todos)" on public.products
  for select to authenticated
  using (is_active or public.is_staff((select auth.uid())));

do $$
declare t text;
begin
  foreach t in array array['product_references','product_compatibility','product_images'] loop
    execute format(
      'create policy "%1$s: anon lê" on public.%1$I for select to anon using (exists (select 1 from public.products p where p.id = product_id and p.is_active))', t);
    execute format(
      'create policy "%1$s: auth lê" on public.%1$I for select to authenticated using (exists (select 1 from public.products p where p.id = product_id and p.is_active) or public.is_staff((select auth.uid())))', t);
  end loop;
end $$;

-- Escrita staff (uma política por operação e tabela)
do $$
declare t text;
begin
  foreach t in array array[
    'ecu_manufacturers','vehicle_brands','vehicle_models','categories',
    'products','product_references','product_compatibility','product_images'
  ] loop
    execute format('revoke insert, update, delete on public.%I from anon', t);
    execute format(
      'create policy "%1$s: staff insere" on public.%1$I for insert to authenticated with check (public.is_staff((select auth.uid())))', t);
    execute format(
      'create policy "%1$s: staff atualiza" on public.%1$I for update to authenticated using (public.is_staff((select auth.uid()))) with check (public.is_staff((select auth.uid())))', t);
    execute format(
      'create policy "%1$s: staff apaga" on public.%1$I for delete to authenticated using (public.is_staff((select auth.uid())))', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Inventário & importação (só staff)
-- ---------------------------------------------------------------------------
create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed')),
  rows_total integer not null default 0,
  rows_ok integer not null default 0,
  rows_failed integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index import_jobs_created_by_idx on public.import_jobs (created_by);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  delta integer not null check (delta <> 0),
  reason public.inventory_reason not null,
  reference_id uuid, -- encomenda / import_job relacionado
  note text check (char_length(note) <= 300),
  actor_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index inventory_movements_product_id_idx on public.inventory_movements (product_id, created_at desc);
create index inventory_movements_actor_id_idx on public.inventory_movements (actor_id);

create or replace function public.apply_inventory_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.products
     set stock_quantity = stock_quantity + new.delta
   where id = new.product_id;
  return new;
end;
$$;
revoke execute on function public.apply_inventory_movement() from public, anon, authenticated;

create trigger inventory_movements_apply after insert on public.inventory_movements
  for each row execute function public.apply_inventory_movement();

alter table public.import_jobs enable row level security;
alter table public.inventory_movements enable row level security;
revoke all on public.import_jobs, public.inventory_movements from anon;

create policy "import_jobs: staff lê" on public.import_jobs for select to authenticated
  using (public.is_staff((select auth.uid())));
create policy "import_jobs: staff cria" on public.import_jobs for insert to authenticated
  with check (public.is_staff((select auth.uid())) and created_by = (select auth.uid()));
create policy "inventory_movements: staff lê" on public.inventory_movements for select to authenticated
  using (public.is_staff((select auth.uid())));
create policy "inventory_movements: staff cria" on public.inventory_movements for insert to authenticated
  with check (public.is_staff((select auth.uid())) and actor_id = (select auth.uid()));
-- Movimentos são um log imutável: sem update/delete.

-- ---------------------------------------------------------------------------
-- Logística (tarifas)
-- ---------------------------------------------------------------------------
create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  country_codes char(2)[] not null,
  created_at timestamptz not null default now()
);
create index shipping_zones_countries_idx on public.shipping_zones using gin (country_codes);

create table public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.shipping_zones (id) on delete cascade,
  carrier text not null check (char_length(carrier) between 1 and 60),
  service_level public.service_level not null,
  min_weight_g integer not null default 0 check (min_weight_g >= 0),
  max_weight_g integer not null check (max_weight_g > 0),
  price_cents integer not null check (price_cents >= 0), -- IVA incluído
  est_days_min smallint check (est_days_min >= 0),
  est_days_max smallint check (est_days_max >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (max_weight_g > min_weight_g)
);
create index shipping_rates_zone_id_idx on public.shipping_rates (zone_id);

alter table public.shipping_zones enable row level security;
alter table public.shipping_rates enable row level security;
revoke insert, update, delete on public.shipping_zones, public.shipping_rates from anon;

create policy "shipping_zones: leitura pública" on public.shipping_zones
  for select to anon, authenticated using (true);
create policy "shipping_rates: anon lê ativas" on public.shipping_rates
  for select to anon using (is_active);
create policy "shipping_rates: autenticado lê ativas (staff vê todas)" on public.shipping_rates
  for select to authenticated
  using (is_active or public.is_staff((select auth.uid())));

do $$
declare t text;
begin
  foreach t in array array['shipping_zones','shipping_rates'] loop
    execute format(
      'create policy "%1$s: staff insere" on public.%1$I for insert to authenticated with check (public.is_staff((select auth.uid())))', t);
    execute format(
      'create policy "%1$s: staff atualiza" on public.%1$I for update to authenticated using (public.is_staff((select auth.uid()))) with check (public.is_staff((select auth.uid())))', t);
    execute format(
      'create policy "%1$s: staff apaga" on public.%1$I for delete to authenticated using (public.is_staff((select auth.uid())))', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Encomendas
-- ---------------------------------------------------------------------------
-- Código público não sequencial (~50 bits de entropia): CT-XXXXX-XXXXX
create or replace function public.generate_order_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; -- sem 0/O/1/I
  bytes bytea := extensions.gen_random_bytes(10);
  result text := 'CT-';
  i int;
begin
  for i in 0..9 loop
    if i = 5 then result := result || '-'; end if;
    result := result || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return result;
end;
$$;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique default public.generate_order_code(),
  user_id uuid references auth.users (id) on delete set null, -- null = convidado
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  phone text check (char_length(phone) <= 32),
  status public.order_status not null default 'pending_payment',
  payment_status public.payment_status not null default 'pending',
  currency char(3) not null default 'EUR' check (currency = 'EUR'),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  vat_rate numeric(5,2) not null check (vat_rate >= 0 and vat_rate < 100),
  vat_cents integer not null check (vat_cents >= 0), -- IVA contido no total
  shipping_rate_id uuid references public.shipping_rates (id) on delete set null,
  service_level public.service_level,
  shipping_address jsonb not null,
  billing_address jsonb not null,
  company_name text check (char_length(company_name) <= 160),
  vat_number text check (char_length(vat_number) <= 32),
  customer_notes text check (char_length(customer_notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (total_cents = subtotal_cents + shipping_cents)
);
create index orders_user_id_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_shipping_rate_id_idx on public.orders (shipping_rate_id);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  title_snapshot text not null,
  reference_snapshot text not null,
  condition_snapshot public.product_condition not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity between 1 and 100),
  created_at timestamptz not null default now()
);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null check (provider in ('stripe', 'paypal', 'bank_transfer', 'manual')),
  provider_reference text check (char_length(provider_reference) <= 255),
  status public.payment_status not null default 'pending',
  amount_cents integer not null check (amount_cents >= 0),
  currency char(3) not null default 'EUR' check (currency = 'EUR'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_reference)
);
create index payments_order_id_idx on public.payments (order_id);
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  carrier text not null check (char_length(carrier) between 1 and 60),
  service_level public.service_level not null,
  tracking_number text check (char_length(tracking_number) <= 80),
  tracking_url text check (tracking_url ~ '^https://'),
  status public.shipment_status not null default 'label_created',
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shipments_order_id_idx on public.shipments (order_id);
create trigger shipments_updated_at before update on public.shipments
  for each row execute function public.set_updated_at();

create table public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  status public.shipment_status not null,
  description text check (char_length(description) <= 300),
  location text check (char_length(location) <= 120),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index shipment_events_shipment_id_idx on public.shipment_events (shipment_id, occurred_at desc);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_events enable row level security;

-- Clientes NUNCA escrevem encomendas diretamente: a criação é feita no servidor
-- (preços e portes recalculados a partir da BD) com a service role.
revoke insert, update, delete on public.orders, public.order_items, public.payments,
  public.shipments, public.shipment_events from anon, authenticated;
revoke all on public.orders, public.order_items, public.payments,
  public.shipments, public.shipment_events from anon;
grant update (status, payment_status) on public.orders to authenticated;
grant insert, update on public.shipments, public.shipment_events to authenticated;

create policy "orders: cliente vê as suas" on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff((select auth.uid())));
create policy "orders: staff atualiza estado" on public.orders for update to authenticated
  using (public.is_staff((select auth.uid())))
  with check (public.is_staff((select auth.uid())));

create policy "order_items: via encomenda" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
                 and (o.user_id = (select auth.uid()) or public.is_staff((select auth.uid())))));

create policy "payments: só staff" on public.payments for select to authenticated
  using (public.is_staff((select auth.uid())));

create policy "shipments: via encomenda" on public.shipments for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
                 and (o.user_id = (select auth.uid()) or public.is_staff((select auth.uid())))));
create policy "shipments: staff insere" on public.shipments for insert to authenticated
  with check (public.is_staff((select auth.uid())));
create policy "shipments: staff atualiza" on public.shipments for update to authenticated
  using (public.is_staff((select auth.uid()))) with check (public.is_staff((select auth.uid())));

create policy "shipment_events: via encomenda" on public.shipment_events for select to authenticated
  using (exists (select 1 from public.shipments s join public.orders o on o.id = s.order_id
                 where s.id = shipment_id
                 and (o.user_id = (select auth.uid()) or public.is_staff((select auth.uid())))));
create policy "shipment_events: staff insere" on public.shipment_events for insert to authenticated
  with check (public.is_staff((select auth.uid())));

-- Tracking de convidado: apenas estado, artigos e envios — sem dados pessoais.
-- Executável só pelo servidor (service_role), que aplica rate limiting antes.
create or replace function public.track_order(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'order_code', o.order_code,
    'status', o.status,
    'payment_status', o.payment_status,
    'created_at', o.created_at,
    'total_cents', o.total_cents,
    'currency', o.currency,
    'destination_country', o.shipping_address ->> 'country_code',
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'title', i.title_snapshot, 'reference', i.reference_snapshot, 'quantity', i.quantity
      ) order by i.created_at)
      from public.order_items i where i.order_id = o.id), '[]'::jsonb),
    'shipments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'carrier', s.carrier, 'service_level', s.service_level,
        'tracking_number', s.tracking_number, 'tracking_url', s.tracking_url,
        'status', s.status, 'shipped_at', s.shipped_at, 'delivered_at', s.delivered_at,
        'events', coalesce((
          select jsonb_agg(jsonb_build_object(
            'status', e.status, 'description', e.description,
            'location', e.location, 'occurred_at', e.occurred_at
          ) order by e.occurred_at desc)
          from public.shipment_events e where e.shipment_id = s.id), '[]'::jsonb)
      ) order by s.created_at)
      from public.shipments s where s.order_id = o.id), '[]'::jsonb)
  )
  from public.orders o
  where o.order_code = upper(trim(p_code));
$$;
revoke execute on function public.track_order(text) from public, anon, authenticated;
grant execute on function public.track_order(text) to service_role;

-- ---------------------------------------------------------------------------
-- Contactos, emails transacionais e rate limiting (só servidor / staff)
-- ---------------------------------------------------------------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  phone text check (char_length(phone) <= 32),
  subject text check (char_length(subject) <= 160),
  message text not null check (char_length(message) between 1 and 5000),
  product_reference text check (char_length(product_reference) <= 64),
  vin text check (vin ~ '^[A-HJ-NPR-Z0-9]{17}$'),
  status text not null default 'new' check (status in ('new', 'in_progress', 'answered', 'spam')),
  ip_hash text,
  created_at timestamptz not null default now()
);
create index contact_messages_status_idx on public.contact_messages (status, created_at desc);

create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in (
    'contact_received', 'contact_admin', 'order_confirmation', 'order_admin_new_sale',
    'shipment_update', 'order_status_update'
  )),
  to_email text not null check (char_length(to_email) <= 254),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed')),
  attempts smallint not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index email_outbox_pending_idx on public.email_outbox (status, created_at) where status in ('pending', 'failed');

create table public.rate_limits (
  key text not null,           -- hash(ip + rota)
  window_start timestamptz not null,
  hits integer not null default 1,
  primary key (key, window_start)
);

alter table public.contact_messages enable row level security;
alter table public.email_outbox enable row level security;
alter table public.rate_limits enable row level security;
revoke all on public.contact_messages, public.email_outbox, public.rate_limits from anon;
revoke insert, update, delete on public.contact_messages from authenticated;
revoke all on public.email_outbox, public.rate_limits from authenticated;
grant select, update (status) on public.contact_messages to authenticated;

create policy "contact_messages: staff lê" on public.contact_messages for select to authenticated
  using (public.is_staff((select auth.uid())));
create policy "contact_messages: staff atualiza estado" on public.contact_messages for update to authenticated
  using (public.is_staff((select auth.uid()))) with check (public.is_staff((select auth.uid())));
-- email_outbox e rate_limits: sem políticas -> apenas service_role.

-- Rate limit atómico (janela fixa). Chamado só pelo servidor.
create or replace function public.check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n integer;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, w, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into n;
  return n <= p_limit;
end;
$$;
revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880, array['image/webp', 'image/jpeg', 'image/png']),
  ('imports', 'imports', false, 20971520, array[
     'text/csv',
     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ])
on conflict (id) do nothing;

create policy "product-images: staff carrega" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_staff((select auth.uid())));
create policy "product-images: staff atualiza" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_staff((select auth.uid())));
create policy "product-images: staff apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_staff((select auth.uid())));

create policy "imports: staff lê" on storage.objects for select to authenticated
  using (bucket_id = 'imports' and public.is_staff((select auth.uid())));
create policy "imports: staff carrega" on storage.objects for insert to authenticated
  with check (bucket_id = 'imports' and public.is_staff((select auth.uid())));
