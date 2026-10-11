import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AddressBlock } from "@/components/site/address-block";
import { OrderView } from "@/components/site/order-view";
import { getMyOrder } from "@/lib/account";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { ORDER_CODE_RE } from "@/lib/schemas";

export const Route = createFileRoute("/conta/encomendas/$code")({
  component: MinhaEncomenda,
});

function MinhaEncomenda() {
  const { code } = Route.useParams();
  const { user } = useAuth();
  const valid = ORDER_CODE_RE.test(code);
  const t = useT();
  const a = t.orders.account;
  const formatPrice = t.common.price;
  const order = useQuery({
    queryKey: ["my-order", user?.id, code],
    queryFn: () => getMyOrder(user!.id, code),
    enabled: !!user && valid,
  });

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/conta"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> {a.allOrders}
      </Link>

      {order.isLoading && <div className="skeleton mt-6 h-72 rounded-xl" />}
      {(!valid || (order.isSuccess && !order.data)) && (
        <p className="mt-6 text-sm text-muted-foreground">{a.notFound}</p>
      )}
      {order.error && (
        <p className="mt-6 text-sm text-destructive">{t.common.msg((order.error as Error).message)}</p>
      )}

      {order.data && (
        <OrderView order={order.data}>
          <div className="grid gap-6 border-t border-border p-5 sm:grid-cols-2">
            <AddressBlock title={a.delivery} address={order.data.shipping_address} />
            <AddressBlock title={a.billing} address={order.data.billing_address} />
          </div>
          <dl className="space-y-1.5 border-t border-border p-5 text-sm">
            {order.data.lines.map((l, i) => (
              <div key={i} className="flex justify-between gap-4 text-muted-foreground">
                <dt>
                  <span className="font-mono">{l.reference}</span> × {l.quantity}
                </dt>
                <dd className="tabular-nums">{formatPrice(l.unit_price_cents * l.quantity)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 text-muted-foreground">
              <dt>{a.shipping}</dt>
              <dd className="tabular-nums">{formatPrice(order.data.shipping_cents)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-2 font-bold">
              <dt>{a.total}</dt>
              <dd className="font-mono tabular-nums">{formatPrice(order.data.total_cents)}</dd>
            </div>
            <div className="flex justify-between gap-4 text-xs text-muted-foreground">
              <dt>{a.vatIncluded}</dt>
              <dd className="tabular-nums">{formatPrice(order.data.vat_cents)}</dd>
            </div>
          </dl>
        </OrderView>
      )}
    </div>
  );
}
