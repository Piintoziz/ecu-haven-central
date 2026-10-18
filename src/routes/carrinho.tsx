import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdaptationNotice } from "@/components/site/adaptation-notice";
import { CheckoutSteps } from "@/components/site/checkout-steps";
import { getCartProducts } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { headI18n, useI18n } from "@/lib/i18n";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/carrinho")({
  head: ({ match }) => {
    const { locale, t } = headI18n(match);
    return pageHead({
      title: t.shop.cart.title,
      description: t.shop.cart.metaDescription,
      path: "/carrinho",
      noindex: true,
      locale,
    });
  },
  component: CarrinhoPage,
});

function CarrinhoPage() {
  const { lines, ready, subtotalCents, vatCents, setQuantity, remove, sync } = useCart();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(false);
  const { t, locale } = useI18n();
  const c = t.shop.cart;
  const formatPrice = t.common.price;
  const ids = useMemo(() => lines.map((l) => l.productId).sort(), [lines]);

  // Revalida preços e stock com a base de dados
  const live = useQuery({
    queryKey: ["cart-live", ids],
    queryFn: () => getCartProducts(ids),
    enabled: ready && ids.length > 0,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (live.data) sync(live.data);
  }, [live.data, sync]);

  const stockById = new Map((live.data ?? []).map((p) => [p.id, p.stock_quantity]));
  const hasStockIssue = lines.some((l) => {
    const s = stockById.get(l.productId);
    return s != null && s < l.quantity;
  });

  if (!ready) {
    return <div className="container-page py-16"><div className="skeleton h-40 rounded-xl" /></div>;
  }

  if (lines.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-3xl font-extrabold">{c.emptyTitle}</h1>
        <p className="mt-3 text-muted-foreground">{c.emptyText}</p>
        <Link
          to="/catalogo"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
        >
          {c.goCatalog} <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10 md:py-14">
      <CheckoutSteps current={1} />
      <h1 className="text-3xl font-extrabold md:text-4xl">{c.title}</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-border border-y border-border">
          <AnimatePresence initial={false}>
            {lines.map((l) => {
              const stock = stockById.get(l.productId);
              const short = stock != null && stock < l.quantity;
              return (
                <motion.li
                  key={l.productId}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-[1fr_auto] gap-4 py-5 sm:grid-cols-[1fr_auto_auto]"
                >
                  <div className="min-w-0">
                    <Link
                      to="/centralinas/$slug"
                      params={{ slug: l.slug }}
                      className="font-mono text-base font-bold hover:text-primary"
                    >
                      {l.reference}
                    </Link>
                    {/* título guardado em PT no carrinho: em EN basta a referência */}
                    {locale === "pt" && <p className="truncate text-sm text-muted-foreground">{l.title}</p>}
                    <p className="mt-1 text-xs tabular-nums text-muted-foreground">{formatPrice(l.priceCents)} {c.perUnit}</p>
                    {short && (
                      <p className="mt-1 text-xs font-semibold text-warning">
                        {stock === 0 ? c.outNow : c.onlyN(stock)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-center">
                    <div className="flex h-9 items-center rounded-md border border-border">
                      <button
                        type="button"
                        className="grid h-full w-8 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                        onClick={() => setQuantity(l.productId, l.quantity - 1)}
                        disabled={l.quantity <= 1}
                        aria-label={c.decrease(l.reference)}
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-7 text-center font-mono text-sm tabular-nums">{l.quantity}</span>
                      <button
                        type="button"
                        className="grid h-full w-8 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                        onClick={() => setQuantity(l.productId, l.quantity + 1)}
                        disabled={stock != null && l.quantity >= stock}
                        aria-label={c.increase(l.reference)}
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(l.productId)}
                      className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={c.remove(l.reference)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="col-span-2 text-right font-bold tabular-nums sm:col-span-1 sm:self-center sm:min-w-24">
                    {formatPrice(l.priceCents * l.quantity)}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>

        <aside className="self-start rounded-xl border border-border bg-surface p-6 lg:sticky lg:top-28">
          <h2 className="text-lg font-extrabold">{c.summary}</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{c.subtotal}</dt>
              <dd className="tabular-nums">{formatPrice(subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{c.vat}</dt>
              <dd className="tabular-nums">{formatPrice(vatCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{c.shipping}</dt>
              <dd className="text-muted-foreground">{c.shippingNext}</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="font-bold">{c.totalVat}</span>
            <span className="text-2xl font-extrabold tabular-nums">{formatPrice(subtotalCents + vatCents)}</span>
          </div>
          {hasStockIssue ? (
            <p className="mt-5 rounded-md bg-warning/10 p-3 text-xs text-warning">
              {c.fixQty}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setNotice(true)}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              {c.checkout} <ArrowRight className="size-4" />
            </button>
          )}
          <p className="mt-3 text-center text-xs text-muted-foreground">{c.noAccount}</p>
        </aside>
      </div>
      <AdaptationNotice
        open={notice}
        onCancel={() => setNotice(false)}
        onContinue={() => {
          setNotice(false);
          void navigate({ to: "/checkout" });
        }}
      />
    </div>
  );
}
