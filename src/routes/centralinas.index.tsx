import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { getLegacyReferenceIndex } from "@/lib/catalog";
import { headI18n, useI18n } from "@/lib/i18n";
import { pageHead } from "@/lib/seo";

// Índice de referências: mesmo endereço e conteúdo da página do site antigo
// (centralinas.com/centralinas/), para manter as pesquisas por referência no Google.
// Referências com peça publicada ligam à ficha; as restantes ao pedido de referência.

const TEXT = {
  pt: {
    metaTitle: "Centralinas — índice de referências em stock",
    metaDescription:
      "Índice com mais de 13 000 referências de centralinas de motor, ABS, airbag e TCU (Bosch, Siemens, Delphi, Magneti Marelli, Denso…). Encontre a sua pela referência da etiqueta.",
    label: "Índice de referências",
    title: "Centralinas",
    lead: (n: number, online: number) =>
      `${n.toLocaleString("pt-PT")} referências do nosso stock. ${online.toLocaleString("pt-PT")} já estão na loja online com preço e fotografia; para as restantes, peça disponibilidade e respondemos no próprio dia útil.`,
    filter: "Filtrar referência…",
    legendOnline: "Na loja online",
    legendAsk: "Pedir disponibilidade",
    none: "Nenhuma referência começa por esse texto.",
    notFound: "Não encontra a sua? Envie-nos a referência da etiqueta.",
    ask: "Pedir referência",
    catalog: "Ver catálogo",
  },
  en: {
    metaTitle: "ECUs — index of references in stock",
    metaDescription:
      "Index of more than 13,000 engine, ABS, airbag and TCU ECU references (Bosch, Siemens, Delphi, Magneti Marelli, Denso…). Find yours by the reference on the label.",
    label: "Reference index",
    title: "ECUs",
    lead: (n: number, online: number) =>
      `${n.toLocaleString("en-GB")} references from our stock. ${online.toLocaleString("en-GB")} are already in the online shop with price and photo; for the rest, ask for availability and we'll reply the same working day.`,
    filter: "Filter reference…",
    legendOnline: "In the online shop",
    legendAsk: "Ask for availability",
    none: "No reference starts with that text.",
    notFound: "Can't find yours? Send us the reference on the label.",
    ask: "Ask for a reference",
    catalog: "View catalogue",
  },
};

export const Route = createFileRoute("/centralinas/")({
  // Dados compactos ([ref, slug]) para a página não ficar pesada (13 mil linhas).
  loader: async () => ({
    refs: (await getLegacyReferenceIndex()).map((r): [string, string | null] => [r.ref, r.slug]),
  }),
  // A lista muda pouco: evita repetir o pedido em cada navegação
  staleTime: 10 * 60_000,
  head: ({ match }) => {
    const { locale } = headI18n(match);
    return pageHead({ title: TEXT[locale].metaTitle, description: TEXT[locale].metaDescription, path: "/centralinas", locale });
  },
  component: ReferenceIndexPage,
});

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Agrupa pelos 4 primeiros caracteres normalizados (ex.: 0281, 0261, 5WS4). */
type Ref = [string, string | null];

function groupRefs(refs: Ref[]) {
  const groups = new Map<string, Ref[]>();
  for (const r of refs) {
    const k = norm(r[0]).slice(0, 4) || "#";
    const g = groups.get(k);
    if (g) g.push(r);
    else groups.set(k, [r]);
  }
  return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
}

function ReferenceIndexPage() {
  const { refs } = Route.useLoaderData();
  const { locale } = useI18n();
  const x = TEXT[locale];
  const [q, setQ] = useState("");
  const online = useMemo(() => refs.filter((r) => r[1]).length, [refs]);
  const nq = norm(q);
  const visible = useMemo(() => (nq ? refs.filter((r) => norm(r[0]).startsWith(nq)) : refs), [refs, nq]);
  const groups = useMemo(() => groupRefs(visible), [visible]);

  return (
    <div className="container-page py-10 md:py-14">
      <header className="max-w-3xl">
        <p className="mono-label text-primary">{x.label}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">{x.title}</h1>
        <p className="mt-3 text-muted-foreground">{x.lead(refs.length, online)}</p>
      </header>

      <div className="sticky top-16 z-20 -mx-2 mt-6 flex flex-wrap items-center gap-4 bg-background/90 px-2 py-3 backdrop-blur">
        <label className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value.slice(0, 30))}
            placeholder={x.filter}
            aria-label={x.filter}
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 font-mono text-sm focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2.5 rounded-sm bg-primary" aria-hidden /> {x.legendOnline}
        </span>
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2.5 rounded-sm border border-border" aria-hidden /> {x.legendAsk}
        </span>
      </div>

      {groups.length === 0 && <p className="mt-8 text-sm text-muted-foreground">{x.none}</p>}

      <div className="mt-4 space-y-8">
        {groups.map(([prefix, items]) => (
          <section key={prefix} aria-labelledby={`g-${prefix}`}>
            <h2 id={`g-${prefix}`} className="mono-label mb-2 border-b border-border pb-1">
              {prefix}… <span className="text-muted-foreground">({items.length})</span>
            </h2>
            {/* Links simples (sem classes por item): mantém o HTML leve. Estilos em .ref-index (styles.css). */}
            <ul className="ref-index">
              {items.map(([ref, slug]) => (
                <li key={ref}>
                  {slug ? (
                    <a href={`/centralinas/${slug}`} className="on">
                      {ref}
                    </a>
                  ) : (
                    <a href={`/contactos?ref=${encodeURIComponent(ref)}`} rel="nofollow">
                      {ref}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-6">
        <p className="font-semibold">{x.notFound}</p>
        <div className="flex gap-3">
          <Link to="/catalogo" className="rounded-md border border-border px-4 py-2 text-sm font-bold hover:bg-accent">
            {x.catalog}
          </Link>
          <Link to="/contactos" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
            {x.ask} <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
