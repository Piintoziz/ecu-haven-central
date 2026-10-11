import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LEGAL } from "@/lib/content";
import { useT } from "@/lib/i18n";

export type LegalSection = { id: string; title: string; body: ReactNode };

/** Layout das páginas legais: título, data de revisão, índice e texto. */
export function LegalPage({
  label,
  title,
  intro,
  sections,
}: {
  label: string;
  title: string;
  intro?: ReactNode;
  sections: LegalSection[];
}) {
  const t = useT();
  const l = t.info.legal;
  const updated = t.common.dateLong(LEGAL.lastUpdated);
  return (
    <div className="container-page py-12 md:py-16">
      <header className="max-w-3xl">
        <p className="mono-label text-primary">{label}</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">{l.updated(updated)}</p>
        {intro && <div className="mt-6 text-muted-foreground">{intro}</div>}
      </header>

      <div className="mt-10 grid gap-10 *:min-w-0 lg:grid-cols-[220px_1fr]">
        <nav aria-label={l.toc} className="hidden lg:block">
          <ol className="sticky top-28 space-y-1 border-l border-border text-sm">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="-ml-px block border-l border-transparent py-1 pl-4 text-muted-foreground hover:border-primary hover:text-foreground"
                >
                  <span className="mr-1.5 font-mono text-xs">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="legal-prose max-w-3xl">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-28">
              <h2>
                <span className="mr-2 font-mono text-sm text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.title}
              </h2>
              {s.body}
            </section>
          ))}
          <p className="mt-12 border-t border-border pt-6 text-sm">
            {l.questions} <Link to="/contactos">{l.talk}</Link> {l.orSee}{" "}
            <Link to="/faq">{l.faq}</Link>.
          </p>
        </article>
      </div>
    </div>
  );
}

/** Bloco de identificação do prestador (reutilizado nas páginas legais). */
export function CompanyIdentification() {
  const l = useT().info.legal;
  return (
    <dl className="legal-dl">
      <dt>{l.name}</dt>
      <dd>{LEGAL.legalName}</dd>
      <dt>{l.nipc}</dt>
      <dd>{LEGAL.nipc}</dd>
      <dt>{l.office}</dt>
      <dd>{LEGAL.registeredOffice}</dd>
      <dt>{l.registry}</dt>
      <dd>
        {LEGAL.registry} · {l.capital} {LEGAL.shareCapital}
      </dd>
    </dl>
  );
}
