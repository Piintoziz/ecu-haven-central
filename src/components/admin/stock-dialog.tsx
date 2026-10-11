import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FieldWrap, SelectInput, TextInput } from "@/components/site/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adjustStock, listMovements } from "@/lib/admin";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const REASON_LABEL: Record<string, string> = {
  import: "Importação",
  sale: "Venda",
  adjustment: "Ajuste",
  return: "Devolução",
  cancellation: "Cancelamento",
};

/** Ajuste de stock via log de movimentos (nunca edição direta do número). */
export function StockDialog({
  product,
  onClose,
  onSaved,
}: {
  product: { id: string; title: string; reference: string; stock_quantity: number } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [direction, setDirection] = useState<1 | -1>(1);
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState<"adjustment" | "return">("adjustment");
  const [note, setNote] = useState("");

  const moves = useQuery({
    queryKey: ["admin", "movements", product?.id],
    queryFn: () => listMovements(product!.id),
    enabled: !!product,
  });

  const save = useMutation({
    mutationFn: () =>
      adjustStock({
        product_id: product!.id,
        delta: direction * qty,
        note: note.trim(),
        actor_id: user!.id,
        reason: direction > 0 ? reason : "adjustment",
      }),
    onSuccess: () => {
      toast.success("Stock atualizado");
      setQty(1);
      setNote("");
      onSaved();
      void moves.refetch();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const next = (product?.stock_quantity ?? 0) + direction * qty;

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono">{product?.reference}</DialogTitle>
          <DialogDescription className="truncate">{product?.title}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            {([1, -1] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDirection(d)}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-bold",
                  direction === d
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                {d > 0 ? <Plus className="size-4" /> : <Minus className="size-4" />}
                {d > 0 ? "Entrada" : "Saída"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldWrap id="qty" label="Unidades">
              <TextInput
                id="qty"
                type="number"
                min={1}
                max={10000}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Math.min(10000, Number(e.target.value) || 1)))}
              />
            </FieldWrap>
            {direction > 0 && (
              <FieldWrap id="reason" label="Motivo">
                <SelectInput
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value as "adjustment" | "return")}
                >
                  <option value="adjustment">Ajuste / entrada</option>
                  <option value="return">Devolução de cliente</option>
                </SelectInput>
              </FieldWrap>
            )}
          </div>
          <FieldWrap id="note" label="Nota" optional>
            <TextInput
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              placeholder="Ex.: inventário, peça danificada, lote 12/10"
            />
          </FieldWrap>
          <div className="flex items-center justify-between gap-3 rounded-md bg-surface-elevated px-3 py-2 text-sm">
            <span className="text-muted-foreground">Stock resultante</span>
            <span
              className={cn("font-mono font-bold tabular-nums", next < 0 && "text-destructive")}
            >
              {product?.stock_quantity} → {next}
            </span>
          </div>
          <Button type="submit" className="w-full font-bold" disabled={save.isPending || next < 0}>
            {save.isPending && <Loader2 className="animate-spin" />}
            Registar movimento
          </Button>
        </form>

        <div>
          <h3 className="mono-label mb-2">Últimos movimentos</h3>
          <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
            {moves.data?.map((m) => (
              <li
                key={m.id}
                className="flex justify-between gap-3 rounded px-2 py-1 odd:bg-surface-elevated/50"
              >
                <span className="truncate text-muted-foreground">
                  {new Date(m.created_at).toLocaleString("pt-PT", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}{" "}
                  · {REASON_LABEL[m.reason]}
                  {m.note ? ` · ${m.note}` : ""}
                </span>
                <span
                  className={cn(
                    "font-mono font-bold tabular-nums",
                    m.delta > 0 ? "text-success" : "text-destructive",
                  )}
                >
                  {m.delta > 0 ? `+${m.delta}` : m.delta}
                </span>
              </li>
            ))}
            {moves.data?.length === 0 && <li className="text-muted-foreground">Sem movimentos.</li>}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
