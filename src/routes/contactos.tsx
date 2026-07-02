import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contactos")({
  component: ContactosPage,
  head: () => ({
    meta: [
      { title: "Contactos — Centralinas" },
      {
        name: "description",
        content:
          "Fale com a nossa equipa técnica. Respondemos a orçamentos em minutos.",
      },
    ],
  }),
});

function ContactosPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="container-page py-14 md:py-20">
      <div className="max-w-2xl mb-12">
        <div className="mono-label text-primary mb-3">Contactos</div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
          Fale com um técnico
        </h1>
        <p className="text-muted-foreground">
          Envie a referência OEM ou descreva o problema. Respondemos por email
          ou telefone em minutos.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-10">
        {/* TODO(backend): ligar submissão a API real de contactos / CRM */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="surface-card p-6 md:p-8"
        >
          {sent ? (
            <div className="text-center py-10">
              <div className="mono-label text-primary mb-3">Recebido</div>
              <h2 className="text-2xl font-extrabold text-foreground mb-3">
                Obrigado!
              </h2>
              <p className="text-muted-foreground">
                Vamos responder no máximo em 2h úteis.
              </p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Nome" placeholder="O seu nome" />
                <Field label="Empresa" placeholder="Nome da oficina" />
                <Field label="Email" type="email" placeholder="email@dominio.pt" />
                <Field label="Telefone" placeholder="+351 …" />
              </div>
              <div className="mt-4">
                <Field label="Referência OEM (opcional)" placeholder="Ex: 0281016000" />
              </div>
              <div className="mt-4">
                <label className="mono-label mb-2 block">Mensagem</label>
                <textarea
                  rows={5}
                  placeholder="Descreva o problema ou a peça que procura"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60"
                />
              </div>
              <Button type="submit" size="lg" className="mt-6 w-full sm:w-auto">
                Enviar pedido
              </Button>
            </>
          )}
        </form>

        <aside className="space-y-4">
          <InfoCard icon={Phone} label="Telefone" value="+351 220 000 000" />
          <InfoCard icon={Mail} label="Email" value="geral@centralinas.pt" />
          <InfoCard
            icon={MapPin}
            label="Morada"
            value="Zona Industrial Norte, Porto, Portugal"
          />
          <InfoCard
            icon={Clock}
            label="Horário"
            value="Seg–Sex 09h–19h · Sáb 09h–13h"
          />
        </aside>
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

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="surface-card p-5 flex items-start gap-4">
      <div className="grid size-10 place-items-center rounded-md bg-primary/10 shrink-0">
        <Icon className="size-4 text-primary" />
      </div>
      <div className="min-w-0">
        <div className="mono-label mb-1">{label}</div>
        <div className="text-sm font-bold text-foreground">{value}</div>
      </div>
    </div>
  );
}
