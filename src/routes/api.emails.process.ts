import { createFileRoute } from "@tanstack/react-router";

// Worker da fila de emails. Chamado por um agendador (ex.: Supabase pg_cron +
// pg_net, ou Cron Trigger do Cloudflare) a cada 2–5 minutos:
//   POST /api/emails/process   Authorization: Bearer <CRON_SECRET>
// Reenvia falhas com backoff e recupera envios presos (ver claim_email_batch).
// Também sincroniza os envios Packlink em curso (tracking e estado).

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export const Route = createFileRoute("/api/emails/process")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { serverEnv } = await import("@/lib/server/env");
        const secret = serverEnv("CRON_SECRET");
        const auth = request.headers.get("authorization") ?? "";
        if (!secret || secret.length < 32 || !safeEqual(auth, `Bearer ${secret}`)) {
          return json({ error: "unauthorized" }, 401);
        }
        try {
          const { processOutbox } = await import("@/lib/server/email");
          const { getAdminClient } = await import("@/lib/server/supabase-admin");
          const { syncOpenPacklinkOrders } = await import("@/lib/server/packlink");
          // Primeiro o tracking (pode gerar emails), depois a fila de emails.
          const packlink = await syncOpenPacklinkOrders(getAdminClient(), 20).catch((err) => {
            console.error("[packlink cron]", err);
            return { synced: 0, failed: -1 };
          });
          const result = await processOutbox(25);
          return json({ ...result, packlink });
        } catch (err) {
          console.error("[emails/process]", err);
          return json({ error: "failed" }, 500);
        }
      },
    },
  },
});
