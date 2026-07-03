import { createFileRoute } from "@tanstack/react-router";
import { Cpu, Layers, ShieldCheck, Users } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/site/reveal";
import { CountUp } from "@/components/site/count-up";
import { images } from "@/lib/images";

export const Route = createFileRoute("/sobre")({
  component: SobrePage,
  head: () => ({
    meta: [
      { title: "Sobre Nós — Centralinas" },
      {
        name: "description",
        content:
          "20 anos a especializar-nos em eletrónica automóvel — o maior stock de centralinas da Europa.",
      },
    ],
  }),
});

function SobrePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={images.workshop}
            alt=""
            className="h-full w-full object-cover img-treated-warm"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/50" />
        </div>
        <div className="container-page py-16 md:py-24">
          <Reveal className="max-w-3xl">
            <div className="mono-label text-primary mb-3">Sobre</div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-6">
              20 anos a fornecer centralinas às oficinas da Europa.
            </h1>
            <p className="text-lg text-muted-foreground">
              Começámos numa oficina em 2004. Hoje somos referência europeia em
              venda, reparação e reprogramação de eletrónica automóvel, com um
              armazém de 250.000+ referências e um laboratório técnico dedicado.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="container-page py-12 md:py-16">
        <Stagger className="grid md:grid-cols-4 gap-6 mb-20">
          {[
            { icon: Layers, value: 250000, suffix: "+", label: "Referências" },
            { icon: Cpu, value: 60, suffix: "+", label: "Marcas suportadas" },
            { icon: Users, value: 3500, suffix: "+", label: "Oficinas parceiras" },
            { icon: ShieldCheck, value: 20, suffix: " anos", label: "Know-how técnico" },
          ].map((s) => (
            <StaggerItem key={s.label}>
              <div className="surface-card p-6 h-full">
                <s.icon className="size-6 text-primary mb-4" />
                <div className="text-3xl font-extrabold text-foreground font-mono">
                  <CountUp end={s.value} suffix={s.suffix} />
                </div>
                <div className="mono-label mt-1">{s.label}</div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="grid md:grid-cols-2 gap-12 mb-20 items-center">
          <Reveal>
            <div className="mono-label text-primary mb-3">Missão</div>
            <h2 className="text-2xl font-extrabold text-foreground mb-4">
              Encurtar o tempo entre diagnóstico e reparação.
            </h2>
            <p className="text-muted-foreground">
              O tempo do mecânico é o recurso mais caro da oficina. Existimos
              para que a peça certa esteja disponível na primeira pesquisa —
              com garantia, testada e enviada em 24 horas.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border">
            <img
              src={images.warehouse}
              alt="Armazém de centralinas"
              loading="lazy"
              className="h-full w-full object-cover img-treated"
            />
          </Reveal>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <Reveal className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border md:order-1 order-2">
            <img
              src={images.team}
              alt="Equipa técnica"
              loading="lazy"
              className="h-full w-full object-cover img-treated"
            />
          </Reveal>
          <Reveal delay={0.1} className="md:order-2 order-1">
            <div className="mono-label text-primary mb-3">Como trabalhamos</div>
            <h2 className="text-2xl font-extrabold text-foreground mb-4">
              Cada centralina passa por bancada de teste.
            </h2>
            <p className="text-muted-foreground">
              Recondicionamos hardware em laboratório próprio: teste elétrico,
              simulação de sinais, atualização de firmware e virginização
              quando aplicável. Só depois entra em stock.
            </p>
          </Reveal>
        </div>
      </div>
    </>
  );
}
