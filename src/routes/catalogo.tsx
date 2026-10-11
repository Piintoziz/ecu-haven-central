import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import type { ReactNode } from "react";
import { ProductRow } from "@/components/site/product-card";
import { SearchBar } from "@/components/site/search-bar";
import { PAGE_SIZE, getFacets, searchCatalog } from "@/lib/catalog";
import { getDict, headI18n, useT, type Dict } from "@/lib/i18n";
import { catalogSearchSchema, type CatalogSearch } from "@/lib/schemas";
import { breadcrumbLd, jsonLdScript, pageHead } from "@/lib/seo";
import type { CatalogFacets, ProductCondition } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/catalogo")({
  validateSearch: (search: Record<string, unknown>) => catalogSearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [result, facets] = await Promise.all([searchCatalog(deps), getFacets()]);
    return { result, facets, search: deps };
  },
  head: ({ loaderData, match }) => {
    const { locale, t } = headI18n(match);
    if (!loaderData) return pageHead({ title: t.shop.catalog.title, description: "", path: "/catalogo", locale });
    const { search, facets, result } = loaderData;
    const heading = describeSearch(search, facets, t);
    const filters = [search.categoria, search.fabricante, search.marca].filter(Boolean).length;
    // Páginas indexáveis: catálogo base e landing pages de UM filtro (sistema, fabricante ou marca)
    const indexable =
      !search.q && !search.estado && !search.stock && !search.ordem && (search.pagina ?? 1) === 1 && filters <= 1;
    const path = canonicalPath(search);
    const head = pageHead({
      title: t.shop.catalog.metaTitle(heading.title),
      description: t.shop.catalog.metaDescription(heading.title, result.total),
      path,
      noindex: !indexable,
      locale,
    });
    return {
      ...head,
      scripts: [
        jsonLdScript(
          breadcrumbLd([
            { name: t.shop.catalog.home, path: "/" },
            { name: t.shop.catalog.title, path: "/catalogo" },
            ...(path !== "/catalogo" ? [{ name: heading.title, path }] : []),
          ]),
        ),
      ],
    };
  },
  component: CatalogoPage,
});

function canonicalPath(s: CatalogSearch): string {
  const key = s.categoria ? "categoria" : s.fabricante ? "fabricante" : s.marca ? "marca" : null;
  if (!key) return "/catalogo";
  return `/catalogo?${key}=${encodeURIComponent(s[key]!)}`;
}

function describeSearch(s: CatalogSearch, f: CatalogFacets, t: Dict = getDict("pt")) {
  const k = t.shop.catalog;
  const cat = f.categories.find((c) => c.slug === s.categoria);
  const man = f.manufacturers.find((m) => m.slug === s.fabricante);
  const brand = f.brands.find((b) => b.slug === s.marca);
  if (s.q) return { title: k.resultsFor(s.q), subtitle: k.resultsSub };
  const parts = [cat ? t.common.category(cat.slug, cat.name) : k.allEcus, man ? man.name : null, brand ? k.forBrand(brand.name) : null];
  return {
    title: parts.filter(Boolean).join(" "),
    subtitle: cat ? t.common.categoryDescription(cat.slug, cat.description ?? null) || k.allSub : k.allSub,
  };
}

const CONDITIONS: ProductCondition[] = ["reconditioned", "used_tested", "new"];
const SORTS = [
  { value: "relevance" },
  { value: "newest" },
  { value: "price_asc" },
  { value: "price_desc" },
] as const;

function CatalogoPage() {
  const { result, facets, search } = Route.useLoaderData();
  const navigate = useNavigate({ from: "/catalogo" });
  const t = useT();
  const k = t.shop.catalog;
  const heading = describeSearch(search, facets, t);
  const page = search.pagina ?? 1;
  const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  const active: { key: keyof CatalogSearch; label: string }[] = [];
  if (search.q) active.push({ key: "q", label: `“${search.q}”` });
  if (search.categoria)
    active.push({ key: "categoria", label: t.common.category(search.categoria, facets.categories.find((c) => c.slug === search.categoria)?.name ?? "") });
  if (search.fabricante)
    active.push({ key: "fabricante", label: facets.manufacturers.find((m) => m.slug === search.fabricante)?.name ?? search.fabricante });
  if (search.marca)
    active.push({ key: "marca", label: facets.brands.find((b) => b.slug === search.marca)?.name ?? search.marca });
  if (search.estado) active.push({ key: "estado", label: t.common.condition[search.estado] });
  if (search.stock) active.push({ key: "stock", label: k.inStock });

  const filters = (
    <div className="space-y-7">
      <FilterGroup title={k.system}>
        {facets.categories.map((c) => (
          <FilterLink
            key={c.slug}
            active={search.categoria === c.slug}
            count={c.count}
            search={(prev) => ({ ...prev, categoria: prev.categoria === c.slug ? undefined : c.slug, pagina: undefined })}
          >
            {t.common.category(c.slug, c.name)}
          </FilterLink>
        ))}
      </FilterGroup>
      <FilterGroup title={k.manufacturer}>
        {facets.manufacturers.map((m) => (
          <FilterLink
            key={m.slug}
            active={search.fabricante === m.slug}
            count={m.count}
            search={(prev) => ({ ...prev, fabricante: prev.fabricante === m.slug ? undefined : m.slug, pagina: undefined })}
          >
            {m.name}
          </FilterLink>
        ))}
      </FilterGroup>
      <FilterGroup title={k.brand}>
        {facets.brands.map((b) => (
          <FilterLink
            key={b.slug}
            active={search.marca === b.slug}
            count={b.count}
            search={(prev) => ({ ...prev, marca: prev.marca === b.slug ? undefined : b.slug, pagina: undefined })}
          >
            {b.name}
          </FilterLink>
        ))}
      </FilterGroup>
      <FilterGroup title={k.condition}>
        {CONDITIONS.map((c) => (
          <FilterLink
            key={c}
            active={search.estado === c}
            search={(prev) => ({ ...prev, estado: prev.estado === c ? undefined : c, pagina: undefined })}
          >
            {t.common.condition[c]}
          </FilterLink>
        ))}
        <FilterLink
          active={!!search.stock}
          search={(prev) => ({ ...prev, stock: prev.stock ? undefined : true, pagina: undefined })}
        >
          {k.onlyStock}
        </FilterLink>
      </FilterGroup>
    </div>
  );

  return (
    <div className="container-page py-10 md:py-12">
      <nav aria-label={k.breadcrumb} className="mb-4 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">{k.home}</Link>
        <span className="mx-2">/</span>
        <Link to="/catalogo" className="hover:text-foreground">{k.title}</Link>
      </nav>

      <header className="mb-8 grid gap-6 *:min-w-0 lg:grid-cols-[1fr_minmax(0,28rem)] lg:items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{heading.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{heading.subtitle}</p>
        </div>
        <SearchBar defaultValue={search.q ?? ""} />
      </header>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block" aria-label={k.filters}>
          {filters}
        </aside>

        <section aria-label={k.results} className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              <b className="tabular-nums text-foreground">{result.total}</b>{" "}
              {k.refs(result.total)}
            </p>
            <div className="flex items-center gap-2">
              <details className="relative lg:hidden">
                <summary className="inline-flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold">
                  <SlidersHorizontal className="size-4" aria-hidden /> {k.filters}
                </summary>
                <div className="absolute right-0 z-40 mt-2 max-h-[70vh] w-72 overflow-y-auto rounded-lg border border-border bg-surface-elevated p-5 shadow-2xl">
                  {filters}
                </div>
              </details>
              <label className="sr-only" htmlFor="ordem">{k.sort}</label>
              <select
                id="ordem"
                value={search.ordem ?? (search.q ? "relevance" : "newest")}
                onChange={(e) =>
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      ordem: e.target.value as CatalogSearch["ordem"],
                      pagina: undefined,
                    }),
                  })
                }
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {k.sorts[s.value]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {active.length > 0 && (
            <div className="mb-2 flex flex-wrap items-center gap-2 py-2">
              {active.map((f) => (
                <Link
                  key={f.key}
                  from="/catalogo"
                  to="/catalogo"
                  search={(prev) => {
                    const next: CatalogSearch = { ...prev, pagina: undefined };
                    delete next[f.key];
                    return next;
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold hover:border-destructive/60"
                  aria-label={k.removeFilter(f.label)}
                >
                  {f.label} <X className="size-3" aria-hidden />
                </Link>
              ))}
              <Link to="/catalogo" className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:underline">
                {k.clearAll}
              </Link>
            </div>
          )}

          {result.items.length > 0 ? (
            <div>
              {result.items.map((p) => (
                <ProductRow key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-border p-10 text-center">
              <h2 className="text-lg font-bold">{k.noResults}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                {k.noResultsText}
              </p>
              <Link
                to="/contactos"
                search={search.q ? { ref: search.q } : {}}
                className="mt-5 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
              >
                {k.askRef}
              </Link>
            </div>
          )}

          {pages > 1 && (
            <nav aria-label={k.pagination} className="mt-8 flex flex-col items-center gap-3">
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <PageLink page={page - 1} disabled={page <= 1} label={k.prevPage}>
                  <ChevronLeft className="size-4" />
                  <span className="hidden sm:inline">{k.prev}</span>
                </PageLink>
                {pageWindow(page, pages).map((n, i) =>
                  n === null ? (
                    <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground" aria-hidden>
                      …
                    </span>
                  ) : (
                    <PageLink key={n} page={n} disabled={false} current={n === page} label={k.page(n)}>
                      {n}
                    </PageLink>
                  ),
                )}
                <PageLink page={page + 1} disabled={page >= pages} label={k.nextPage}>
                  <span className="hidden sm:inline">{k.next}</span>
                  <ChevronRight className="size-4" />
                </PageLink>
              </div>
              <p className="text-xs tabular-nums text-muted-foreground">
                {k.range((page - 1) * PAGE_SIZE + 1, Math.min(page * PAGE_SIZE, result.total), result.total)}
              </p>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mono-label mb-2">{title}</legend>
      <ul className="space-y-0.5">{children}</ul>
    </fieldset>
  );
}

function FilterLink({
  active,
  count,
  search,
  children,
}: {
  active: boolean;
  count?: number;
  search: (prev: CatalogSearch) => CatalogSearch;
  children: ReactNode;
}) {
  return (
    <li>
      <Link
        from="/catalogo"
        to="/catalogo"
        search={search}
        aria-current={active ? "true" : undefined}
        className={cn(
          "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
          active ? "bg-primary/10 font-semibold text-foreground" : "text-muted-foreground hover:bg-surface hover:text-foreground",
        )}
      >
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className={cn("size-3 rounded-sm border", active ? "border-primary bg-primary" : "border-border")}
          />
          {children}
        </span>
        {count != null && <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{count}</span>}
      </Link>
    </li>
  );
}

/** 1 … 4 5 [6] 7 8 … 283 — sempre a primeira, a última e duas de cada lado da atual. */
function pageWindow(page: number, pages: number): (number | null)[] {
  const set = new Set([1, pages, page - 2, page - 1, page, page + 1, page + 2]);
  const nums = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1]! > 1) out.push(n - nums[i - 1]! === 2 ? n - 1 : null);
    out.push(n);
  });
  return out;
}

function PageLink({
  page,
  disabled,
  current,
  label,
  children,
}: {
  page: number;
  disabled: boolean;
  current?: boolean;
  label?: string;
  children: ReactNode;
}) {
  const base = "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border px-3 text-sm tabular-nums";
  if (disabled) {
    return (
      <span className={`${base} border-border text-muted-foreground/50`} aria-label={label}>
        {children}
      </span>
    );
  }
  if (current) {
    return (
      <span aria-current="page" aria-label={label} className={`${base} border-primary bg-primary font-bold text-primary-foreground`}>
        {children}
      </span>
    );
  }
  return (
    <Link
      from="/catalogo"
      to="/catalogo"
      search={(prev) => ({ ...prev, pagina: page > 1 ? page : undefined })}
      aria-label={label}
      className={`${base} border-border font-semibold hover:border-primary/60 hover:bg-accent`}
    >
      {children}
    </Link>
  );
}
