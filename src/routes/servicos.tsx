import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Check, Clock, Phone } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { ServiceIllustration } from "@/components/site/service-illustration";
import { COMPANY, servicesFor } from "@/lib/content";
import { headI18n, useI18n } from "@/lib/i18n";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/servicos")({
  head: ({ match }) => {
    const { locale, t } = headI18n(match);
    return pageHead({ title: t.pages.services.metaTitle, description: t.pages.services.metaDescription, path: "/servicos", locale });
  },
  component: ServicosPage,
});

function ServicosPage() {
  const { t, locale } = useI18n();
  const k = t.pages.services;
  return (
    <div className="container-page py-12 md:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <p className="mono-label text-primary">{k.label}</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">{k.title}</h1>
        <p className="mt-4 text-muted-foreground md:text-lg">
          {k.lead}
        </p>
      </header>

      <ul className="mt-12 grid gap-5 lg:grid-cols-2">
        {servicesFor(locale).map((s, i) => (
          <motion.li
            key={s.id}
            id={s.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: (i % 2) * 0.08 }}
            className="group scroll-mt-28 overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-primary/50"
          >
            <article className="grid h-full sm:grid-cols-[180px_1fr]">
              <div className="relative grid place-items-center border-b border-border bg-background/60 p-4 text-foreground/70 sm:p-6 transition-colors group-hover:text-foreground sm:border-b-0 sm:border-r">
                <div className="grid-noise absolute inset-0 opacity-40" aria-hidden />
                <ServiceIllustration id={s.id} className="relative max-w-[110px] sm:max-w-[150px]" />
                <span className="absolute left-3 top-3 font-mono text-[10px] font-bold text-primary">
                  {s.code}
                </span>
              </div>

              <div className="flex flex-col p-6">
                <h2 className="text-lg font-extrabold uppercase tracking-tight">{s.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {s.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2">
                      <Check className="size-3.5 shrink-0 text-primary" aria-hidden />
                      {h}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" aria-hidden /> {s.turnaround}
                  </span>
                  <Link
                    to="/contactos"
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    {k.quote} <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          </motion.li>
        ))}
      </ul>

      <Reveal className="mt-20">
        <h2 className="text-2xl font-extrabold">{k.how}</h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-4">
          {k.process.map((p, i) => (
            <li key={p.title} className="border-t-2 border-primary/60 pt-4">
              <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
              <h3 className="mt-1 font-bold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal className="mt-16 grid items-center gap-6 rounded-xl border border-border bg-surface p-8 md:grid-cols-[1fr_auto] md:p-10">
        <div>
          <h2 className="text-2xl font-extrabold">{k.ctaTitle}</h2>
          <p className="mt-2 max-w-lg text-muted-foreground">
            {k.ctaText}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={COMPANY.phoneHref}
            className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-bold hover:bg-accent"
          >
            <Phone className="size-4" aria-hidden /> {COMPANY.phone}
          </a>
          <Link
            to="/contactos"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            {k.quote} <ArrowRight className="size-4" />
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
