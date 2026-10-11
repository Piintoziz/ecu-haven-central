import { useT } from "@/lib/i18n";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const TONE: Record<OrderStatus, string> = {
  pending_payment: "bg-warning/15 text-warning",
  paid: "bg-primary/15 text-primary",
  processing: "bg-primary/15 text-primary",
  shipped: "bg-sky-500/15 text-sky-400",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
  refunded: "bg-muted text-muted-foreground",
};

export function OrderStatusPill({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold",
        TONE[status],
        className,
      )}
    >
      {useT().common.orderStatus[status]}
    </span>
  );
}
