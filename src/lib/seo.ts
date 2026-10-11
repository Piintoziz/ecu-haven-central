import { SITE_NAME, SITE_URL } from "./env";
import type { Locale } from "./i18n/locale";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Serializa JSON-LD de forma segura para <script> (evita fecho prematuro da tag). */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function jsonLdScript(data: unknown) {
  return { type: "application/ld+json", children: jsonLd(data) };
}

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "product";
  image?: string | null;
  noindex?: boolean;
  locale?: Locale;
};

/** /catalogo?q=x -> /catalogo?q=x&lang=en */
export function withLang(url: string, locale: Locale): string {
  if (locale === "pt") return url;
  return `${url}${url.includes("?") ? "&" : "?"}lang=${locale}`;
}

/** Meta tags + canonical consistentes para cada página. */
export function pageHead({
  title,
  description,
  path,
  type = "website",
  image,
  noindex,
  locale = "pt",
}: PageMetaInput) {
  const base = absoluteUrl(path);
  const url = withLang(base, locale);
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const meta: Array<Record<string, string>> = [
    { title: fullTitle },
    { name: "description", content: description },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: locale === "en" ? "en_GB" : "pt_PT" },
    { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
  ];
  if (image) meta.push({ property: "og:image", content: image });
  if (noindex) meta.push({ name: "robots", content: "noindex, follow" });
  // Versão PT no URL limpo, EN com ?lang=en; o Google indexa ambas e liga-as.
  const links: Array<Record<string, string>> = [{ rel: "canonical", href: url }];
  if (!noindex) {
    links.push(
      { rel: "alternate", hrefLang: "pt", href: base },
      { rel: "alternate", hrefLang: "en", href: withLang(base, "en") },
      { rel: "alternate", hrefLang: "x-default", href: base },
    );
  }
  return { meta, links };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}
