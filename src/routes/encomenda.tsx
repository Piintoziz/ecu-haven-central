import { createFileRoute } from "@tanstack/react-router";
import { Check, Package, PackageCheck, Truck, Warehouse } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trackingSteps, type TrackingStepId } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/encomenda")({
  component: EncomendaPage,
  head: () => ({
    meta: [
      { title: "Acompanhar Encomenda — Centralinas" },
      {
        name: "description",
        content:
          "Acompanhe o estado da sua encomenda em tempo real, desde a preparação até à entrega.",
      },
    ],
  }),
});

const stepIcons: Record<TrackingStepId, typeof Check> = {
  confirmed: Check,
  preparing: Package,
  shipped: Warehouse,
  "in-transit": Truck,
  delivered: PackageCheck,
};

function EncomendaPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [carrier, setCarrier] = useState("CTT Expresso");
  const [submitted, setSubmitted] = useState(false);

  // Mock: assume encomenda está em trânsito (índice 3)
  const currentStep = 3;

  return (
    <div className="container-page py-14 md:py-20">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="mono-label text-primary mb-3">Tracking</div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
            Acompanhar encomenda
          </h1>
          <p className="text-muted-foreground">
            Introduza o número da encomenda para ver o estado em tempo real.
          </p>
        </div>

        {/* TODO(backend): integrar com API real de transportadora (CTT, DHL, etc.) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="surface-card p-6 mb-12 grid gap-4 sm:grid-cols-[1fr_auto_auto]"
        >
          <div>
            <label className="mono-label mb-2 block">Nº da encomenda</label>
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Ex: CTL-2026-01234"
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60"
              required
            />
          </div>
          <div>
            <label className="mono-label mb-2 block">Transportadora</label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60"
            >
              <option>CTT Expresso</option>
              <option>DHL</option>
              <option>DPD</option>
              <option>Nacex</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              Acompanhar
            </Button>
          </div>
        </form>

        {submitted && (
          <div className="surface-card p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 pb-6 border-b border-border">
              <div>
                <div className="mono-label mb-1">Encomenda</div>
                <div className="font-mono text-lg font-bold text-foreground">
                  {orderNumber}
                </div>
              </div>
              <div className="text-sm">
                <span className="mono-label">Transportadora: </span>
                <span className="font-bold text-foreground">{carrier}</span>
              </div>
              <div className="rounded-md bg-warning/15 text-warning px-3 py-1 text-xs font-bold uppercase tracking-wider">
                Em trânsito
              </div>
            </div>

            {/* Stepper */}
            <div className="relative">
              <div className="hidden sm:block absolute left-0 right-0 top-6 h-0.5 bg-border">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${(currentStep / (trackingSteps.length - 1)) * 100}%`,
                  }}
                />
              </div>

              <ol className="grid sm:grid-cols-5 gap-6 sm:gap-2 relative">
                {trackingSteps.map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  const Icon = stepIcons[step.id];
                  return (
                    <li
                      key={step.id}
                      className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-4"
                    >
                      <div
                        className={cn(
                          "grid size-12 place-items-center rounded-full border-2 shrink-0 relative bg-background transition-colors",
                          done
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground",
                          active && "ring-4 ring-primary/20",
                        )}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div className="flex-1">
                        <div className="mono-label mb-1">Passo {i + 1}</div>
                        <div
                          className={cn(
                            "text-sm font-bold",
                            done ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {step.label}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="mt-10 pt-6 border-t border-border">
              <div className="mono-label mb-3">Última atualização</div>
              <p className="text-sm text-foreground">
                A sua encomenda saiu do centro de distribuição de Lisboa e está a
                caminho do destino.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
