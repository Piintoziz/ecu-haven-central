import { createIsomorphicFn } from "@tanstack/react-start";

export type Locale = "pt" | "en";
export const LOCALES: Locale[] = ["pt", "en"];
export const DEFAULT_LOCALE: Locale = "pt";
export const LOCALE_COOKIE = "lang";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function isLocale(v: unknown): v is Locale {
  return v === "pt" || v === "en";
}

/** "pt-PT,pt;q=0.9,en;q=0.8" -> pt; qualquer outra língua principal -> en; vazio (robots) -> pt */
function fromAcceptLanguage(header: string | undefined): Locale {
  const first = (header ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  if (!first || first.startsWith("pt")) return "pt";
  return "en";
}

function readCookie(name: string): string | undefined {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]!) : undefined;
}

export function writeLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

/**
 * Idioma do pedido. Ordem: ?lang= (links partilhados / hreflang) > cookie >
 * Accept-Language (só na 1.ª visita). O servidor grava sempre o cookie para o
 * browser hidratar exatamente no mesmo idioma.
 */
export const resolveLocale = createIsomorphicFn()
  .server(async (queryLang?: string): Promise<Locale> => {
    const { getCookie, getRequestHeader, setCookie } = await import("@tanstack/react-start/server");
    const cookie = getCookie(LOCALE_COOKIE);
    const locale: Locale = isLocale(queryLang)
      ? queryLang
      : isLocale(cookie)
        ? cookie
        : fromAcceptLanguage(getRequestHeader("accept-language"));
    if (cookie !== locale) {
      setCookie(LOCALE_COOKIE, locale, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
    }
    return locale;
  })
  .client(async (queryLang?: string): Promise<Locale> => {
    if (isLocale(queryLang)) {
      writeLocaleCookie(queryLang);
      return queryLang;
    }
    const cookie = readCookie(LOCALE_COOKIE);
    return isLocale(cookie) ? cookie : DEFAULT_LOCALE;
  });
