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
import { serviceImage } from "@/lib/images";
import { Button } from "@/components/ui/button";
import { Reveal, Stagger, StaggerItem } from "@/components/site/reveal";

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
    <div className="container-page py-12 md:py-16">
      <Reveal className="max-w-2xl mb-16">
        <div className="mono-label text-primary mb-3">Serviços Técnicos</div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight mb-6">
          Laboratório dedicado a eletrónica automóvel.
        </h1>
        <p className="text-lg text-muted-foreground">
          Não só vendemos centralinas — recuperamos, reprogramamos e clonamos
          hardware crítico para oficinas em Portugal e Europa.
        </p>
      </Reveal>

      <Stagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {services.map((s) => {
          const Icon = icons[s.icon as keyof typeof icons];
          const img = serviceImage[s.id];
          return (
            <StaggerItem key={s.id}>
              <div className="group relative surface-card overflow-hidden hover:border-primary/50 transition-colors h-full">
                {img && (
                  <div className="relative aspect-[16/10] overflow-hidden border-b border-border">
                    <img
                      src={img}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover img-treated transition-transform duration-[600ms] ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
                    <div className="absolute bottom-3 left-3 grid size-11 place-items-center rounded-lg bg-primary/90 backdrop-blur">
                      <Icon className="size-5 text-primary-foreground" />
                    </div>
                  </div>
                )}
                <div className="p-6">
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
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>

      <Reveal className="border-l-2 border-primary bg-surface p-8 md:p-10 grid md:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <div className="mono-label text-primary mb-2">Orçamento em 2h úteis</div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">
            Envia a referência e o defeito.
          </h2>
          <p className="text-muted-foreground max-w-lg">
            Respondemos com preço, prazo e viabilidade de reparação. Sem custo
            de diagnóstico se não avançares.
          </p>
        </div>
        <Link to="/contactos">
          <Button size="lg">Pedir orçamento</Button>
        </Link>
      </Reveal>
    </div>
  );
}
