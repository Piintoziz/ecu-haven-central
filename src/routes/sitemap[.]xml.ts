import { createFileRoute } from "@tanstack/react-router";
import { getFacets } from "@/lib/catalog";
import { SITE_URL } from "@/lib/env";
import { getPublicClient } from "@/lib/supabase";

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlTag(path: string, lastmod?: string, priority?: string): string {
  return [
    "<url>",
    `<loc>${xmlEscape(`${SITE_URL}${path}`)}</loc>`,
    lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : "",
    priority ? `<priority>${priority}</priority>` : "",
    "</url>",
  ].join("");
}

// Sitemap dinâmico: páginas institucionais, landing pages de filtro e todas as referências ativas.
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [{ data: products }, facets] = await Promise.all([
          getPublicClient().rpc("sitemap_products"),
          getFacets(),
        ]);

        const urls: string[] = [
          urlTag("/", undefined, "1.0"),
          urlTag("/catalogo", undefined, "0.9"),
          urlTag("/servicos", undefined, "0.6"),
          urlTag("/contactos", undefined, "0.5"),
          urlTag("/sobre", undefined, "0.4"),
          urlTag("/faq", undefined, "0.5"),
          urlTag("/termos", undefined, "0.2"),
          urlTag("/privacidade", undefined, "0.2"),
          urlTag("/cookies", undefined, "0.1"),
          ...facets.categories.filter((c) => c.count > 0).map((c) => urlTag(`/catalogo?categoria=${c.slug}`, undefined, "0.8")),
          ...facets.manufacturers.map((m) => urlTag(`/catalogo?fabricante=${m.slug}`, undefined, "0.7")),
          ...facets.brands.map((b) => urlTag(`/catalogo?marca=${b.slug}`, undefined, "0.7")),
          ...((products ?? []) as { slug: string; updated_at: string }[]).map((p) =>
            urlTag(`/centralinas/${p.slug}`, p.updated_at, "0.8"),
          ),
        ];

        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`;
        return new Response(body, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
