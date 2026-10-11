import { motion } from "framer-motion";
import { Check, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { useT } from "@/lib/i18n";
import type { OrderStatus, TrackedOrder } from "@/lib/types";
import { cn } from "@/lib/utils";

// Vista de uma encomenda: usada no tracking sem conta (/encomenda) e na área de cliente.

const STEPS: OrderStatus[] = ["pending_payment", "paid", "processing", "shipped", "delivered"];

export function OrderView({ order, children }: { order: TrackedOrder; children?: ReactNode }) {
  const cancelled = order.status === "cancelled" || order.status === "refunded";
  const currentIndex = STEPS.indexOf(order.status);
  const t = useT();
  const o = t.orders;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-10 rounded-xl border border-border bg-surface"
      aria-live="polite"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
        <div>
          <p className="font-mono text-lg font-bold">{order.order_code}</p>
          <p className="text-xs text-muted-foreground">
            {t.common.dateLong(order.created_at)} · {t.common.price(order.total_cents)}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold",
            cancelled ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary",
          )}
        >
          {t.common.orderStatus[order.status]}
        </span>
      </header>

      {!cancelled && (
        <ol className="grid grid-cols-5 gap-2 p-5" aria-label={o.progress}>
          {STEPS.map((s, i) => {
            const done = i <= currentIndex;
            return (
              <li key={s} className="flex flex-col items-center gap-2 text-center">
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full border text-xs font-bold",
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    done ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {o.steps[s as keyof typeof o.steps]}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="border-t border-border p-5">
        <h2 className="mono-label mb-3">{o.items}</h2>
        <ul className="space-y-2 text-sm">
          {order.items.map((it, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>
                <span className="font-mono font-bold">{it.reference}</span>{" "}
                <span className="text-muted-foreground">{it.title}</span>
              </span>
              <span className="tabular-nums text-muted-foreground">× {it.quantity}</span>
            </li>
          ))}
        </ul>
      </div>

      {order.shipments.map((s, i) => (
        <div key={i} className="border-t border-border p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold">
              {s.carrier} · {t.common.serviceLevel[s.service_level]}
            </h2>
            {s.tracking_url && (
              <a
                href={s.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary"
              >
                {s.tracking_number ?? o.trackCarrier}{" "}
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
          {s.events.length > 0 && (
            <ol className="mt-4 space-y-3 border-l border-border pl-4">
              {s.events.map((e, j) => (
                <li key={j} className="relative text-sm">
                  <span
                    className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary"
                    aria-hidden
                  />
                  <p className="font-semibold">
                    {e.description ?? t.common.shipmentStatus[e.status] ?? e.status}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.common.dateTime(e.occurred_at)}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      ))}
      {children}
    </motion.section>
  );
}
