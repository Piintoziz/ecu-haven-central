import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, PackageOpen } from "lucide-react";
import { OrderStatusPill } from "@/components/site/order-status-pill";
import { listMyOrders } from "@/lib/account";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/conta/")({
  component: MinhasEncomendas,
});

function MinhasEncomendas() {
  const { user } = useAuth();
  const t = useT();
  const a = t.orders.account;
  const orders = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: () => listMyOrders(user!.id),
    enabled: !!user,
  });

  if (orders.isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (orders.error) {
    return <p className="text-sm text-destructive">{t.common.msg((orders.error as Error).message)}</p>;
  }

  if (!orders.data?.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <PackageOpen className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <p className="mt-3 font-bold">{a.emptyTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {a.emptyText}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Link
            to="/catalogo"
            className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            {a.searchRef}
          </Link>
          <Link
            to="/encomenda"
            className="rounded-md border border-border px-4 py-2 text-sm font-bold hover:bg-accent"
          >
            {a.trackByCode}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">{a.cols.order}</th>
            <th className="hidden px-4 py-3 font-semibold sm:table-cell">{a.cols.date}</th>
            <th className="hidden px-4 py-3 font-semibold md:table-cell">{a.cols.refs}</th>
            <th className="px-4 py-3 font-semibold">{a.cols.status}</th>
            <th className="px-4 py-3 text-right font-semibold">{a.cols.total}</th>
            <th className="w-8" aria-hidden />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.data.map((o) => (
            <tr key={o.id} className="group relative hover:bg-surface/60">
              <td className="px-4 py-3.5 font-mono font-bold">
                <Link
                  to="/conta/encomendas/$code"
                  params={{ code: o.order_code }}
                  className="after:absolute after:inset-0 focus-visible:outline-none"
                >
                  {o.order_code}
                </Link>
              </td>
              <td className="hidden px-4 py-3.5 text-muted-foreground sm:table-cell">
                {t.common.date(o.created_at)}
              </td>
              <td className="hidden max-w-[220px] truncate px-4 py-3.5 font-mono text-xs text-muted-foreground md:table-cell">
                {o.order_items.map((i) => i.reference_snapshot).join(", ")}
              </td>
              <td className="px-4 py-3.5">
                <OrderStatusPill status={o.status} />
              </td>
              <td className="px-4 py-3.5 text-right font-mono font-bold tabular-nums">
                {t.common.price(o.total_cents)}
              </td>
              <td className="pr-3 text-muted-foreground">
                <ChevronRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
