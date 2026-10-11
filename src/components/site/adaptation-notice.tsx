import { Link } from "@tanstack/react-router";
import { ArrowRight, Phone, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { COMPANY } from "@/lib/content";
import { useT } from "@/lib/i18n";

const ACK_KEY = "centralinas.adaptation-ack.v1";

/** O cliente já confirmou o aviso nesta visita? (sessionStorage: volta a aparecer noutra visita) */
export function hasAdaptationAck(): boolean {
  try {
    return window.sessionStorage.getItem(ACK_KEY) === "1";
  } catch {
    return false;
  }
}

function setAdaptationAck() {
  try {
    window.sessionStorage.setItem(ACK_KEY, "1");
  } catch {
    // armazenamento bloqueado: o aviso volta a aparecer, sem problema
  }
}

/**
 * Aviso obrigatório antes de "Finalizar encomenda": muitas centralinas precisam
 * de adaptação ao veículo, que não está incluída no preço.
 */
export function AdaptationNotice({
  open,
  onCancel,
  onContinue,
  cancelLabel,
}: {
  open: boolean;
  onCancel: () => void;
  onContinue: () => void;
  cancelLabel?: string;
}) {
  const [checked, setChecked] = useState(false);
  const t = useT();
  const a = t.shop.adaptation;
  useEffect(() => {
    if (open) setChecked(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto mb-2 grid size-11 place-items-center rounded-full bg-warning/15 sm:mx-0">
            <TriangleAlert className="size-5 text-warning" aria-hidden />
          </div>
          <DialogTitle className="text-xl">{a.title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {a.p1} <strong className="text-foreground">{a.p1b}</strong> {a.p2}{" "}
            <strong className="text-foreground">{a.p2b}</strong>
            {a.p3}{" "}
            <Link to="/servicos" className="font-semibold text-primary underline-offset-2 hover:underline">
              {a.services}
            </Link>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-surface-elevated/60 p-4 text-sm">
          <p className="font-semibold">{a.help}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            <a href={COMPANY.phoneHref} className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline">
              <Phone className="size-4" aria-hidden /> {COMPANY.phone}
            </a>
            <Link to="/contactos" className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground">
              {a.sendRef} <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </div>

        <label className="flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
          />
          <span className="text-muted-foreground">
            {a.confirm}
          </span>
        </label>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="font-bold" onClick={onCancel}>
            {cancelLabel ?? t.common.back}
          </Button>
          <Button
            className="font-bold"
            disabled={!checked}
            onClick={() => {
              setAdaptationAck();
              onContinue();
            }}
          >
            {a.continue} <ArrowRight />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
