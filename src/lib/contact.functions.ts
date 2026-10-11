import { createServerFn } from "@tanstack/react-start";
import { contactInputSchema } from "./schemas";

export type ContactResult = { ok: true } | { ok: false; error: string };

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactInputSchema.parse(input))
  .handler(async ({ data }): Promise<ContactResult> => {
    // Imports dinâmicos dentro do handler: removidos do bundle do cliente com o handler.
    const { getAdminClient } = await import("./server/supabase-admin");
    const { PublicError, enforceRateLimit, hashedIp, toPublicMessage, verifyTurnstile } = await import(
      "./server/security"
    );
    try {
      // Honeypot preenchido -> bot. Respondemos "ok" para não dar pistas.
      if (data.website) return { ok: true };
      await enforceRateLimit("contact", 5, 60 * 60);
      await verifyTurnstile(data.turnstile_token);

      const admin = getAdminClient();
      const subject = data.product_reference
        ? `Pedido sobre ${data.product_reference}`
        : "Pedido de contacto";

      const { error } = await admin.from("contact_messages").insert({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.company ? `${subject} · ${data.company}` : subject,
        message: data.message,
        product_reference: data.product_reference || null,
        vin: data.vin || null,
        ip_hash: await hashedIp(),
      });
      if (error) {
        console.error("[contact]", error.message);
        throw new PublicError("Não foi possível enviar a mensagem. Tente novamente.");
      }

      const outbox: { type: string; to_email: string; payload: Record<string, string> }[] = [
        {
          type: "contact_received",
          to_email: data.email,
          payload: { name: data.name, subject, reference: data.product_reference, locale: data.locale },
        },
      ];
      const { data: setting } = await admin
        .from("store_settings")
        .select("value")
        .eq("key", "admin_email")
        .maybeSingle();
      const adminEmail = typeof setting?.value === "string" ? setting.value : null;
      if (adminEmail) {
        outbox.push({
          type: "contact_admin",
          to_email: adminEmail,
          payload: {
            name: data.name,
            email: data.email,
            subject,
            reference: data.product_reference,
          },
        });
      }
      const { error: outboxError } = await admin.from("email_outbox").insert(outbox);
      if (outboxError) console.error("[contact outbox]", outboxError.message);
      else {
        const { flushOutboxQuietly } = await import("./server/email");
        await flushOutboxQuietly(4);
      }

      return { ok: true };
    } catch (err) {
      return { ok: false, error: toPublicMessage(err, "Não foi possível enviar a mensagem.") };
    }
  });
