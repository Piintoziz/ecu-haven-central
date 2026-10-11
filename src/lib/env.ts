// Variáveis públicas (prefixo VITE_) — seguras para o bundle do cliente.
// Segredos (service role, Turnstile secret) vivem só em src/lib/server/*.

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";
export const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ?? "";

/** URL canónico do site, sem barra final. Obrigatório em produção. */
export const SITE_URL = (
  (import.meta.env.VITE_SITE_URL as string | undefined) ?? "http://localhost:8080"
).replace(/\/+$/, "");

export const SITE_NAME = "Centralinas";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
