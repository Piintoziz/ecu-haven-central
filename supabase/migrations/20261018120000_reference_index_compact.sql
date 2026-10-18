-- /centralinas: o índice (~15 mil referências) era lido em blocos de 1000 linhas
-- (16 pedidos seguidos, vários segundos). Esta versão devolve tudo num só pedido,
-- já no formato compacto que a página usa: [[ref, slug], ...].
create or replace function public.legacy_reference_index_compact()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_array(i.ref, i.slug) order by i.n), '[]'::jsonb)
  from public.legacy_reference_index() with ordinality as i(ref, slug, n);
$$;
grant execute on function public.legacy_reference_index_compact() to anon, authenticated, service_role;
