import { createFileRoute } from "@tanstack/react-router";

// Webhook do Stripe: POST /api/stripe/webhook
// No Dashboard (Developers → Webhooks) criar um endpoint para este URL com os eventos:
//   checkout.session.completed, checkout.session.async_payment_succeeded,
//   checkout.session.async_payment_failed, checkout.session.expired
// e copiar o "Signing secret" (whsec_…) para STRIPE_WEBHOOK_SECRET.

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verifyWebhook, StripeError } = await import("@/lib/server/stripe");
        const raw = await request.text();
        let event: { type: string; data: { object: unknown } };
        try {
          event = await verifyWebhook(raw, request.headers.get("stripe-signature"));
        } catch (err) {
          const msg = err instanceof StripeError ? err.message : "invalid";
          return json({ error: msg }, 400);
        }
        try {
          const { getAdminClient } = await import("@/lib/server/supabase-admin");
          const { applyStripeEvent } = await import("@/lib/server/payments");
          const result = await applyStripeEvent(getAdminClient(), event.type, event.data.object);
          // Emails gerados pela mudança de estado (ex.: "Pagamento recebido") saem já.
          if (result === "captured" || result === "cancelled") {
            const { flushOutboxQuietly } = await import("@/lib/server/email");
            await flushOutboxQuietly(4);
          }
          return json({ received: true, result });
        } catch (err) {
          // 500 -> o Stripe volta a tentar mais tarde (até 3 dias).
          console.error("[stripe webhook]", event.type, err);
          return json({ error: "processing_failed" }, 500);
        }
      },
    },
  },
});
