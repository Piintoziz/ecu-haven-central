import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useRouterState,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { MotionConfig } from "framer-motion";
import { useEffect, useMemo, type ReactNode } from "react";
import { usePreloadEcuModel } from "@/components/site/ecu-scan-loader";

import appCss from "../styles.css?url";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { CookieBanner, CookieSettingsDialog } from "@/components/site/cookie-consent";
import { AuthProvider } from "@/lib/auth";
import { ConsentProvider } from "@/lib/consent";
import { CartProvider } from "@/lib/cart";
import { COMPANY } from "@/lib/content";
import { SITE_NAME, SITE_URL } from "@/lib/env";
import { jsonLdScript } from "@/lib/seo";
import { I18nProvider, getDict, useI18n } from "@/lib/i18n";
import { resolveLocale, type Locale } from "@/lib/i18n/locale";

function NotFoundComponent() {
  const { t } = useI18n();
  const e = t.layout.errors;
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mono-label text-primary mb-4">{e.notFoundLabel}</div>
        <h1 className="text-4xl font-extrabold text-foreground">{e.notFound}</h1>
        <p className="mt-4 text-sm text-muted-foreground">{e.notFoundText}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {e.home}
          </Link>
          <Link
            to="/catalogo"
            className="ml-2 inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-bold text-foreground hover:bg-accent"
          >
            {e.catalog}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error: raw, reset }: ErrorComponentProps) {
  const error = useMemo(() => (raw instanceof Error ? raw : new Error(String(raw))), [raw]);
  console.error(error);
  const router = useRouter();
  const { t } = useI18n();
  const e = t.layout.errors;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{e.failed}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{e.failedText}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {e.retry}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            {e.goHome}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // Idioma do pedido (cookie / ?lang= / Accept-Language) — disponível em context.locale
  beforeLoad: async ({ location }) => {
    const lang = (location.search as Record<string, unknown>).lang;
    const locale: Locale = await resolveLocale(typeof lang === "string" ? lang : undefined);
    return { locale };
  },
  head: ({ match }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#1c1c1c" },
      { title: getDict(match.context.locale).layout.meta.title },
      { name: "description", content: getDict(match.context.locale).layout.meta.description },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: match.context.locale === "en" ? "en_GB" : "pt_PT" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // Mini centralina laranja (cor da marca): ICO (16/32/48, desenhado ao pixel para ficar nítido no separador)
      { rel: "icon", href: "/favicon.ico?v=3", sizes: "48x48" },
      { rel: "icon", href: "/favicon-32.png?v=3", type: "image/png", sizes: "32x32" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png?v=3", sizes: "180x180" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap",
      },
    ],
    scripts: [
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "AutoPartsStore",
        name: SITE_NAME,
        url: SITE_URL,
        email: COMPANY.email,
        telephone: COMPANY.phone,
        address: {
          "@type": "PostalAddress",
          streetAddress: COMPANY.street,
          postalCode: COMPANY.postalCode,
          addressLocality: COMPANY.locality,
          addressRegion: COMPANY.region,
          addressCountry: "PT",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/catalogo?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      }),
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const locale = useRouterState({
    select: (s) => (s.matches[0]?.context as { locale?: Locale } | undefined)?.locale ?? "pt",
  });
  return (
    <html lang={locale}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient, locale } = Route.useRouteContext();
  // O backoffice tem a sua própria moldura (barra lateral), sem cabeçalho/rodapé da loja.
  // Decidido pelas rotas resolvidas (não pelo URL) e com a mesma árvore em ambos os
  // casos: o <Outlet> nunca muda de posição, logo as páginas não são remontadas a meio
  // de uma navegação.
  const isAdmin = useRouterState({
    select: (s) => s.matches.some((m) => m.routeId === "/admin"),
  });
  usePreloadEcuModel();

  return (
    <QueryClientProvider client={queryClient}>
      {/* reducedMotion="user": respeita prefers-reduced-motion em todas as animações */}
      <MotionConfig reducedMotion="user">
        <I18nProvider locale={locale}>
          <ConsentProvider>
            <AuthProvider>
              <CartProvider>
                <div className="flex min-h-screen flex-col bg-background">
                  {!isAdmin && (
                    <>
                      <a
                        href="#conteudo"
                        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground"
                      >
                        <SkipLabel />
                      </a>
                      <SiteHeader />
                    </>
                  )}
                  <main id="conteudo" className="flex-1">
                    <Outlet />
                  </main>
                  {!isAdmin && <SiteFooter />}
                  {!isAdmin && <CookieBanner />}
                  <CookieSettingsDialog />
                </div>
              </CartProvider>
            </AuthProvider>
          </ConsentProvider>
        </I18nProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}

function SkipLabel() {
  return <>{useI18n().t.layout.skip}</>;
}
