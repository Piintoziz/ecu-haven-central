-- Ligação das encomendas aos envios Packlink PRO.
-- O rascunho é criado na Packlink pelo backoffice (servidor, service role); o
-- pagamento faz-se no painel Packlink; quando há nº de tracking o servidor cria
-- a linha em shipments (os triggers existentes atualizam a encomenda e enviam email).
alter table public.orders
  add column if not exists packlink_reference text unique check (char_length(packlink_reference) <= 40),
  add column if not exists packlink_state text check (char_length(packlink_state) <= 40),
  add column if not exists packlink_collection_date date;

alter table public.shipments
  add column if not exists packlink_reference text check (char_length(packlink_reference) <= 40);

create index if not exists orders_packlink_open_idx on public.orders (packlink_state)
  where packlink_reference is not null;
