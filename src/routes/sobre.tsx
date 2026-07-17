import { createFileRoute } from "@tanstack/react-router";
import {
  Cpu,
  Layers,
  ShieldCheck,
  Users,
  Zap,
  Radio,
  UploadCloud,
  KeyRound,
} from "lucide-react";
import { motion } from "framer-motion";
import { Stagger, StaggerItem } from "@/components/site/reveal";
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

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE, delay },
  }),
};

const slideFrom = (dir: "left" | "right") => ({
  hidden: { opacity: 0, x: dir === "left" ? -60 : 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: EASE },
  },
});

const processSteps = [
  {
    icon: Zap,
    code: "01",
    title: "Teste elétrico",
    desc: "Verificação de tensões, resistências e integridade de pistas.",
  },
  {
    icon: Radio,
    code: "02",
    title: "Simulação de sinais",
    desc: "Bancada com simuladores de motor, ABS e sensores reais.",
  },
  {
    icon: UploadCloud,
    code: "03",
    title: "Atualização de firmware",
    desc: "Última revisão OEM aplicada quando aplicável.",
  },
  {
    icon: KeyRound,
    code: "04",
    title: "Virginização",
    desc: "Reset ao estado de fábrica para emparelhamento no veículo.",
  },
];

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
          <motion.div
            className="max-w-3xl"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12 } },
            }}
          >
            <motion.div
              variants={fadeUp}
              className="mono-label text-primary mb-3"
            >
              Sobre
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-6"
            >
              20 anos a fornecer centralinas às oficinas da Europa.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg text-muted-foreground"
            >
              Começámos numa oficina em 2004. Hoje somos referência europeia em
              venda, reparação e reprogramação de eletrónica automóvel, com um
              armazém de 250.000+ referências e um laboratório técnico dedicado.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <div className="container-page py-12 md:py-16">
        {/* STATS */}
        <Stagger className="grid md:grid-cols-4 gap-6 mb-20">
          {[
            { icon: Layers, value: 250000, suffix: "+", label: "Referências" },
            { icon: Cpu, value: 60, suffix: "+", label: "Marcas suportadas" },
            {
              icon: Users,
              value: 3500,
              suffix: "+",
              label: "Oficinas parceiras",
            },
            {
              icon: ShieldCheck,
              value: 20,
              suffix: " anos",
              label: "Know-how técnico",
            },
          ].map((s) => (
            <StaggerItem key={s.label}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="group surface-card p-6 h-full transition-colors duration-300 hover:border-primary/40 hover:shadow-[0_0_0_1px_oklch(0.71_0.19_45/0.25),0_20px_60px_-20px_oklch(0.71_0.19_45/0.35)]"
              >
                <s.icon className="size-6 text-primary mb-4 transition-transform duration-300 group-hover:scale-110" />
                <div className="text-3xl font-extrabold text-foreground font-mono">
                  <CountUp end={s.value} suffix={s.suffix} />
                </div>
                <div className="mono-label mt-1">{s.label}</div>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* MISSION */}
        <div className="grid md:grid-cols-2 gap-12 mb-20 items-center">
          <motion.div
            variants={slideFrom("left")}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <div className="mono-label text-primary mb-3">Missão</div>
            <h2 className="text-2xl font-extrabold text-foreground mb-4">
              Encurtar o tempo entre diagnóstico e reparação.
            </h2>
            <p className="text-muted-foreground">
              O tempo do mecânico é o recurso mais caro da oficina. Existimos
              para que a peça certa esteja disponível na primeira pesquisa —
              com garantia, testada e enviada em 24 horas.
            </p>
          </motion.div>
          <motion.div
            variants={slideFrom("right")}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
          >
            <img
              src={images.warehouse}
              alt="Armazém de centralinas"
              loading="lazy"
              className="h-full w-full object-cover img-treated transition-transform duration-[900ms] ease-out group-hover:scale-110"
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />
          </motion.div>
        </div>

        {/* HOW WE WORK */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <motion.div
            variants={slideFrom("left")}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] md:order-1 order-2"
          >
            <img
              src={images.team}
              alt="Equipa técnica"
              loading="lazy"
              className="h-full w-full object-cover img-treated transition-transform duration-[900ms] ease-out group-hover:scale-110"
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />
          </motion.div>
          <motion.div
            variants={slideFrom("right")}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="md:order-2 order-1"
          >
            <div className="mono-label text-primary mb-3">Como trabalhamos</div>
            <h2 className="text-2xl font-extrabold text-foreground mb-4">
              Cada centralina passa por bancada de teste.
            </h2>
            <p className="text-muted-foreground">
              Recondicionamos hardware em laboratório próprio: teste elétrico,
              simulação de sinais, atualização de firmware e virginização
              quando aplicável. Só depois entra em stock.
            </p>
          </motion.div>
        </div>

        {/* PROCESS STEPS */}
        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {processSteps.map((step) => (
            <StaggerItem key={step.code}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="group relative surface-card p-5 h-full overflow-hidden transition-colors duration-300 hover:border-primary/50"
              >
                <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:to-transparent transition-opacity duration-500" />
                <div className="relative flex items-start justify-between mb-4">
                  <div className="grid size-10 place-items-center rounded-lg bg-background/60 border border-border group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors">
                    <step.icon className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="mono-label text-primary/70 group-hover:text-primary transition-colors">
                    {step.code}
                  </span>
                </div>
                <h4 className="relative font-bold text-foreground mb-1">
                  {step.title}
                </h4>
                <p className="relative text-xs text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </>
  );
}
