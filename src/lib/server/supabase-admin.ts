import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "../env";
import { serverEnv } from "./env";

/**
 * Cliente com service role — ignora RLS. Só existe no servidor e só é usado
 * para chamar funções SQL restritas (place_order, track_order, check_rate_limit)
 * e para inserir contactos com colunas explicitamente mapeadas.
 */
let admin: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  const key = serverEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY em falta no ambiente do servidor");
  }
  if (!admin) {
    admin = createClient(SUPABASE_URL, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return admin;
}
