import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { BrandMarquee } from "@/components/site/brand-marquee";
import { ProductCard } from "@/components/site/product-card";
import { CountUp } from "@/components/site/count-up";
import { Reveal, Stagger, StaggerItem } from "@/components/site/reveal";
import { SearchBar } from "@/components/site/search-bar";
import { getFacets, searchCatalog } from "@/lib/catalog";
import { COMPANY, servicesFor } from "@/lib/content";
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

const ECU_PHOTO = "/images/centralina-bosch-edc16.jpg";

function HomePage() {
  const { facets, latest } = Route.useLoaderData();
  const { t, locale } = useI18n();
  const h = t.pages.home;

  return (
    <>
      {/* ---------- Pesquisa por referência ---------- */}
      <section className="hero-home border-b border-border">
        <div className="container-page grid gap-10 py-12 *:min-w-0 md:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
          <div>
            <p className="hero-rise text-sm text-muted-foreground" style={{ "--i": 0 } as CSSProperties}>
              {h.eyebrow}
            </p>
            <h1 className="hero-lines mt-3 max-w-xl text-4xl font-extrabold leading-[1.08] tracking-tight md:text-5xl">
              {h.h1.split("|").map((line, i) => (
                <span key={line} className="hero-line">
                  <span style={{ "--i": i } as CSSProperties}>{line}</span>
                </span>
              ))}
            </h1>
            <p className="hero-rise mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg" style={{ "--i": 2 } as CSSProperties}>
              {h.lead}
            </p>
            <div className="hero-rise" style={{ "--i": 3 } as CSSProperties}>
              <SearchBar size="lg" className="mt-7 max-w-2xl" />
              <p className="mt-4 text-sm text-muted-foreground">
                {h.noRef}{" "}
                <Link to="/contactos" className="link-sweep font-semibold text-foreground">
                  {h.noRefCta}
                </Link>{" "}
                {h.orCall}{" "}
                <a href={COMPANY.phoneHref} className="link-sweep whitespace-nowrap font-semibold text-foreground">
                  {COMPANY.phone.replace("+351 ", "")}
                </a>
                .
              </p>
            </div>
            <dl className="hero-rise mt-9 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-6 sm:grid-cols-4" style={{ "--i": 4 } as CSSProperties}>
              <Fact k={<CountUp end={facets.total} duration={1200} />} v={h.factOnline} />
              <Fact k={<CountUp end={10000} prefix="+" duration={1400} />} v={h.factStock} />
              <Fact k="24 h" v={h.factShip} />
              <Fact k={`12 ${h.months}`} v={h.factWarranty} />
            </dl>
          </div>

          {/* Momento principal: as marcas "leem" a etiqueta, uma de cada vez, e a legenda acende em sincronia */}
          <figure className="hero-figure mx-auto w-full max-w-md rounded-xl border border-border bg-surface p-4 lg:mr-0">
            <p className="mb-3 text-sm font-bold">{h.labelTitle}</p>
            <div className="hero-photo relative overflow-hidden rounded-lg bg-[#e9e9e7]">
              <img
                src={ECU_PHOTO}
                alt={h.labelAlt}
                width={1050}
                height={1080}
                fetchPriority="high"
                decoding="async"
                className="block h-auto w-full"
              />
              <LabelMark n={0} letter="A" className="left-[38.9%] top-[58.6%] h-[3.2%] w-[15%]" />
              <LabelMark n={1} letter="B" className="left-[38.9%] top-[68.6%] h-[3.2%] w-[11.8%]" />
              <LabelMark n={2} letter="C" className="left-[57.6%] top-[57.1%] h-[2.6%] w-[11%]" />
            </div>
            <figcaption>
              <dl className="mt-4 grid gap-2.5 text-sm">
                {(
                  [
                    ["A", h.labelA, h.labelAText],
                    ["B", h.labelB, h.labelBText],
                    ["C", h.labelC, h.labelCText],
                  ] as const
                ).map(([l, title, text], i) => (
                  <div key={l} className="label-key flex gap-2.5" style={{ "--i": i } as CSSProperties}>
                    <span className="grid size-5 shrink-0 place-items-center rounded bg-primary text-[11px] font-bold text-primary-foreground">
                      {l}
                    </span>
                    <div>
                      <dt className="font-semibold leading-tight">{title}</dt>
                      <dd className="mt-0.5 text-muted-foreground">{text}</dd>
                    </div>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">{h.labelNote}</p>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ---------- Como comprar ---------- */}
      <section className="border-b border-border bg-surface/40">
        <Stagger className="container-page grid gap-6 py-8 sm:grid-cols-3" stagger={0.09}>
          {h.steps.map((s, i) => (
            <StaggerItem key={s.t} className="flex gap-3">
              <span className="font-mono text-sm font-bold text-primary">{i + 1}.</span>
              <div>
                <p className="font-bold">{s.t}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{s.d}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
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

/** Moldura sobre um número da etiqueta, desenhada em sequência (ver .label-mark em styles.css). */
function LabelMark({ n, letter, className }: { n: number; letter: string; className?: string }) {
  return (
    <span aria-hidden className={`label-mark absolute ${className ?? ""}`} style={{ "--i": n } as CSSProperties}>
      <span className="label-mark-tag">{letter}</span>
    </span>
  );
}

function Fact({ k, v }: { k: ReactNode; v: string }) {
  return (
    <div>
      <dt className="text-xl font-extrabold tabular-nums md:text-2xl">{k}</dt>
      <dd className="mt-0.5 text-xs leading-snug text-muted-foreground md:text-sm">{v}</dd>
    </div>
  );
}
