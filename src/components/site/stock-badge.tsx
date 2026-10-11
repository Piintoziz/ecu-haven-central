import { stockState } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function StockBadge({ quantity, className }: { quantity: number; className?: string }) {
  const state = stockState(quantity);
  const s = useT().common.stock;
  const label = state === "out" ? s.out : state === "low" ? s.low(quantity) : s.in;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap",
        state === "out" && "text-muted-foreground",
        state === "low" && "text-warning",
        state === "in_stock" && "text-success",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          state === "out" && "bg-muted-foreground/50",
          state === "low" && "bg-warning",
          state === "in_stock" && "bg-success",
        )}
      />
      {label}
    </span>
  );
}
