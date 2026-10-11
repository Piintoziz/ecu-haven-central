import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ExternalLink, FileSpreadsheet, PencilLine, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { StockDialog } from "@/components/admin/stock-dialog";
import { AdminPageHeader, EmptyRow, FilterTabs, Pager, Panel, td, th } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ADMIN_PAGE_SIZE,
  listProducts,
  setProductActive,
  type AdminProductRow,
  type ProductFilter,
} from "@/lib/admin";
import { conditionLabel, priceLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "noprice", "active", "inactive", "low", "out"] as const;

export const Route = createFileRoute("/admin/produtos/")({
  validateSearch: (s: Record<string, unknown>) =>
    z
      .object({
        q: z.string().max(80).optional().catch(undefined),
        filtro: z.enum(FILTERS).optional().catch(undefined),
        pagina: z.coerce.number().int().min(1).max(5000).optional().catch(undefined),
      })
      .parse(s),
  component: AdminProducts,
});

const FILTER_LABEL: Record<ProductFilter, string> = {
  all: "Todos",
  noprice: "Sem preço",
  active: "Ativos",
  inactive: "Inativos",
  low: "Última unidade",
  out: "Esgotados",
};

function mainRef(p: AdminProductRow): string {
  const refs = p.product_references;
  return (
    (refs.find((r) => r.is_primary) ?? refs.find((r) => r.type === "hardware") ?? refs[0])?.value ??
    p.slug
  );
}

function AdminProducts() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const qc = useQueryClient();
  const [q, setQ] = useState(search.q ?? "");
  const [stockFor, setStockFor] = useState<AdminProductRow | null>(null);
  useEffect(() => setQ(search.q ?? ""), [search.q]);

  const products = useQuery({
    queryKey: ["admin", "products", search],
    queryFn: () => listProducts({ q: search.q, filter: search.filtro, page: search.pagina }),
    placeholderData: keepPreviousData,
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setProductActive(id, active),
    onSuccess: (_d, v) => {
      toast.success(v.active ? "Produto publicado na loja" : "Produto retirado da loja");
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <>
      <AdminPageHeader
        title="Produtos & stock"
        description="Marca, referência, código, quantidade e preço — o resto é automático."
        actions={
          <>
            <Button asChild variant="outline" className="font-bold">
              <Link to="/admin/importar">
                <FileSpreadsheet /> Importar
              </Link>
            </Button>
            <Button asChild className="font-bold">
              <Link to="/admin/produtos/$id" params={{ id: "novo" }}>
                <Plus /> Nova peça
              </Link>
            </Button>
          </>
        }
      />

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
          <FilterTabs<ProductFilter>
            value={search.filtro ?? "all"}
            options={FILTERS.map((f) => ({ value: f, label: FILTER_LABEL[f] }))}
            onChange={(filtro) =>
              void navigate({
                search: (prev) => ({
                  ...prev,
                  filtro: filtro === "all" ? undefined : filtro,
                  pagina: undefined,
                }),
              })
            }
          />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void navigate({
                search: (prev) => ({ ...prev, q: q.trim() || undefined, pagina: undefined }),
              });
            }}
            className="relative w-full sm:w-80"
          >
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <label htmlFor="product-q" className="sr-only">
              Pesquisar produtos
            </label>
            <input
              id="product-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Referência ou código"
              maxLength={80}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className={th}>Referência</th>
                <th className={th}>Marca · tipo</th>
                <th className={th}>Estado</th>
                <th className={`${th} text-right`}>Preço</th>
                <th className={`${th} text-right`}>Stock</th>
                <th className={th}>Na loja</th>
                <th className={th}>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody
              className={cn("divide-y divide-border", products.isPlaceholderData && "opacity-60")}
            >
              {products.data?.rows.map((p) => (
                <tr key={p.id} className="hover:bg-accent/30">
                  <td className={td}>
                    <Link
                      to="/admin/produtos/$id"
                      params={{ id: p.id }}
                      className="font-mono font-bold hover:text-primary"
                    >
                      {mainRef(p)}
                    </Link>
                    {p.label_code && (
                      <span className="ml-2 rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                        {p.label_code}
                      </span>
                    )}
                  </td>
                  <td className={td}>
                    <span className="block max-w-[260px] truncate font-semibold">
                      {p.product_brands
                        .map((b) => b.brand?.name)
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {p.category?.name ?? "—"}
                    </span>
                  </td>
                  <td className={`${td} text-xs text-muted-foreground`}>
                    {conditionLabel[p.condition]}
                  </td>
                  <td
                    className={cn(
                      `${td} text-right font-mono tabular-nums`,
                      p.price_cents == null && "font-sans text-xs text-muted-foreground",
                    )}
                  >
                    {priceLabel(p.price_cents)}
                  </td>
                  <td className={`${td} text-right`}>
                    <button
                      type="button"
                      onClick={() => setStockFor(p)}
                      className={cn(
                        "rounded-md border border-border px-2.5 py-1 font-mono text-sm font-bold tabular-nums hover:border-primary/60",
                        p.stock_quantity === 0 && "text-destructive",
                        p.stock_quantity === 1 && "text-warning",
                      )}
                      aria-label={`Ajustar stock de ${mainRef(p)} (atual ${p.stock_quantity})`}
                    >
                      {p.stock_quantity}
                    </button>
                  </td>
                  <td className={td}>
                    <Switch
                      checked={p.is_active}
                      disabled={toggle.isPending}
                      onCheckedChange={(active) => toggle.mutate({ id: p.id, active })}
                      aria-label={p.is_active ? "Retirar da loja" : "Publicar na loja"}
                    />
                  </td>
                  <td className={`${td} text-right`}>
                    <div className="flex justify-end gap-1">
                      <Button asChild size="icon" variant="ghost" aria-label="Editar">
                        <Link to="/admin/produtos/$id" params={{ id: p.id }}>
                          <PencilLine />
                        </Link>
                      </Button>
                      {p.is_active && (
                        <Button asChild size="icon" variant="ghost" aria-label="Ver na loja">
                          <a href={`/centralinas/${p.slug}`} target="_blank" rel="noopener">
                            <ExternalLink />
                          </a>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {products.isLoading && <EmptyRow colSpan={7}>A carregar…</EmptyRow>}
              {products.data && products.data.rows.length === 0 && (
                <EmptyRow colSpan={7}>Nenhum produto corresponde à pesquisa.</EmptyRow>
              )}
              {products.error && (
                <EmptyRow colSpan={7}>{(products.error as Error).message}</EmptyRow>
              )}
            </tbody>
          </table>
        </div>
        <Pager
          page={search.pagina ?? 1}
          total={products.data?.total ?? 0}
          pageSize={ADMIN_PAGE_SIZE}
          onPage={(pagina) => void navigate({ search: (prev) => ({ ...prev, pagina }) })}
        />
      </Panel>

      <StockDialog
        product={
          stockFor
            ? {
                id: stockFor.id,
                title: stockFor.title,
                reference: mainRef(stockFor),
                stock_quantity: stockFor.stock_quantity,
              }
            : null
        }
        onClose={() => setStockFor(null)}
        onSaved={() => {
          void qc.invalidateQueries({ queryKey: ["admin", "products"] });
          void qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
          setStockFor(null);
        }}
      />
    </>
  );
}
