// Pagamentos online (só servidor): abre sessões de Stripe Checkout para uma
// encomenda e aplica os eventos do webhook. O estado "pago" vem SEMPRE do
// webhook assinado — nunca do regresso do cliente ao site.
import type { SupabaseClient } from "@supabase/supabase-js";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createCheckoutSession, type CheckoutSession } from "./stripe";
import { serverEnv } from "./env";
import { PublicError } from "./security";

/** Origem para os URLs de regresso: o próprio site (funciona em dev e em produção). */
export function requestOrigin(): string {
  const host = getRequestHeader("x-forwarded-host") ?? getRequestHeader("host");
  const proto = getRequestHeader("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  if (host && /^[a-z0-9.-]+(:\d+)?$/i.test(host)) return `${proto}://${host}`;
  return (serverEnv("VITE_SITE_URL") ?? "https://centralinas.com").replace(/\/+$/, "");
}

/** Cria (ou recria) a página de pagamento Stripe de uma encomenda por pagar. */
export async function openStripeCheckout(
  admin: SupabaseClient,
  orderCode: string,
  locale: "pt" | "en",
): Promise<string> {
  const { data: order, error } = await admin
    .from("orders")
    .select("id, order_code, email, total_cents, status, payment_status")
    .eq("order_code", orderCode)
    .maybeSingle();
  if (error) throw error;
  if (!order) throw new PublicError("Encomenda não encontrada.");
  if (order.status !== "pending_payment" || order.payment_status === "captured") {
    throw new PublicError("Esta encomenda já não está à espera de pagamento.");
  }

  const { count } = await admin
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("order_id", order.id)
    .eq("provider", "stripe");

  const session = await createCheckoutSession({
    orderCode: order.order_code,
    amountCents: order.total_cents,
    email: order.email,
    locale,
    origin: requestOrigin(),
    attempt: (count ?? 0) + 1,
  });
  if (!session.url) throw new PublicError("Não foi possível abrir o pagamento. Tente novamente.");

  const { error: payErr } = await admin.from("payments").upsert(
    { order_id: order.id, provider: "stripe", provider_reference: session.id, status: "pending", amount_cents: order.total_cents },
    { onConflict: "provider,provider_reference" },
  );
  if (payErr) console.error("[stripe payment row]", payErr.message);
  return session.url;
}

/** Aplica um evento do webhook. Idempotente: o Stripe pode reenviar o mesmo evento. */
export async function applyStripeEvent(admin: SupabaseClient, type: string, obj: unknown): Promise<string> {
  if (!type.startsWith("checkout.session.")) return "ignored";
  const s = obj as CheckoutSession;
  const code = s.metadata?.order_code ?? s.client_reference_id;
  if (!code) return "no_order";

  const { data: order } = await admin
    .from("orders")
    .select("id, total_cents, status, payment_status, payment_method")
    .eq("order_code", code)
    .maybeSingle();
  if (!order) return "order_not_found";

  const setPayment = (status: "pending" | "captured" | "failed") =>
    admin.from("payments").upsert(
      { order_id: order.id, provider: "stripe", provider_reference: s.id, status, amount_cents: s.amount_total ?? order.total_cents },
      { onConflict: "provider,provider_reference" },
    );

  const paid =
    (type === "checkout.session.completed" && s.payment_status === "paid") ||
    type === "checkout.session.async_payment_succeeded";

  if (paid) {
    if (s.amount_total !== order.total_cents || (s.currency ?? "eur").toLowerCase() !== "eur") {
      console.error("[stripe] valor diferente da encomenda", code, s.amount_total, order.total_cents);
      await setPayment("pending");
      return "amount_mismatch";
    }
    await setPayment("captured");
    if (order.payment_status !== "captured") {
      // O trigger passa a encomenda a "paga" e envia o email ao cliente.
      const { error } = await admin.from("orders").update({ payment_status: "captured", payment_method: "stripe" }).eq("id", order.id);
      if (error) throw error;
    }
    return "captured";
  }

  if (type === "checkout.session.completed") {
    // Pagamento assíncrono (ex.: referência Multibanco emitida, ainda por pagar).
    await setPayment("pending");
    return "awaiting_async";
  }

  if (type === "checkout.session.async_payment_failed" || type === "checkout.session.expired") {
    await setPayment("failed");
    // Encomenda feita para pagamento online, sem outra sessão em aberto e por pagar:
    // cancela e repõe o stock. (Quem escolheu transferência e só experimentou o
    // cartão continua com a encomenda aberta.)
    const { count } = await admin
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("order_id", order.id)
      .in("status", ["pending", "captured", "authorized"]);
    if (!count && order.payment_method === "stripe" && order.status === "pending_payment" && order.payment_status !== "captured") {
      const { error } = await admin.from("orders").update({ status: "cancelled" }).eq("id", order.id);
      if (error) console.error("[stripe cancel]", error.message);
      return "cancelled";
    }
    return "failed";
  }
  return "ignored";
}
