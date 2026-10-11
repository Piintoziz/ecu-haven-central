import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

/**
 * Cliente público (chave publicável/anon). Usado em loaders isomórficos
 * (SSR + browser) para LER o catálogo. Todas as permissões são decididas
 * pelas políticas RLS — nunca usar para operações privilegiadas.
 */
let client: SupabaseClient | null = null;

export function getPublicClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase não configurado: define VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env",
    );
  }
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return client;
}

/** URL pública de uma imagem do bucket product-images (nomes UUID, nunca do cliente). */
export function productImageUrl(path: string | null | undefined): string | null {
  if (!path || !/^[0-9a-f-]{36}\.(webp|jpg|png)$/.test(path)) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
}
