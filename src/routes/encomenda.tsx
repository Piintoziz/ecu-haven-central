import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { PayRetry } from "@/components/site/order-complete";
import { OrderView } from "@/components/site/order-view";
import { Button } from "@/components/ui/button";
import { trackOrder } from "@/lib/orders.functions";
import { ORDER_CODE_RE } from "@/lib/schemas";
import { headI18n, useT } from "@/lib/i18n";
import { pageHead } from "@/lib/seo";
import type { TrackedOrder } from "@/lib/types";

export const Route = createFileRoute("/encomenda")({
  validateSearch: (s: Record<string, unknown>) =>
    z
      .object({
        codigo: z.string().max(20).optional().catch(undefined),
        // Regresso da página de pagamento do Stripe
        pagamento: z.enum(["ok", "cancelado"]).optional().catch(undefined),
      })
      .parse(s),
  head: ({ match }) => {
    const { locale, t } = headI18n(match);
    return pageHead({ title: t.orders.trackTitle, description: t.orders.trackMetaDescription, path: "/encomenda", noindex: true, locale });
  },
  component: EncomendaPage,
});

/** Aceita "ct uagkl 2an9r", "CTUAGKL2AN9R", etc. e devolve "CT-UAGKL-2AN9R". */
function formatCode(raw: string): string {
  let c = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (c.length === 12 && c.startsWith("CT")) c = c.slice(2);
  if (c.length !== 10) return raw.toUpperCase().trim();
  return `CT-${c.slice(0, 5)}-${c.slice(5)}`;
}

function EncomendaPage() {
  const { codigo, pagamento } = Route.useSearch();
  const [code, setCode] = useState(codigo ? formatCode(codigo) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const autoRan = useRef(false);
  const t = useT();
  const o = t.orders;

  async function lookup(value: string) {
    setError(null);
    if (!ORDER_CODE_RE.test(value)) {
      setError(o.codeFormat);
      return;
    }
    setLoading(true);
    try {
      const res = await trackOrder({ data: { code: value } });
      if (res.ok) setOrder(res.order);
      else {
        setOrder(null);
        setError(res.error);
      }
    } catch {
      setError(o.unavailable);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (codigo && !autoRan.current) {
      autoRan.current = true;
      void lookup(formatCode(codigo));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo]);

  return (
    <div className="container-page py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold md:text-4xl">{o.trackTitle}</h1>
        <p className="mt-2 text-muted-foreground">
          {o.trackIntro}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formatted = formatCode(code);
            setCode(formatted);
            void lookup(formatted);
          }}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="codigo" className="sr-only">{o.codeLabel}</label>
          <input
            id="codigo"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 20))}
            maxLength={20}
            placeholder="CT-XXXXX-XXXXX"
            autoComplete="off"
            spellCheck={false}
            className="h-12 flex-1 rounded-md border border-input bg-background px-4 font-mono text-lg tracking-wider placeholder:text-muted-foreground/50 focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Button type="submit" size="lg" className="h-12 font-bold" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Search />}
            {o.lookup}
          </Button>
        </form>
        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {t.common.msg(error)}
          </p>
        )}

        {pagamento && order && (
          <div
            role="status"
            className={`mt-8 rounded-xl border p-5 ${pagamento === "ok" ? "border-success/50 bg-success/10" : "border-warning/50 bg-warning/10"}`}
          >
            <p className="font-bold">
              {pagamento === "ok"
                ? order.payment_status === "captured"
                  ? o.payReturn.paid
                  : o.payReturn.processing
                : o.payReturn.cancelled}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {pagamento === "ok" ? o.payReturn.paidText : o.payReturn.cancelledText}
            </p>
          </div>
        )}
        {order?.status === "pending_payment" && order.payment_status !== "captured" && pagamento !== "ok" && (
          <PayRetry code={order.order_code} />
        )}
        {order && <OrderView order={order} />}
      </div>
    </div>
  );
}
