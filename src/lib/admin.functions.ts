import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Depois de uma ação no backoffice (mudar estado, criar envio) os triggers
 * enfileiram emails; esta função envia-os logo, em vez de esperar pelo cron.
 * Só staff: o JWT é validado no Supabase e o papel lido com a service role.
 */
export const flushEmailQueue = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ access_token: z.string().min(20).max(4096) }).parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; sent?: number; configured?: boolean }> => {
    const { getAdminClient } = await import("./server/supabase-admin");
    const { enforceRateLimit } = await import("./server/security");
    const { isEmailConfigured, processOutbox } = await import("./server/email");
    try {
      const admin = getAdminClient();
      const { data: auth, error } = await admin.auth.getUser(data.access_token);
      if (error || !auth.user) return { ok: false };
      const { data: roles } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", auth.user.id)
        .in("role", ["admin", "staff"]);
      if (!roles?.length) return { ok: false };
      await enforceRateLimit("email-flush", 60, 10 * 60);
      if (!isEmailConfigured()) return { ok: true, sent: 0, configured: false };
      const res = await processOutbox(10);
      return { ok: true, sent: res.sent, configured: true };
    } catch (err) {
      console.error("[flushEmailQueue]", err);
      return { ok: false };
    }
  });
