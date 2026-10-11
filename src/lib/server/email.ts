// Envio de emails transacionais a partir da fila public.email_outbox.
// Só servidor. Fornecedor atual: Resend (API HTTP, compatível com Workers);
// trocar de fornecedor = reimplementar sendEmail().
import { serverEnv } from "./env";
import { getAdminClient } from "./supabase-admin";
import {
  renderEmail,
  type BankDetails,
  type EmailLocale,
  type OutboxRow,
  type RenderedEmail,
} from "./email-templates";

export function isEmailConfigured(): boolean {
  return !!serverEnv("RESEND_API_KEY") && !!serverEnv("EMAIL_FROM");
}

async function sendEmail(to: string, email: RenderedEmail): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serverEnv("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: serverEnv("EMAIL_FROM"),
      to: [to],
      reply_to: serverEnv("EMAIL_REPLY_TO") ?? undefined,
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`);
  }
}

export type OutboxRunResult = { sent: number; failed: number; skipped?: "not_configured" };

/** Reclama um lote da fila (atómico, sem duplicados entre workers) e envia. */
export async function processOutbox(limit = 10): Promise<OutboxRunResult> {
  if (!isEmailConfigured()) return { sent: 0, failed: 0, skipped: "not_configured" };
  const admin = getAdminClient();
  const { data, error } = await admin.rpc("claim_email_batch", { p_limit: limit });
  if (error) throw new Error(`claim_email_batch: ${error.message}`);
  const batch = (data ?? []) as OutboxRow[];
  if (batch.length === 0) return { sent: 0, failed: 0 };

  let bank: BankDetails | null = null;
  if (batch.some((r) => r.type === "order_confirmation")) {
    const { data: s } = await admin
      .from("store_settings")
      .select("value")
      .eq("key", "bank_transfer")
      .maybeSingle();
    bank = (s?.value as BankDetails | null) ?? null;
  }

  // Idioma do cliente guardado na encomenda (emails ao cliente; os do admin ficam em PT).
  const codes = [
    ...new Set(
      batch
        .filter((r) => r.type !== "order_admin_new_sale" && typeof r.payload.order_code === "string")
        .map((r) => r.payload.order_code as string),
    ),
  ];
  const locales = new Map<string, EmailLocale>();
  if (codes.length > 0) {
    const { data: rows } = await admin.from("orders").select("order_code, locale").in("order_code", codes);
    for (const o of (rows ?? []) as { order_code: string; locale: string }[]) {
      locales.set(o.order_code, o.locale === "en" ? "en" : "pt");
    }
  }
  const localeOf = (row: OutboxRow): EmailLocale => {
    if (row.type === "contact_admin" || row.type === "order_admin_new_sale") return "pt";
    if (row.payload.locale === "en") return "en";
    return locales.get(String(row.payload.order_code ?? "")) ?? "pt";
  };

  let sent = 0;
  let failed = 0;
  for (const row of batch) {
    try {
      await sendEmail(row.to_email, renderEmail(row, { bank, locale: localeOf(row) }));
      await admin
        .from("email_outbox")
        .update({ status: "sent", sent_at: new Date().toISOString(), last_error: null })
        .eq("id", row.id);
      sent++;
    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      console.error("[email]", row.type, message);
      await admin
        .from("email_outbox")
        .update({ status: "failed", last_error: message.slice(0, 500) })
        .eq("id", row.id);
    }
  }
  return { sent, failed };
}

/** Envio oportunista logo após um evento (encomenda, contacto). Nunca falha o pedido. */
export async function flushOutboxQuietly(limit = 5): Promise<void> {
  try {
    await processOutbox(limit);
  } catch (err) {
    console.error("[email flush]", err);
  }
}
