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
import { headI18n, useT } from "@/lib/i18n";
import { images } from "@/lib/images";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/sobre")({
  component: SobrePage,
  head: ({ match }) => {
    const { locale, t } = headI18n(match);
    return pageHead({ title: t.pages.about.metaTitle, description: t.pages.about.metaDescription, path: "/sobre", locale });
  },
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

const STEP_ICONS = [Zap, Radio, UploadCloud, KeyRound];

function SobrePage() {
  const a = useT().pages.about;
  const processSteps = a.steps.map((s, i) => ({ ...s, icon: STEP_ICONS[i]!, code: `0${i + 1}` }));
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
              {a.label}
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-6"
            >
              {a.h1}
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg text-muted-foreground"
            >
              {a.lead}
            </motion.p>
          </motion.div>
        </div>
      </section>

      <div className="container-page py-12 md:py-16">
        {/* STATS */}
        <Stagger className="grid md:grid-cols-4 gap-6 mb-20">
          {[
            { icon: Layers, value: 250000, suffix: "+", label: a.stats[0] },
            { icon: Cpu, value: 60, suffix: "+", label: a.stats[1] },
            {
              icon: Users,
              value: 3500,
              suffix: "+",
              label: a.stats[2],
            },
            {
              icon: ShieldCheck,
              value: 20,
              suffix: a.years,
              label: a.stats[3],
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
            <div className="mono-label text-primary mb-3">{a.mission}</div>
            <h2 className="text-2xl font-extrabold text-foreground mb-4">
              {a.missionTitle}
            </h2>
            <p className="text-muted-foreground">
              {a.missionText}
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
              alt={a.warehouseAlt}
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
              alt={a.teamAlt}
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
            <div className="mono-label text-primary mb-3">{a.how}</div>
            <h2 className="text-2xl font-extrabold text-foreground mb-4">
              {a.howTitle}
            </h2>
            <p className="text-muted-foreground">
              {a.howText}
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
