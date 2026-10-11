import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Banknote, Check, Copy, Mail, PackageSearch, Truck, UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AddressBlock, type AddressLike } from "./address-block";
import { CheckoutSteps } from "./checkout-steps";
import type { CartLine } from "@/lib/cart";
import { COMPANY } from "@/lib/content";
import { useT } from "@/lib/i18n";
import type { BankDetails } from "@/lib/orders.functions";
import type { ShippingOption } from "@/lib/types";

export type CompletedOrder = {
  order_code: string;
  email: string;
  subtotal_cents: number;
  shipping_cents: number;
  vat_cents: number;
  total_cents: number;
  bank: BankDetails | null;
  lines: CartLine[];
  shipTo: AddressLike;
  rate: ShippingOption | null;
  hasAccount: boolean;
};

/** Passos 3 (Pagar) e 4 (Informações da encomenda), depois de a encomenda ser registada. */
export function OrderComplete({ order }: { order: CompletedOrder }) {
  const [step, setStep] = useState<3 | 4>(3);
  return (
    <div className="container-page py-10 md:py-14">
      <CheckoutSteps current={step} />
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {step === 3 ? (
          <PayStep
            order={order}
            onDone={() => {
              setStep(4);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        ) : (
          <InfoStep order={order} />
        )}
      </motion.div>
    </div>
  );
}

function CopyValue({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const t = useT();
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3">
      <div className="min-w-0">
        <p className="mono-label">{label}</p>
        <p className={`mt-0.5 break-all text-base font-bold ${mono ? "font-mono tracking-wide" : ""}`}>{value}</p>
      </div>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value.replace(/\s+(?=\S)/g, label === "IBAN" ? "" : " "));
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* sem permissão de clipboard */
          }
        }}
        className="grid size-9 shrink-0 place-items-center rounded-md border border-border hover:bg-accent"
        aria-label={t.orders.pay.copy(label)}
      >
        {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}

function PayStep({ order, onDone }: { order: CompletedOrder; onDone: () => void }) {
  const t = useT();
  const p = t.orders.pay;
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section>
        <h1 className="text-3xl font-extrabold md:text-4xl">{p.title}</h1>
        <p className="mt-2 text-muted-foreground">
          {p.registered} <b className="font-mono text-foreground">{order.order_code}</b> {p.registered2}
        </p>

        <div className="mt-8 rounded-xl border border-primary/40 bg-surface p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-primary/15">
              <Banknote className="size-5 text-primary" aria-hidden />
            </span>
            <div>
              <h2 className="font-bold">{p.bank}</h2>
              <p className="text-xs text-muted-foreground">{p.bankNote}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <CopyValue label={p.amount} value={t.common.price(order.total_cents)} mono={false} />
            {order.bank?.iban ? (
              <>
                <CopyValue label="IBAN" value={order.bank.iban} />
                {order.bank.bic && <CopyValue label={p.bic} value={order.bank.bic} />}
                {order.bank.holder && <CopyValue label={p.holder} value={order.bank.holder} mono={false} />}
              </>
            ) : (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                {p.bankByEmail} <b className="text-foreground">{order.email}</b> {p.bankByEmail2}
              </p>
            )}
            <CopyValue label={p.reference} value={order.order_code} />
          </div>
          <p className="mt-4 text-xs text-warning">
            {p.referenceWarning(order.order_code)}
          </p>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          {p.otherMethods(order.email)}
        </p>

        <Button size="lg" className="mt-6 w-full font-bold sm:w-auto" onClick={onDone}>
          {p.next} <ArrowRight />
        </Button>
      </section>

      <Summary order={order} />
    </div>
  );
}

function InfoStep({ order }: { order: CompletedOrder }) {
  const t = useT();
  const f = t.orders.info;
  const next: { icon: typeof Mail; title: string; text: ReactNode }[] = [
    {
      icon: Mail,
      title: f.emailTitle,
      text: (
        <>
          {f.emailText} <b className="text-foreground">{order.email}</b>{f.emailText2}
        </>
      ),
    },
    {
      icon: Banknote,
      title: f.paidTitle,
      text: f.paidText,
    },
    {
      icon: Truck,
      title: f.shipTitle,
      text: order.rate
        ? `${order.rate.carrier} · ${t.common.serviceLevel[order.rate.service_level]}${
            order.rate.est_days_min != null ? ` · ${t.common.delivery(order.rate.est_days_min, order.rate.est_days_max)}` : ""
          }. ${f.shipText}`
        : f.shipText,
    },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section>
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-success/15">
            <Check className="size-6 text-success" aria-hidden />
          </span>
          <h1 className="text-3xl font-extrabold md:text-4xl">{f.title}</h1>
        </div>
        <p className="mt-3 text-muted-foreground">
          {f.keepCode} <b className="font-mono text-foreground">{order.order_code}</b> {f.keepCode2(order.hasAccount)}
        </p>

        <ol className="mt-8 space-y-4">
          {next.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex gap-4 rounded-xl border border-border bg-surface p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border font-mono text-xs font-bold">
                {i + 1}
              </span>
              <div>
                <p className="flex items-center gap-2 font-bold">
                  <Icon className="size-4 text-primary" aria-hidden /> {title}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="font-bold">
            <Link to="/encomenda" search={{ codigo: order.order_code }}>
              <PackageSearch /> {f.track}
            </Link>
          </Button>
          {order.hasAccount ? (
            <Button asChild size="lg" variant="outline" className="font-bold">
              <Link to="/conta">
                <UserRound /> {f.account}
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" variant="outline" className="font-bold">
              <Link to="/catalogo">{f.continue}</Link>
            </Button>
          )}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          {f.adaptation}{" "}
          <a href={COMPANY.phoneHref} className="font-semibold text-foreground hover:underline">
            {COMPANY.phone}
          </a>{" "}
          {f.or}{" "}
          <Link to="/servicos" className="font-semibold text-foreground hover:underline">
            {f.services}
          </Link>
          .
        </p>
      </section>

      <aside className="space-y-4">
        <Summary order={order} />
        <div className="rounded-xl border border-border bg-surface p-5">
          <AddressBlock title={f.shipTo} address={order.shipTo} />
        </div>
      </aside>
    </div>
  );
}

function Summary({ order }: { order: CompletedOrder }) {
  const t = useT();
  const s = t.orders.summary;
  const formatPrice = t.common.price;
  return (
    <aside className="h-fit rounded-xl border border-border bg-surface p-5">
      <h2 className="mono-label mb-3">{s.order} {order.order_code}</h2>
      <ul className="space-y-2 text-sm">
        {order.lines.map((l) => (
          <li key={l.productId} className="flex justify-between gap-3">
            <span className="min-w-0">
              <span className="block truncate font-mono font-bold">{l.reference}</span>
                          </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">× {l.quantity}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{s.subtotal}</dt>
          <dd className="tabular-nums">{formatPrice(order.subtotal_cents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{s.shipping}</dt>
          <dd className="tabular-nums">{formatPrice(order.shipping_cents)}</dd>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-extrabold">
          <dt>{s.total}</dt>
          <dd className="tabular-nums">{formatPrice(order.total_cents)}</dd>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <dt>{s.vat}</dt>
          <dd className="tabular-nums">{formatPrice(order.vat_cents)}</dd>
        </div>
      </dl>
    </aside>
  );
}
