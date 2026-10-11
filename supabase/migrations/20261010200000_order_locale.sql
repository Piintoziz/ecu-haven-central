-- Idioma do cliente na encomenda (pt/en): os emails transacionais seguem-no.
-- Escrito só pelo servidor (service_role) logo após place_order; clientes não
-- têm permissão de update nesta coluna (grant de update é só status/payment_status).
alter table public.orders
  add column if not exists locale text not null default 'pt'
  constraint orders_locale_check check (locale in ('pt', 'en'));
