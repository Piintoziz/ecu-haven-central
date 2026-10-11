import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { BrandMarquee } from "@/components/site/brand-marquee";
import { ProductCard } from "@/components/site/product-card";
import { Reveal } from "@/components/site/reveal";
import { SearchBar } from "@/components/site/search-bar";
import { getFacets, searchCatalog } from "@/lib/catalog";
import { servicesFor } from "@/lib/content";
import { headI18n, useI18n } from "@/lib/i18n";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [facets, latest] = await Promise.all([getFacets(), searchCatalog({ ordem: "newest" }, 8)]);
    return { facets, latest };
  },
  head: ({ match }) => {
    const { locale, t } = headI18n(match);
    return pageHead({ title: t.pages.home.metaTitle, description: t.pages.home.metaDescription, path: "/", locale });
  },
  component: HomePage,
});

const EASE = [0.22, 1, 0.36, 1] as const;

function HomePage() {
  const { facets, latest } = Route.useLoaderData();
  const { t, locale } = useI18n();
  const h = t.pages.home;

  return (
    <>
      {/* ---------- Pesquisa por referência ---------- */}
      <section className="relative isolate overflow-hidden border-b border-border">
        {/* Fundo: Veyron preto/laranja "camuflado" no preto (foto fornecida pelo cliente) */}
        <div className="absolute inset-0 -z-20" aria-hidden>
          <img
            src="/images/hero-veyron.webp"
            alt=""
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover object-[50%_58%] opacity-40 saturate-[0.9]"
          />
          {/* escurece mais do lado do texto e funde com a secção seguinte */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
        </div>
        <div className="absolute inset-0 -z-10 grid-noise opacity-60" aria-hidden />
        <div className="container-page grid items-center gap-12 py-14 *:min-w-0 md:py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <p className="mb-5 inline-flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success" aria-hidden />
              {h.activeRefs(facets.total.toLocaleString(t.common.intl))}
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl lg:text-[3.4rem]">
              {h.h1a}
              <br />
              <span className="text-primary">{h.h1b}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              {h.lead}
            </p>
            <SearchBar size="lg" className="mt-8 max-w-2xl" />
            <ul className="mt-8 grid gap-2 text-sm text-foreground/85 sm:grid-cols-3">
              {h.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-primary" aria-hidden />
                  {perk}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.figure
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="relative rounded-xl border border-border bg-surface/80 p-6 backdrop-blur"
          >
            <div className="relative overflow-hidden rounded-lg border border-border bg-background">
              {/* Centralina real (Bosch Motronic usada) — foto CC BY-SA 3.0, ver crédito abaixo */}
              <img
                src="/images/ecu-motronic.webp"
                alt={h.photoAlt}
                width={1280}
                height={960}
                loading="eager"
                className="block aspect-[4/3] w-full object-cover brightness-[0.82] contrast-[1.08] saturate-[0.8]"
              />
              {/* vinheta: funde a mesa de madeira com o cartão escuro */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgb(0_0_0/0.55)_100%)]"
              />
              {/* anotações: onde encontrar a referência */}
              <Callout className="left-[51%] top-[44%]" n={1} />
              <Callout className="left-[30%] top-[13%]" n={2} />
              <Callout className="left-[17%] top-[80%]" n={3} />
            </div>
            <figcaption className="mt-5 border-t border-border pt-4">
              <p className="mono-label mb-3 text-primary">{h.whereRef}</p>
              <ol className="space-y-1.5 text-sm text-muted-foreground">
                <li>
                  <b className="font-mono text-foreground">1</b> · {h.where1}
                </li>
                <li>
                  <b className="font-mono text-foreground">2</b> · {h.where2}
                </li>
                <li>
                  <b className="font-mono text-foreground">3</b> · {h.where3}
                </li>
              </ol>
              <p className="mt-3 text-[10px] text-muted-foreground/60">
                {h.photo}{" "}
                <a
                  href="https://commons.wikimedia.org/wiki/File:Motronic-Steuerger%C3%A4t.JPG"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 hover:underline"
                >
                  Mib18, Wikimedia Commons
                </a>{" "}
                · CC BY-SA 3.0
              </p>
            </figcaption>
          </motion.figure>
        </div>
      </section>

      {/* ---------- Sistemas ---------- */}
      <section className="container-page py-16">
        <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold md:text-3xl">{h.bySystem}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{h.bySystemSub}</p>
          </div>
          <Link to="/catalogo" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:gap-2.5 transition-all">
            {h.fullCatalog} <ArrowRight className="size-4" />
          </Link>
        </Reveal>
        <Reveal>
          <ul className="grid overflow-hidden rounded-xl border border-border sm:grid-cols-2 lg:grid-cols-3">
            {facets.categories.map((c) => (
              <li key={c.slug} className="border-b border-border sm:[&:nth-child(odd)]:border-r lg:[&:nth-child(odd)]:border-r-0 lg:[&:not(:nth-child(3n))]:border-r">
                <Link
                  to="/catalogo"
                  search={{ categoria: c.slug }}
                  className="group flex h-full items-start gap-4 p-5 transition-colors hover:bg-surface"
                >
                  <span className="grid h-10 w-12 shrink-0 place-items-center rounded-md border border-border bg-background font-mono text-xs font-bold text-primary">
                    {c.short_code}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-bold">{t.common.category(c.slug, c.name)}</span>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">{c.count}</span>
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{t.common.categoryDescription(c.slug, c.description)}</span>
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* ---------- Entradas recentes ---------- */}
      <section className="border-y border-border bg-surface/30">
        <div className="container-page py-16">
          <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold md:text-3xl">{h.recent}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {h.recentSub}
              </p>
            </div>
            <Link to="/catalogo" search={{ ordem: "newest" }} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:gap-2.5 transition-all">
              {h.seeAll} <ArrowRight className="size-4" />
            </Link>
          </Reveal>
          {latest.items.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {latest.items.map((p, i) => (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.35, delay: (i % 4) * 0.06 }}
                  className="flex"
                >
                  <ProductCard product={p} className="w-full" />
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
              {h.loadingCatalog}
            </p>
          )}
        </div>
      </section>

      {/* ---------- Marcas com que trabalhamos ---------- */}
      <section className="py-16">
        <div className="container-page mb-8 flex flex-wrap items-end justify-between gap-4">
          <Reveal>
            <p className="mono-label text-primary">{h.coverage}</p>
            <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">{h.brands}</h2>
          </Reveal>
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            {h.seeCatalog} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <BrandMarquee />
      </section>

      {/* ---------- Não encontra? ---------- */}
      <section className="container-page">
        <Reveal className="grid gap-10 rounded-xl border border-border bg-surface p-8 md:p-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-2xl font-extrabold md:text-3xl">{h.notFound}</h2>
            <p className="mt-3 text-muted-foreground">
              {h.notFoundText}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/contactos"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
              >
                {h.askAvailability} <ArrowRight className="size-4" />
              </Link>
              <Link to="/servicos" className="inline-flex items-center rounded-md border border-border px-5 py-2.5 text-sm font-bold hover:bg-accent">
                {h.repairMine}
              </Link>
            </div>
          </div>
          <dl className="divide-y divide-border">
            {servicesFor(locale).slice(0, 4).map((s) => (
              <div key={s.id} className="grid grid-cols-[3rem_1fr_auto] items-baseline gap-4 py-3">
                <dt className="font-mono text-xs font-bold text-primary">{s.code}</dt>
                <dd className="text-sm">
                  <span className="font-semibold">{s.title}</span>
                </dd>
                <dd className="text-xs text-muted-foreground">{s.turnaround}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>
    </>
  );
}

function Callout({ n, className }: { n: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`absolute grid size-6 place-items-center rounded-full bg-primary font-mono text-[11px] font-bold text-primary-foreground shadow-[0_0_0_4px_var(--color-surface)] ${className ?? ""}`}
    >
      {n}
    </span>
  );
}
