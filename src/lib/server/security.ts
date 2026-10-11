import { getRequestHeader } from "@tanstack/react-start/server";
import { getAdminClient } from "./supabase-admin";
import { serverEnv } from "./env";

export class PublicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicError";
  }
}

function clientIp(): string {
  const cf = getRequestHeader("cf-connecting-ip");
  if (cf) return cf;
  const fwd = getRequestHeader("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return getRequestHeader("x-real-ip") ?? "unknown";
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** IP anonimizado (hash com sal) — nunca guardamos IPs em claro. */
export async function hashedIp(): Promise<string> {
  const salt = serverEnv("IP_HASH_SALT") ?? "centralinas-dev-salt";
  return sha256(`${salt}:${clientIp()}`);
}

/** Rate limit por IP e âmbito (janela fixa, contador atómico na BD). */
export async function enforceRateLimit(scope: string, limit: number, windowSeconds: number) {
  const key = `${scope}:${await hashedIp()}`;
  const { data, error } = await getAdminClient().rpc("check_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[rate-limit]", error.message);
    throw new PublicError("Serviço temporariamente indisponível. Tente novamente.");
  }
  if (data !== true) {
    throw new PublicError("Demasiados pedidos seguidos. Aguarde alguns minutos e tente novamente.");
  }
}

/** Verifica o token Cloudflare Turnstile, se o segredo estiver configurado. */
export async function verifyTurnstile(token: string | undefined) {
  const secret = serverEnv("TURNSTILE_SECRET_KEY");
  if (!secret) return; // proteção anti-bot desativada até configurar o segredo
  if (!token) throw new PublicError("Confirme a verificação anti-spam.");
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, response: token, remoteip: clientIp() }),
  });
  const json = (await res.json()) as { success?: boolean };
  if (!json.success) throw new PublicError("A verificação anti-spam falhou. Tente novamente.");
}

export function toPublicMessage(err: unknown, fallback: string): string {
  if (err instanceof PublicError) return err.message;
  console.error(err);
  return fallback;
}
