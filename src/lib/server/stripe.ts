// Cliente Stripe (só servidor). Usa a API REST com fetch e WebCrypto — sem SDK —
// para correr igual em Node e no Cloudflare Workers.
// Chaves: STRIPE_SECRET_KEY (sk_test_… / sk_live_…) e STRIPE_WEBHOOK_SECRET (whsec_…).
//
// Os métodos de pagamento NÃO são fixados aqui: o Checkout mostra os que estiverem
// ativos no Dashboard (Settings → Payment methods): cartão, Apple Pay, Google Pay,
// MB WAY, Multibanco, PayPal, Klarna… e só os que servem para o país/valor do cliente.
import { serverEnv } from "./env";

const API = "https://api.stripe.com/v1";

export class StripeError extends Error {}

export function isStripeConfigured(): boolean {
  return !!serverEnv("STRIPE_SECRET_KEY");
}

/** Codifica um objeto aninhado no formato form-urlencoded do Stripe (a[b][0][c]=…). */
function encode(obj: Record<string, unknown>, prefix = "", out = new URLSearchParams()): URLSearchParams {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((item, i) => (typeof item === "object" ? encode(item as Record<string, unknown>, `${key}[${i}]`, out) : out.append(`${key}[${i}]`, String(item))));
    else if (typeof v === "object") encode(v as Record<string, unknown>, key, out);
    else out.append(key, String(v));
  }
  return out;
}

async function stripe<T>(path: string, body: Record<string, unknown>, idempotencyKey?: string): Promise<T> {
  const key = serverEnv("STRIPE_SECRET_KEY");
  if (!key) throw new StripeError("Stripe não configurado (STRIPE_SECRET_KEY em falta).");
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2024-06-20",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: encode(body),
  });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new StripeError(json.error?.message ?? `Stripe ${res.status}`);
  return json;
}

export type CheckoutSession = {
  id: string;
  url: string | null;
  status: "open" | "complete" | "expired";
  payment_status: "paid" | "unpaid" | "no_payment_required";
  amount_total: number | null;
  currency: string | null;
  client_reference_id: string | null;
  metadata: Record<string, string> | null;
  payment_intent: string | null;
};

/** Cria a página de pagamento do Stripe para uma encomenda (válida 24 h). */
export async function createCheckoutSession(input: {
  orderCode: string;
  amountCents: number;
  email: string;
  locale: "pt" | "en";
  origin: string;
  attempt: number;
}): Promise<CheckoutSession> {
  const back = (estado: string) =>
    `${input.origin}/encomenda?codigo=${encodeURIComponent(input.orderCode)}&pagamento=${estado}`;
  return stripe<CheckoutSession>(
    "/checkout/sessions",
    {
      mode: "payment",
      locale: input.locale,
      customer_email: input.email,
      client_reference_id: input.orderCode,
      expires_at: Math.floor(Date.now() / 1000) + 24 * 3600,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: input.amountCents,
            product_data: {
              name: input.locale === "en" ? `Order ${input.orderCode}` : `Encomenda ${input.orderCode}`,
              description: input.locale === "en" ? "Centralinas.com — VAT and shipping included" : "Centralinas.com — IVA e portes incluídos",
            },
          },
        },
      ],
      metadata: { order_code: input.orderCode },
      payment_intent_data: {
        description: `Centralinas.com ${input.orderCode}`,
        metadata: { order_code: input.orderCode },
      },
      success_url: back("ok"),
      cancel_url: back("cancelado"),
    },
    `checkout-${input.orderCode}-${input.attempt}`,
  );
}

/**
 * Valida a assinatura do webhook (cabeçalho Stripe-Signature: t=…,v1=…) com
 * HMAC-SHA256 e rejeita eventos com mais de 5 minutos (replay).
 */
export async function verifyWebhook(rawBody: string, signatureHeader: string | null): Promise<{ type: string; data: { object: unknown } }> {
  const secret = serverEnv("STRIPE_WEBHOOK_SECRET");
  if (!secret) throw new StripeError("STRIPE_WEBHOOK_SECRET em falta.");
  if (!signatureHeader) throw new StripeError("Assinatura em falta.");
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i), p.slice(i + 1)];
    }),
  ) as Record<string, string>;
  const t = Number(parts.t);
  const signatures = signatureHeader
    .split(",")
    .filter((p) => p.startsWith("v1="))
    .map((p) => p.slice(3));
  if (!t || signatures.length === 0) throw new StripeError("Assinatura inválida.");
  if (Math.abs(Date.now() / 1000 - t) > 300) throw new StripeError("Evento fora do prazo.");

  const keyData = new TextEncoder().encode(secret);
  const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(`${t}.${rawBody}`));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const ok = signatures.some((s) => s.length === expected.length && timingSafeEqual(s, expected));
  if (!ok) throw new StripeError("Assinatura inválida.");
  return JSON.parse(rawBody) as { type: string; data: { object: unknown } };
}

function timingSafeEqual(a: string, b: string): boolean {
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
