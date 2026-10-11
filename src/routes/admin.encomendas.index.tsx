import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { AdminPageHeader, EmptyRow, FilterTabs, Pager, Panel, td, th } from "@/components/admin/ui";
import { countryName } from "@/components/site/address-block";
import { OrderStatusPill } from "@/components/site/order-status-pill";
import { ADMIN_PAGE_SIZE, listOrders } from "@/lib/admin";
import { formatPrice, orderStatusLabel, serviceLevelLabel } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

const STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export const Route = createFileRoute("/admin/encomendas/")({
  validateSearch: (s: Record<string, unknown>) =>
    z
      .object({
        estado: z.enum(STATUSES).optional().catch(undefined),
        q: z.string().max(80).optional().catch(undefined),
        pagina: z.coerce.number().int().min(1).max(1000).optional().catch(undefined),
      })
      .parse(s),
  component: AdminOrders,
});

const PAYMENT_LABEL: Record<string, string> = {
  pending: "Pendente",
  authorized: "Autorizado",
  captured: "Recebido",
  failed: "Falhou",
  refunded: "Reembolsado",
};

function AdminOrders() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [q, setQ] = useState(search.q ?? "");
  useEffect(() => setQ(search.q ?? ""), [search.q]);

  const orders = useQuery({
    queryKey: ["admin", "orders", search],
    queryFn: () => listOrders({ status: search.estado, q: search.q, page: search.pagina }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <AdminPageHeader title="Encomendas" description="Pagamentos, preparação e expedição." />

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
          <FilterTabs<OrderStatus>
            value={search.estado}
            options={[
              { value: undefined, label: "Todas" },
              ...STATUSES.map((s) => ({ value: s, label: orderStatusLabel[s] })),
            ]}
            onChange={(estado) =>
              void navigate({ search: (prev) => ({ ...prev, estado, pagina: undefined }) })
            }
          />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void navigate({
                search: (prev) => ({ ...prev, q: q.trim() || undefined, pagina: undefined }),
              });
            }}
            className="relative w-full sm:w-72"
          >
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <label htmlFor="order-q" className="sr-only">
              Pesquisar encomendas
            </label>
            <input
              id="order-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Código CT-… ou email"
              maxLength={80}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className={th}>Código</th>
                <th className={th}>Cliente</th>
                <th className={th}>Destino</th>
                <th className={th}>Estado</th>
                <th className={th}>Pagamento</th>
                <th className={`${th} text-right`}>Total</th>
                <th className={th}>Data</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y divide-border ${orders.isPlaceholderData ? "opacity-60" : ""}`}
            >
              {orders.data?.rows.map((o) => (
                <tr key={o.id} className="relative hover:bg-accent/40">
                  <td className={`${td} font-mono font-bold`}>
                    <Link
                      to="/admin/encomendas/$id"
                      params={{ id: o.id }}
                      className="after:absolute after:inset-0"
                    >
                      {o.order_code}
                    </Link>
                  </td>
                  <td className={td}>
                    <span className="block max-w-[220px] truncate font-semibold">
                      {o.shipping_address?.full_name}
                    </span>
                    <span className="block max-w-[220px] truncate text-xs text-muted-foreground">
                      {o.email}
                    </span>
                  </td>
                  <td className={`${td} text-muted-foreground`}>
                    {countryName(o.shipping_address?.country_code)}
                    {o.service_level && (
                      <span className="block text-xs">{serviceLevelLabel[o.service_level]}</span>
                    )}
                  </td>
                  <td className={td}>
                    <OrderStatusPill status={o.status} />
                  </td>
                  <td className={`${td} text-xs text-muted-foreground`}>
                    {PAYMENT_LABEL[o.payment_status]}
                  </td>
                  <td className={`${td} text-right font-mono tabular-nums`}>
                    {formatPrice(o.total_cents)}
                    <span className="block text-xs text-muted-foreground">
                      {o.order_items.reduce((n, i) => n + i.quantity, 0)} art.
                    </span>
                  </td>
                  <td className={`${td} whitespace-nowrap text-muted-foreground`}>
                    {new Date(o.created_at).toLocaleString("pt-PT", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                </tr>
              ))}
              {orders.isLoading && <EmptyRow colSpan={7}>A carregar…</EmptyRow>}
              {orders.data && orders.data.rows.length === 0 && (
                <EmptyRow colSpan={7}>Nenhuma encomenda corresponde aos filtros.</EmptyRow>
              )}
              {orders.error && <EmptyRow colSpan={7}>{(orders.error as Error).message}</EmptyRow>}
            </tbody>
          </table>
        </div>
        <Pager
          page={search.pagina ?? 1}
          total={orders.data?.total ?? 0}
          pageSize={ADMIN_PAGE_SIZE}
          onPage={(pagina) => void navigate({ search: (prev) => ({ ...prev, pagina }) })}
        />
      </Panel>
    </>
  );
}
