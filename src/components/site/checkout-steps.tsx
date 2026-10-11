import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type CheckoutStep = 1 | 2 | 3 | 4;

const STEPS: { n: CheckoutStep; label: "cart" | "checkout" | "pay" | "info"; short: "cart" | "checkoutShort" | "pay" | "infoShort" }[] = [
  { n: 1, label: "cart", short: "cart" },
  { n: 2, label: "checkout", short: "checkoutShort" },
  { n: 3, label: "pay", short: "pay" },
  { n: 4, label: "info", short: "infoShort" },
];

/** Ordem da compra: Carrinho → Finalizar encomenda → Pagar → Informações da encomenda. */
export function CheckoutSteps({ current, className }: { current: CheckoutStep; className?: string }) {
  const t = useT().orders.checkoutSteps;
  return (
    <nav aria-label={t.aria} className={cn("mb-8", className)}>
      <ol className="flex items-center gap-2 sm:gap-3">
        {STEPS.map((s, i) => {
          const done = s.n < current;
          const active = s.n === current;
          // Só se pode voltar ao carrinho antes de a encomenda ser registada.
          const backToCart = s.n === 1 && current === 2;
          const content = (
            <>
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold transition-colors",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary text-primary shadow-[0_0_0_4px_color-mix(in_oklch,var(--primary)_18%,transparent)]",
                  !done && !active && "border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" aria-hidden /> : s.n}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold sm:text-sm",
                  active ? "text-foreground" : "text-muted-foreground",
                  !active && "hidden md:inline",
                )}
              >
                <span className="sm:hidden">{t[s.short]}</span>
                <span className="hidden sm:inline">{t[s.label]}</span>
              </span>
            </>
          );
          return (
            <li
              key={s.n}
              className="flex min-w-0 items-center gap-2 sm:gap-3"
              aria-current={active ? "step" : undefined}
            >
              {backToCart ? (
                <Link to="/carrinho" className="flex items-center gap-2 hover:opacity-80">
                  {content}
                </Link>
              ) : (
                <span className="flex items-center gap-2">{content}</span>
              )}
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={cn("h-px w-4 shrink-0 sm:w-8 lg:w-14", s.n < current ? "bg-primary" : "bg-border")}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
