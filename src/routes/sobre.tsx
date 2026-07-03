import { createFileRoute } from "@tanstack/react-router";
import { Cpu, Layers, ShieldCheck, Users } from "lucide-react";

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
    <div className="container-page py-12 md:py-16">
      <div className="max-w-3xl mb-16">
        <div className="mono-label text-primary mb-3">Sobre</div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight mb-6">
          20 anos a fornecer centralinas às oficinas da Europa.
        </h1>
        <p className="text-lg text-muted-foreground">
          Começámos numa oficina em 2004. Hoje somos referência europeia em
          venda, reparação e reprogramação de eletrónica automóvel, com um
          armazém de 250.000+ referências e um laboratório técnico dedicado.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-20">
        {[
          { icon: Layers, value: "250K+", label: "Referências" },
          { icon: Cpu, value: "60+", label: "Marcas suportadas" },
          { icon: Users, value: "3.500+", label: "Oficinas parceiras" },
          { icon: ShieldCheck, value: "20 anos", label: "Know-how técnico" },
        ].map((s) => (
          <div key={s.label} className="surface-card p-6">
            <s.icon className="size-6 text-primary mb-4" />
            <div className="text-3xl font-extrabold text-foreground font-mono">
              {s.value}
            </div>
            <div className="mono-label mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-12 mb-20">
        <div>
          <div className="mono-label text-primary mb-3">Missão</div>
          <h2 className="text-2xl font-extrabold text-foreground mb-4">
            Encurtar o tempo entre diagnóstico e reparação.
          </h2>
          <p className="text-muted-foreground">
            O tempo do mecânico é o recurso mais caro da oficina. Existimos para
            que a peça certa esteja disponível na primeira pesquisa — com
            garantia, testada e enviada em 24 horas.
          </p>
        </div>
        <div>
          <div className="mono-label text-primary mb-3">Como trabalhamos</div>
          <h2 className="text-2xl font-extrabold text-foreground mb-4">
            Cada centralina passa por bancada de teste.
          </h2>
          <p className="text-muted-foreground">
            Recondicionamos hardware em laboratório próprio: teste elétrico,
            simulação de sinais, atualização de firmware e virginização quando
            aplicável. Só depois entra em stock.
          </p>
        </div>
      </div>
    </div>
  );
}
