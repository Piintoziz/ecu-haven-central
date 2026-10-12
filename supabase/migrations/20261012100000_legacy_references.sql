-- Referências listadas no site antigo (centralinas.com/centralinas/, ~13 mil).
-- Mantidas no novo /centralinas para não perder as pesquisas por referência no Google:
-- as que existem no stock ligam à página da peça; as outras ao pedido de referência.
create table if not exists public.legacy_references (
  ref text primary key check (char_length(ref) between 4 and 40),
  ref_normalized text generated always as (public.normalize_reference(ref)) stored
);
create index if not exists legacy_references_norm_idx on public.legacy_references (ref_normalized);

alter table public.legacy_references enable row level security;
revoke insert, update, delete on public.legacy_references from anon, authenticated;
create policy "legacy_references: leitura pública" on public.legacy_references
  for select to anon, authenticated using (true);

-- Índice para a página: referência + slug do produto ativo (se existir).
create or replace function public.legacy_reference_index()
returns table (ref text, slug text)
language sql
stable
set search_path = ''
as $$
  select l.ref,
         (select p.slug
            from public.product_references r
            join public.products p on p.id = r.product_id and p.is_active
           where r.value_normalized = l.ref_normalized
           order by p.stock_quantity desc
           limit 1) as slug
  from public.legacy_references l
  order by l.ref_normalized;
$$;
grant execute on function public.legacy_reference_index() to anon, authenticated;
