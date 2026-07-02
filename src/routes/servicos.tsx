import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Copy,
  Cpu,
  Key,
  Truck,
  Wrench,
} from "lucide-react";
import { services } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/servicos")({
  component: ServicosPage,
  head: () => ({
    meta: [
      { title: "Serviços Técnicos — Centralinas" },
      {
        name: "description",
        content:
          "Reparação, reprogramação, clonagem e diagnóstico avançado de centralinas automóveis.",
      },
    ],
  }),
});

const icons = {
  wrench: Wrench,
  cpu: Cpu,
  copy: Copy,
  key: Key,
  activity: Activity,
  truck: Truck,
} as const;

function ServicosPage() {
  return (
    <div className="container-page py-14 md:py-20">
      <div className="max-w-2xl mb-16">
        <div className="mono-label text-primary mb-3">Serviços Técnicos</div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight mb-6">
          Laboratório dedicado a eletrónica automóvel.
        </h1>
        <p className="text-lg text-muted-foreground">
          Não só vendemos centralinas — recuperamos, reprogramamos e clonamos
          hardware crítico para oficinas em Portugal e Europa.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {services.map((s) => {
          const Icon = icons[s.icon as keyof typeof icons];
          return (
            <div
              key={s.id}
              className="surface-card p-8 hover-lift hover:border-primary/40"
            >
              <div className="grid size-12 place-items-center rounded-lg bg-primary/10 mb-6">
                <Icon className="size-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                {s.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {s.description}
              </p>
              <Link
                to="/contactos"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all"
              >
                Pedir orçamento <ArrowRight className="size-4" />
              </Link>
            </div>
          );
        })}
      </div>

      <div className="surface-card p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 grid-noise opacity-30" />
        <div className="relative">
          <div className="mono-label text-primary mb-3">Precisa de algo específico?</div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4">
            Fala com um técnico especializado
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6">
            Envie a referência ou descrição do problema. Respondemos em minutos.
          </p>
          <Link to="/contactos">
            <Button size="lg">Pedir orçamento personalizado</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
