-- O índice /centralinas mostrava só as referências do site antigo: ~1 900 peças
-- em stock com referências que não estavam nessa lista não apareciam.
-- Passa a juntar as referências antigas e todo o stock ativo. Cada peça aparece
-- pelo menos uma vez, com a referência principal (hardware) e o código da etiqueta.
create or replace function public.legacy_reference_index()
returns table (ref text, slug text)
language sql
stable
set search_path = ''
as $$
  with legacy as (
    select l.ref,
           l.ref_normalized,
           (select p.slug
              from public.product_references r
              join public.products p on p.id = r.product_id and p.is_active
             where r.value_normalized = l.ref_normalized
             order by p.stock_quantity desc
             limit 1) as slug
    from public.legacy_references l
  ),
  stock as (
    select concat_ws(' ', pr.value, nullif(p.label_code, '')) as ref,
           public.normalize_reference(concat_ws(' ', pr.value, nullif(p.label_code, ''))) as ref_normalized,
           p.slug
    from public.products p
    cross join lateral (
      select r.value
        from public.product_references r
       where r.product_id = p.id
       order by (r.type = 'hardware') desc, r.value
       limit 1
    ) pr
    where p.is_active
      -- peças já ligadas a uma referência antiga não se repetem
      and not exists (select 1 from legacy l where l.slug = p.slug)
  )
  select ref, slug
  from (
    select ref, ref_normalized, slug from legacy
    union all
    select ref, ref_normalized, slug from stock
  ) t
  order by ref_normalized;
$$;
grant execute on function public.legacy_reference_index() to anon, authenticated;
