import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Envios Packlink a partir do backoffice. Só staff: o JWT é validado no Supabase
// e o papel lido com a service role (igual a flushEmailQueue).

const token = z.string().min(20).max(4096);
const orderId = z.string().uuid();

async function requireStaff(accessToken: string) {
  const { getAdminClient } = await import("./server/supabase-admin");
  const admin = getAdminClient();
  const { data: auth, error } = await admin.auth.getUser(accessToken);
  if (error || !auth.user) throw new Error("Sessão inválida.");
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", auth.user.id)
    .in("role", ["admin", "staff"]);
  if (!roles?.length) throw new Error("Sem permissão.");
  return admin;
}

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const fail = (err: unknown, fallback: string): { ok: false; error: string } => {
  const msg = err instanceof Error ? err.message : "";
  // Só mensagens nossas/da Packlink chegam ao browser; o resto vai para o log.
  if (/^(Packlink|Defina|Nenhum|Encomenda|Sessão|Sem permissão)/.test(msg)) return { ok: false, error: msg };
  console.error("[shipping]", err);
  return { ok: false, error: fallback };
};

export const packlinkCreateShipment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        access_token: token,
        order_id: orderId,
        weight_g: z.number().int().min(100).max(30000),
        length_cm: z.number().int().min(5).max(150),
        width_cm: z.number().int().min(5).max(150),
        height_cm: z.number().int().min(2).max(150),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<Result<{ reference: string; service: string; collection_date?: string }>> => {
    try {
      const admin = await requireStaff(data.access_token);
      const { createPacklinkDraft } = await import("./server/packlink");
      const { data: o, error } = await admin
        .from("orders")
        .select(
          "id, order_code, email, phone, status, subtotal_cents, shipping_address, packlink_reference, shipping_rate:shipping_rates(carrier, packlink_service_id)",
        )
        .eq("id", data.order_id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!o) throw new Error("Encomenda não encontrada.");
      if (o.packlink_reference) throw new Error(`Encomenda já tem envio Packlink (${o.packlink_reference}).`);
      if (!["paid", "processing"].includes(o.status as string))
        throw new Error("Encomenda tem de estar paga (ou em preparação) para criar o envio.");
      if (!o.phone) throw new Error("Encomenda sem telefone do destinatário.");

      const rate = (Array.isArray(o.shipping_rate) ? o.shipping_rate[0] : o.shipping_rate) as
        | { carrier: string; packlink_service_id: number | null }
        | null;
      const res = await createPacklinkDraft({
        order_code: o.order_code as string,
        email: o.email as string,
        phone: o.phone as string,
        to: o.shipping_address as never,
        parcel: { weight_g: data.weight_g, length_cm: data.length_cm, width_cm: data.width_cm, height_cm: data.height_cm },
        content_value_eur: (o.subtotal_cents as number) / 100,
        service_id: rate?.packlink_service_id ?? null,
        carrier: rate?.carrier ?? null,
      });
      const { error: upErr } = await admin
        .from("orders")
        .update({
          packlink_reference: res.reference,
          packlink_state: "AWAITING_COMPLETION",
          packlink_collection_date: res.collection_date ? res.collection_date.replace(/\//g, "-") : null,
          status: "processing",
        })
        .eq("id", o.id);
      if (upErr) throw new Error(upErr.message);
      return {
        ok: true,
        reference: res.reference,
        service: `${res.service.carrier_name} · ${res.service.name}`,
        collection_date: res.collection_date,
      };
    } catch (err) {
      return fail(err, "Não foi possível criar o envio na Packlink.");
    }
  });

export const packlinkSyncShipment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ access_token: token, order_id: orderId }).parse(input))
  .handler(async ({ data }): Promise<Result<{ state: string; tracking?: string }>> => {
    try {
      const admin = await requireStaff(data.access_token);
      const { syncPacklinkOrder } = await import("./server/packlink");
      const res = await syncPacklinkOrder(admin, data.order_id);
      return { ok: true, ...res };
    } catch (err) {
      return fail(err, "Não foi possível ler o estado na Packlink.");
    }
  });

export const packlinkLabel = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ access_token: token, order_id: orderId }).parse(input))
  .handler(async ({ data }): Promise<Result<{ urls: string[] }>> => {
    try {
      const admin = await requireStaff(data.access_token);
      const { getPacklinkLabels } = await import("./server/packlink");
      const { data: o } = await admin.from("orders").select("packlink_reference").eq("id", data.order_id).maybeSingle();
      if (!o?.packlink_reference) throw new Error("Encomenda sem envio Packlink.");
      const urls = (await getPacklinkLabels(o.packlink_reference as string)).filter((u) => /^https:\/\//.test(u));
      if (!urls.length) throw new Error("Packlink: etiqueta ainda não disponível (o envio já foi pago?).");
      return { ok: true, urls };
    } catch (err) {
      return fail(err, "Não foi possível obter a etiqueta.");
    }
  });

/** Apaga o rascunho na Packlink (só antes de pago) e desliga-o da encomenda. */
export const packlinkCancelDraft = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ access_token: token, order_id: orderId }).parse(input))
  .handler(async ({ data }): Promise<Result> => {
    try {
      const admin = await requireStaff(data.access_token);
      const { deletePacklinkDraft, getPacklinkShipment } = await import("./server/packlink");
      const { data: o } = await admin.from("orders").select("packlink_reference").eq("id", data.order_id).maybeSingle();
      if (!o?.packlink_reference) throw new Error("Encomenda sem envio Packlink.");
      const s = await getPacklinkShipment(o.packlink_reference as string);
      if (!["AWAITING_COMPLETION", "READY_TO_PURCHASE"].includes(s.state))
        throw new Error("Packlink: o envio já foi pago; cancele-o no painel Packlink.");
      await deletePacklinkDraft(o.packlink_reference as string);
      await admin
        .from("orders")
        .update({ packlink_reference: null, packlink_state: null, packlink_collection_date: null })
        .eq("id", data.order_id);
      return { ok: true };
    } catch (err) {
      return fail(err, "Não foi possível cancelar o rascunho.");
    }
  });
