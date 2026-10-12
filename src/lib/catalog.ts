// Leituras do catálogo com a chave pública (RLS: só produtos ativos).
// Corre tanto no SSR como no browser — sem segredos aqui.
import { getPublicClient } from "./supabase";
import type { CatalogSearch } from "./schemas";
import type {
  CatalogFacets,
  ProductDetail,
  SearchResult,
  ShippingOption,
  Suggestion,
} from "./types";

export const PAGE_SIZE = 10;

function fail(context: string, message: string): never {
  console.error(`[catalog] ${context}: ${message}`);
  throw new Error("Não foi possível carregar o catálogo. Tente novamente dentro de instantes.");
}

export async function searchCatalog(s: CatalogSearch, limit = PAGE_SIZE): Promise<SearchResult> {
  const page = s.pagina ?? 1;
  const { data, error } = await getPublicClient().rpc("search_catalog", {
    p_q: s.q || null,
    p_category: s.categoria ?? null,
    p_manufacturer: s.fabricante ?? null,
    p_brand: s.marca ?? null,
    p_condition: s.estado ?? null,
    p_in_stock: s.stock ?? false,
    p_sort: s.ordem ?? (s.q ? "relevance" : "newest"),
    p_limit: limit,
    p_offset: (page - 1) * limit,
  });
  if (error) fail("search_catalog", error.message);
  return data as SearchResult;
}

export async function getFacets(): Promise<CatalogFacets> {
  const { data, error } = await getPublicClient().rpc("catalog_facets");
  if (error) fail("catalog_facets", error.message);
  return data as CatalogFacets;
}

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  const { data, error } = await getPublicClient().rpc("get_product", { p_slug: slug });
  if (error) fail("get_product", error.message);
  return (data as ProductDetail | null) ?? null;
}

export async function suggestProducts(q: string): Promise<Suggestion[]> {
  const { data, error } = await getPublicClient().rpc("suggest_products", { p_q: q });
  if (error) return [];
  return (data as Suggestion[]) ?? [];
}

export async function getShippingOptions(
  country: string,
  items: { product_id: string; quantity: number }[],
): Promise<ShippingOption[]> {
  const { data, error } = await getPublicClient().rpc("shipping_quote", {
    p_country: country,
    p_items: items,
  });
  if (error) fail("shipping_quote", error.message);
  return (data as ShippingOption[]) ?? [];
}

export type LiveCartProduct = {
  id: string;
  slug: string;
  title: string;
  price_cents: number | null;
  stock_quantity: number;
  weight_grams: number;
};

/** Preços e stock atuais para os artigos do carrinho (fonte de verdade = BD). */
export async function getCartProducts(ids: string[]): Promise<LiveCartProduct[]> {
  if (ids.length === 0) return [];
  const { data, error } = await getPublicClient()
    .from("products")
    .select("id, slug, title, price_cents, stock_quantity, weight_grams")
    .in("id", ids.slice(0, 20));
  if (error) fail("cart", error.message);
  return (data ?? []) as LiveCartProduct[];
}

/** Lê todas as linhas de uma RPC sem argumentos (o PostgREST devolve no máximo 1000 por pedido). */
async function rpcAll<T>(fn: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await getPublicClient().rpc(fn).range(from, from + 999);
    if (error) fail(fn, error.message);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

export type LegacyReference = { ref: string; slug: string | null };

/** Índice de referências do site antigo (/centralinas): ~13 mil, com slug quando há peça ativa. */
export function getLegacyReferenceIndex(): Promise<LegacyReference[]> {
  return rpcAll<LegacyReference>("legacy_reference_index");
}

export function getSitemapProducts(): Promise<{ slug: string; updated_at: string }[]> {
  return rpcAll("sitemap_products");
}
