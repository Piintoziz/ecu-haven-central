import { Link } from "@tanstack/react-router";
import { COMPANY, COMPLAINTS_BOOK_URL, LEGAL, RAL_ENTITIES } from "@/lib/content";
import { CookieSettingsButton } from "./cookie-consent";
import { useT } from "@/lib/i18n";

const CATEGORIES = ["motor", "abs", "airbag", "transmissao", "conforto", "imobilizador"];

export function SiteFooter() {
  const f = useT().layout.footer;
  const hours = useT().layout.hours;
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <img
            src="/images/logo-centralinas-chip.png"
            alt="Centralinas.com"
            width={520}
            height={210}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="h-24 w-auto select-none"
          />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            {f.tagline}
          </p>
        </div>

        <nav aria-label={f.catalog}>
          <h2 className="mono-label mb-4">{f.catalog}</h2>
          <ul className="space-y-2.5 text-sm">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <Link
                  to="/catalogo"
                  search={{ categoria: c }}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {f.categories[c]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={f.support}>
          <h2 className="mono-label mb-4">{f.support}</h2>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/encomenda" className="text-muted-foreground hover:text-foreground">
                {f.track}
              </Link>
            </li>
            <li>
              <Link to="/servicos" className="text-muted-foreground hover:text-foreground">
                {f.repair}
              </Link>
            </li>
            <li>
              <Link to="/centralinas" className="text-muted-foreground hover:text-foreground">
                {f.refIndex}
              </Link>
            </li>
            <li>
              <Link to="/contactos" className="text-muted-foreground hover:text-foreground">
                {f.askRef}
              </Link>
            </li>
            <li>
              <Link to="/faq" className="text-muted-foreground hover:text-foreground">
                {f.faq}
              </Link>
            </li>
            <li>
              <Link to="/empresa" className="text-muted-foreground hover:text-foreground">
                {f.about}
              </Link>
            </li>
          </ul>
        </nav>

        <address className="not-italic text-sm">
          <h2 className="mono-label mb-4">{f.contact}</h2>
          <ul className="space-y-2.5 text-muted-foreground">
            <li>
              <a href={COMPANY.phoneHref} className="hover:text-foreground">
                {COMPANY.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${COMPANY.email}`} className="hover:text-foreground">
                {COMPANY.email}
              </a>
            </li>
            <li>{COMPANY.address}</li>
            <li>{hours}</li>
          </ul>
        </address>
      </div>

      {/* ---------- Informação legal obrigatória ---------- */}
      <div className="border-t border-border">
        <div className="container-page space-y-5 py-6 text-xs text-muted-foreground">
          <nav aria-label="Legal">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 font-semibold">
              <li>
                <Link to="/termos" className="hover:text-foreground">
                  {f.terms}
                </Link>
              </li>
              <li>
                <Link to="/privacidade" className="hover:text-foreground">
                  {f.privacy}
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-foreground">
                  {f.cookies}
                </Link>
              </li>
              <li>
                <CookieSettingsButton className="font-semibold hover:text-foreground" />
              </li>
              <li>
                <Link to="/faq" className="hover:text-foreground">
                  FAQ
                </Link>
              </li>
              <li>
                <a
                  href={COMPLAINTS_BOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded border border-border px-2 py-1 text-foreground hover:border-primary/60"
                >
                  <span className="grid size-4 place-items-center rounded-sm bg-[#d71920] text-[9px] font-black text-white">
                    LR
                  </span>
                  {f.complaints}
                </a>
              </li>
            </ul>
          </nav>

          <div className="grid gap-4 leading-relaxed md:grid-cols-2">
            <p>
              {f.legalLine(LEGAL.legalName, LEGAL.nipc, LEGAL.registeredOffice, LEGAL.registry, LEGAL.shareCapital)}
            </p>
            <p>
              {f.ral}{" "}
              {RAL_ENTITIES.map((e, i) => (
                <span key={e.url}>
                  {i > 0 && f.or}
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-2 hover:text-foreground hover:underline"
                  >
                    {e.name.split(" — ")[0]}
                  </a>
                </span>
              ))}
              {f.moreInfo}{" "}
              <a
                href="https://www.consumidor.gov.pt"
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-2 hover:text-foreground hover:underline"
              >
                consumidor.gov.pt
              </a>
              .
            </p>
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-5 md:flex-row md:items-center md:justify-between">
            <p>
              {f.copyright(new Date().getFullYear())}
            </p>
            <p>{f.secure}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
