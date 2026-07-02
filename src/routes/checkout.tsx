import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, CreditCard, Truck, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({
    meta: [
      { title: "Checkout — Centralinas" },
      { name: "description", content: "Finalize a sua encomenda." },
    ],
  }),
});

const STEPS = [
  { id: "dados", label: "Dados", icon: User },
  { id: "envio", label: "Envio", icon: Truck },
  { id: "pagamento", label: "Pagamento", icon: CreditCard },
  { id: "confirmacao", label: "Confirmação", icon: Check },
] as const;

function CheckoutPage() {
  const [step, setStep] = useState(0);

  return (
    <div className="container-page py-14 md:py-20">
      <div className="max-w-4xl mx-auto">
        <div className="mono-label text-primary mb-3">Checkout</div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-10">
          Finalizar encomenda
        </h1>

        {/* Stepper */}
        <div className="mb-10 grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors",
                  active
                    ? "border-primary bg-primary/5"
                    : done
                      ? "border-primary/40"
                      : "border-border",
                )}
              >
                <div
                  className={cn(
                    "grid size-8 place-items-center rounded-full text-xs font-bold",
                    done || active
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground border border-border",
                  )}
                >
                  {done ? <Check className="size-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-xs font-bold",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="surface-card p-6 md:p-10">
          {/* TODO(backend): submeter para API real de encomendas + integrar pagamentos */}
          {step === 0 && <StepDados />}
          {step === 1 && <StepEnvio />}
          {step === 2 && <StepPagamento />}
          {step === 3 && <StepConfirmacao />}

          {step < 3 && (
            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                Voltar
              </Button>
              <Button onClick={() => setStep((s) => s + 1)}>Continuar</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mono-label mb-2 block">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60"
      />
    </div>
  );
}

function StepDados() {
  return (
    <>
      <h2 className="text-xl font-extrabold text-foreground mb-6">
        Dados de faturação
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Nome" placeholder="Nome completo" />
        <Field label="NIF" placeholder="123456789" />
        <Field label="Email" type="email" placeholder="email@dominio.pt" />
        <Field label="Telefone" placeholder="+351 …" />
        <div className="sm:col-span-2">
          <Field label="Empresa (opcional)" placeholder="Nome da oficina" />
        </div>
      </div>
    </>
  );
}

function StepEnvio() {
  return (
    <>
      <h2 className="text-xl font-extrabold text-foreground mb-6">
        Morada de envio
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Field label="Morada" placeholder="Rua e número" />
        </div>
        <Field label="Código postal" placeholder="0000-000" />
        <Field label="Localidade" placeholder="Lisboa" />
      </div>
      <div className="mt-6">
        <h3 className="mono-label mb-3">Método de envio</h3>
        <div className="space-y-2">
          {[
            { label: "CTT Expresso · 24h", price: "€12" },
            { label: "DHL Standard · 48h", price: "€15" },
            { label: "Levantamento em armazém", price: "Grátis" },
          ].map((o, i) => (
            <label
              key={o.label}
              className="flex items-center justify-between p-4 rounded-md border border-border cursor-pointer hover:border-primary/40"
            >
              <div className="flex items-center gap-3">
                <input type="radio" name="shipping" defaultChecked={i === 0} />
                <span className="text-sm font-bold text-foreground">
                  {o.label}
                </span>
              </div>
              <span className="mono-label text-primary">{o.price}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
}

function StepPagamento() {
  return (
    <>
      <h2 className="text-xl font-extrabold text-foreground mb-6">
        Método de pagamento
      </h2>
      <div className="space-y-3">
        {["Multibanco", "MB Way", "Cartão de crédito", "Transferência bancária"].map(
          (m, i) => (
            <label
              key={m}
              className="flex items-center gap-3 p-4 rounded-md border border-border cursor-pointer hover:border-primary/40"
            >
              <input type="radio" name="pay" defaultChecked={i === 0} />
              <span className="text-sm font-bold text-foreground flex-1">
                {m}
              </span>
              <span className="mono-label">Placeholder</span>
            </label>
          ),
        )}
      </div>
    </>
  );
}

function StepConfirmacao() {
  return (
    <div className="text-center py-8">
      <div className="grid size-16 place-items-center rounded-full bg-primary mx-auto mb-6">
        <Check className="size-8 text-primary-foreground" />
      </div>
      <h2 className="text-2xl font-extrabold text-foreground mb-3">
        Encomenda confirmada
      </h2>
      <p className="text-muted-foreground mb-6">
        Enviámos os detalhes para o seu email. Pode acompanhar o estado a
        qualquer momento.
      </p>
      <div className="mono-label mb-8">Nº encomenda: CTL-2026-00817</div>
      <Link to="/encomenda">
        <Button size="lg">Acompanhar encomenda</Button>
      </Link>
    </div>
  );
}
