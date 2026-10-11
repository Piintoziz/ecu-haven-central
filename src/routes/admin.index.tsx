import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminPageHeader, EmptyRow, FilterTabs, Kpi, Panel, td, th } from "@/components/admin/ui";
import { OrderStatusPill } from "@/components/site/order-status-pill";
import { getDashboard, listOrders } from "@/lib/admin";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

const RANGES = [
  { value: "7", label: "7 dias" },
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias" },
] as const;

const compactEur = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

function Dashboard() {
  const [range, setRange] = useState<"7" | "30" | "90">("30");
  const days = Number(range);
  const dash = useQuery({
    queryKey: ["admin", "dashboard", days],
    queryFn: () => getDashboard(days),
  });
  const recent = useQuery({
    queryKey: ["admin", "orders", "recent"],
    queryFn: () => listOrders({ page: 1 }),
  });
  const d = dash.data;

  return (
    <>
      <AdminPageHeader
        title="Painel"
        description="Vendas, expedição e stock num relance."
        actions={
          <FilterTabs value={range} options={[...RANGES]} onChange={(v) => setRange(v ?? "30")} />
        }
      />

      {dash.error && (
        <p className="mb-4 text-sm text-destructive">{(dash.error as Error).message}</p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label={`Faturação ${days}d`}
          value={d ? formatPrice(d.revenue_cents) : "—"}
          hint={d ? `${d.orders_count} encomendas` : undefined}
          tone="primary"
        />
        <Kpi
          label="Por expedir"
          value={d?.to_ship ?? "—"}
          hint="Pagas ou em preparação"
          tone={d && d.to_ship > 0 ? "warning" : "default"}
          to="/admin/encomendas?estado=paid"
        />
        <Kpi
          label="A aguardar pagamento"
          value={d?.pending_payment ?? "—"}
          hint="Transferências por confirmar"
          to="/admin/encomendas?estado=pending_payment"
        />
        <Kpi
          label="Mensagens novas"
          value={d?.new_messages ?? "—"}
          hint="Pedidos de contacto"
          tone={d && d.new_messages > 0 ? "warning" : "default"}
          to="/admin/mensagens"
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_320px]">
        <Panel title="Faturação diária">
          <div className="h-64 px-2 py-4">
            {d && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d.daily} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickFormatter={(v: string) => v.slice(8, 10) + "/" + v.slice(5, 7)}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    tickFormatter={(v: number) => compactEur.format(v / 100)}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={64}
                  />
                  <Tooltip
                    cursor={{ stroke: "var(--border)" }}
                    contentStyle={{
                      background: "var(--surface-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelFormatter={(v: string) =>
                      new Date(v).toLocaleDateString("pt-PT", { dateStyle: "medium" })
                    }
                    formatter={(value: number, _name, item) => [
                      `${formatPrice(value)} · ${(item.payload as { orders: number }).orders} enc.`,
                      "Faturação",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue_cents"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#rev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
            {dash.isLoading && <div className="skeleton h-full rounded-lg" />}
          </div>
        </Panel>

        <div className="grid gap-3">
          <Panel title="Stock">
            <dl className="grid grid-cols-2 gap-px bg-border text-sm">
              {[
                { k: "Referências ativas", v: d?.active_products },
                { k: "Unidades", v: d?.stock_units },
                { k: "Sem preço", v: d?.no_price, warn: true },
                { k: "Esgotadas", v: d?.out_of_stock, warn: true },
              ].map((s) => (
                <div key={s.k} className="bg-surface p-4">
                  <dt className="text-xs text-muted-foreground">{s.k}</dt>
                  <dd
                    className={`mt-1 font-mono text-lg font-bold tabular-nums ${s.warn && s.v ? "text-warning" : ""}`}
                  >
                    {s.v ?? "—"}
                  </dd>
                </div>
              ))}
            </dl>
            <Link
              to="/admin/produtos"
              search={{ filtro: "noprice" }}
              className="flex items-center justify-between border-t border-border px-5 py-3 text-xs font-bold text-primary hover:bg-accent"
            >
              Preencher preços <ArrowUpRight className="size-3.5" />
            </Link>
          </Panel>
          <Panel title="Mais vendidas">
            <ol className="divide-y divide-border text-sm">
              {d?.top_products.length ? (
                d.top_products.map((p) => (
                  <li
                    key={p.reference}
                    className="flex items-center justify-between gap-3 px-5 py-2.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-xs font-bold">
                        {p.reference}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {p.title}
                      </span>
                    </span>
                    <span className="shrink-0 text-right font-mono text-xs tabular-nums">
                      {p.units} un.
                      <span className="block text-muted-foreground">
                        {formatPrice(p.revenue_cents)}
                      </span>
                    </span>
                  </li>
                ))
              ) : (
                <li className="px-5 py-6 text-center text-xs text-muted-foreground">
                  Sem vendas no período.
                </li>
              )}
            </ol>
          </Panel>
        </div>
      </div>

      <Panel
        className="mt-3"
        title="Últimas encomendas"
        actions={
          <Link to="/admin/encomendas" className="text-xs font-bold text-primary hover:underline">
            Ver todas
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className={th}>Código</th>
                <th className={th}>Cliente</th>
                <th className={th}>Estado</th>
                <th className={`${th} text-right`}>Total</th>
                <th className={`${th} hidden sm:table-cell`}>Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.data?.rows.slice(0, 8).map((o) => (
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
                  <td className={`${td} max-w-[220px] truncate text-muted-foreground`}>
                    {o.shipping_address?.full_name ?? o.email}
                  </td>
                  <td className={td}>
                    <OrderStatusPill status={o.status} />
                  </td>
                  <td className={`${td} text-right font-mono tabular-nums`}>
                    {formatPrice(o.total_cents)}
                  </td>
                  <td className={`${td} hidden text-muted-foreground sm:table-cell`}>
                    {new Date(o.created_at).toLocaleDateString("pt-PT")}
                  </td>
                </tr>
              ))}
              {recent.data && recent.data.rows.length === 0 && (
                <EmptyRow colSpan={5}>Ainda não há encomendas.</EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
