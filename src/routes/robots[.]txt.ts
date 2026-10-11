import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/env";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(
          [
            "User-agent: *",
            "Allow: /",
            "Disallow: /carrinho",
            "Disallow: /checkout",
            "Disallow: /encomenda",
            "Disallow: /conta",
            "Disallow: /admin",
            "Disallow: /api/",
            "Disallow: /entrar",
            "Disallow: /registar",
            "Disallow: /recuperar-password",
            "",
            `Sitemap: ${SITE_URL}/sitemap.xml`,
            "",
          ].join("\n"),
          { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" } },
        ),
    },
  },
});
