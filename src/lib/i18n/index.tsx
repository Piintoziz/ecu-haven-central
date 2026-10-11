import { useRouter, useRouterState } from "@tanstack/react-router";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { DICTS } from "./dict";
import { writeLocaleCookie, type Locale } from "./locale";

export type { Locale } from "./locale";

/** Cada namespace define { pt, en } com a mesma forma (verificado pelo TypeScript). */
export type Dict = { [K in keyof typeof DICTS]: (typeof DICTS)[K]["pt"] };

const cache = new Map<Locale, Dict>();

export function getDict(locale: Locale): Dict {
  let d = cache.get(locale);
  if (!d) {
    d = Object.fromEntries(Object.entries(DICTS).map(([k, v]) => [k, v[locale]])) as Dict;
    cache.set(locale, d);
  }
  return d;
}

type I18nValue = { locale: Locale; t: Dict; setLocale: (l: Locale) => void };

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const router = useRouter();
  const setLocale = useCallback(
    (l: Locale) => {
      if (l === locale) return;
      writeLocaleCookie(l);
      document.documentElement.lang = l;
      // reexecuta beforeLoad/loaders/head da árvore de rotas com o novo idioma
      void router.invalidate();
    },
    [locale, router],
  );
  const value = useMemo(() => ({ locale, t: getDict(locale), setLocale }), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

const noop = () => {};

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  // Páginas de erro da raiz podem renderizar fora do provider: usa o idioma do contexto da rota.
  const routeLocale = useRouterState({
    select: (s) => (s.matches[0]?.context as { locale?: Locale } | undefined)?.locale,
  });
  if (ctx) return ctx;
  const locale = routeLocale ?? "pt";
  return { locale, t: getDict(locale), setLocale: noop };
}

export function useT(): Dict {
  return useI18n().t;
}

/** Para `head()` das rotas: idioma + dicionário a partir do contexto da rota. */
export function headI18n(match: { context: unknown }): { locale: Locale; t: Dict } {
  const locale = (match.context as { locale?: Locale } | undefined)?.locale ?? "pt";
  return { locale, t: getDict(locale) };
}
