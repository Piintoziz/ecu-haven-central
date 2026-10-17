-- Pagamentos online com Stripe Checkout (cartão, Apple/Google Pay, MB WAY,
-- Multibanco, PayPal…). A encomenda guarda o método escolhido; cada sessão de
-- pagamento fica em public.payments (provider 'stripe', provider_reference =
-- id da Checkout Session). Só o webhook assinado marca o pagamento como
-- 'captured' — o trigger orders_before_update passa então a encomenda a "paga".
alter table public.orders
  add column if not exists payment_method text not null default 'bank_transfer'
    check (payment_method in ('bank_transfer', 'stripe'));

comment on column public.orders.payment_method is
  'Método escolhido no checkout: bank_transfer ou stripe (Checkout Session).';
