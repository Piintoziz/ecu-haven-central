import { createServerFn } from "@tanstack/react-start";
import { orderInputSchema, trackInputSchema } from "./schemas";
import type { TrackedOrder } from "./types";

export type PlaceOrderResult =
  | {
      ok: true;
      order_code: string;
      email: string;
      subtotal_cents: number;
      shipping_cents: number;
      vat_cents: number;
      total_cents: number;
      /** Dados para o passo "Pagar" (transferência bancária); null se ainda não configurados. */
      bank: BankDetails | null;
    }
  | { ok: false; error: string };

export type BankDetails = { holder?: string; iban?: string; bic?: string; bank?: string };

const ORDER_ERRORS: Record<string, string> = {
  insufficient_stock: "Um dos artigos já não tem stock suficiente. Atualize o carrinho.",
  product_unavailable: "Um dos artigos deixou de estar disponível.",
  price_on_request: "Um dos artigos passou a ter preço sob consulta. Peça-nos orçamento para essa peça.",
  shipping_unavailable: "O método de envio escolhido não está disponível para este destino.",
  invalid_items: "O carrinho é inválido.",
  duplicate_items: "O carrinho é inválido.",
  invalid_quantity: "Quantidade inválida.",
};

/**
 * Cria a encomenda no servidor. O cliente nunca envia preços: subtotal, portes
 * e IVA são recalculados na função SQL place_order (transação atómica).
 */
export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => orderInputSchema.parse(input))
  .handler(async ({ data }): Promise<PlaceOrderResult> => {
    // Imports dinâmicos dentro do handler: removidos do bundle do cliente com o handler.
    const { getAdminClient } = await import("./server/supabase-admin");
    const { PublicError, enforceRateLimit, toPublicMessage, verifyTurnstile } = await import("./server/security");
    try {
      if (data.website) throw new PublicError("Pedido inválido.");
      await enforceRateLimit("order", 5, 15 * 60);
      await verifyTurnstile(data.turnstile_token);

      const billing = data.billing_same_as_shipping ? data.shipping_address : data.billing_address!;
      const admin = getAdminClient();

      // Cliente autenticado: o user_id vem SEMPRE do JWT validado pelo Supabase,
      // nunca de um campo enviado pelo browser. Token inválido -> encomenda de convidado.
      let userId = "";
      if (data.access_token) {
        const { data: auth, error: authError } = await admin.auth.getUser(data.access_token);
        if (!authError && auth.user) userId = auth.user.id;
      }

      // Whitelist explícita de campos — nada do input é passado "tal e qual".
      const payload = {
        user_id: userId,
        items: data.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        email: data.email,
        phone: data.phone,
        company_name: data.shipping_address.company_name || billing.company_name || "",
        vat_number: data.vat_number,
        shipping_rate_id: data.shipping_rate_id,
        notes: data.notes,
        shipping_address: pickAddress(data.shipping_address),
        billing_address: pickAddress(billing),
      };

      const { data: res, error } = await admin.rpc("place_order", { p_order: payload });
      if (error) {
        const key = Object.keys(ORDER_ERRORS).find((k) => error.message.includes(k));
        if (key) return { ok: false, error: ORDER_ERRORS[key]! };
        console.error("[place_order]", error.message);
        return { ok: false, error: "Não foi possível registar a encomenda. Tente novamente." };
      }
      // Idioma do cliente: gravado antes do envio para os emails saírem na língua certa.
      if (data.locale !== "pt") {
        const code = (res as { order_code: string }).order_code;
        const { error: locErr } = await admin.from("orders").update({ locale: data.locale }).eq("order_code", code);
        if (locErr) console.error("[place_order locale]", locErr.message);
      }
      // Confirmação ao cliente + aviso ao admin saem já; falhas ficam na fila para o cron.
      const { flushOutboxQuietly } = await import("./server/email");
      await flushOutboxQuietly(4);

      const r = res as {
        order_code: string;
        subtotal_cents: number;
        shipping_cents: number;
        vat_cents: number;
        total_cents: number;
      };
      // IBAN vem das definições da loja (só legíveis pelo servidor/staff).
      const { data: bankRow } = await admin
        .from("store_settings")
        .select("value")
        .eq("key", "bank_transfer")
        .maybeSingle();
      const bank = (bankRow?.value ?? null) as BankDetails | null;

      return {
        ok: true,
        bank: bank?.iban ? bank : null,
        order_code: r.order_code,
        email: data.email,
        subtotal_cents: r.subtotal_cents,
        shipping_cents: r.shipping_cents,
        vat_cents: r.vat_cents,
        total_cents: r.total_cents,
      };
    } catch (err) {
      return { ok: false, error: toPublicMessage(err, "Não foi possível registar a encomenda.") };
    }
  });

function pickAddress(a: {
  full_name: string;
  company_name?: string;
  line1: string;
  line2?: string;
  postal_code: string;
  city: string;
  region?: string;
  country_code: string;
}) {
  return {
    full_name: a.full_name,
    company_name: a.company_name ?? "",
    line1: a.line1,
    line2: a.line2 ?? "",
    postal_code: a.postal_code,
    city: a.city,
    region: a.region ?? "",
    country_code: a.country_code,
  };
}

export type TrackOrderResult =
  | { ok: true; order: TrackedOrder }
  | { ok: false; error: string };

/** Consulta de encomenda sem conta: só estado, artigos e envios (sem dados pessoais). */
export const trackOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => trackInputSchema.parse(input))
  .handler(async ({ data }): Promise<TrackOrderResult> => {
    const { getAdminClient } = await import("./server/supabase-admin");
    const { enforceRateLimit, toPublicMessage } = await import("./server/security");
    try {
      await enforceRateLimit("track", 20, 10 * 60);
      const { data: res, error } = await getAdminClient().rpc("track_order", { p_code: data.code });
      if (error) {
        console.error("[track_order]", error.message);
        return { ok: false, error: "Serviço temporariamente indisponível." };
      }
      if (!res) return { ok: false, error: "Não encontrámos nenhuma encomenda com esse código." };
      return { ok: true, order: res as TrackedOrder };
    } catch (err) {
      return { ok: false, error: toPublicMessage(err, "Serviço temporariamente indisponível.") };
    }
  });
