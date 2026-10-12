// Cliente Packlink PRO (só servidor). A chave vem de PACKLINK_API_KEY.
// Fluxo: rascunho criado aqui -> pagamento no painel Packlink -> quando há nº de
// tracking, syncPacklinkOrder cria a linha em shipments (triggers enviam emails).
import { buildTrackingUrl } from "../carriers";
import { WAREHOUSE } from "../content";
import { serverEnv } from "./env";
import type { getAdminClient } from "./supabase-admin";

type Admin = ReturnType<typeof getAdminClient>;

const BASE = "https://api.packlink.com/v1";

export class PacklinkError extends Error {}

export function isPacklinkConfigured(): boolean {
  return !!serverEnv("PACKLINK_API_KEY");
}

async function pl<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = serverEnv("PACKLINK_API_KEY");
  if (!key) throw new PacklinkError("Packlink não configurada (PACKLINK_API_KEY em falta).");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: key, "Content-Type": "application/json", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("[packlink]", init.method ?? "GET", path, res.status, text.slice(0, 500));
    let msg = `Packlink respondeu ${res.status}.`;
    try {
      const m = (JSON.parse(text) as { messages?: { message?: string }[] }).messages?.[0]?.message;
      if (m) msg = `Packlink: ${m}`;
    } catch {
      /* resposta não-JSON */
    }
    throw new PacklinkError(msg);
  }
  return (text ? JSON.parse(text) : null) as T;
}

type Service = {
  id: number;
  carrier_name: string;
  name: string;
  dropoff: boolean;
  delivery_to_parcelshop: boolean;
  available_dates?: Record<string, string>;
  price?: { total_price: number };
};

export type PacklinkShipment = {
  packlink_reference: string;
  state: string;
  carrier: string | null;
  trackings: string[] | null;
  tracking_url: string | null;
  collection_date: string | null;
  labels: string[] | null;
  service_info?: { carrier_name: string | null; name: string | null };
};

export type Parcel = { weight_g: number; length_cm: number; width_cm: number; height_cm: number };

type Address = {
  full_name: string;
  company_name?: string | null;
  line1: string;
  line2?: string | null;
  postal_code: string;
  city: string;
  region?: string | null;
  country_code: string;
};

function splitName(full: string): { name: string; surname: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { name: parts[0]!, surname: parts[0]! };
  return { name: parts.slice(0, -1).join(" "), surname: parts[parts.length - 1]! };
}

/** Serviço a usar: o da tarifa escolhida no checkout, senão o mais barato da mesma transportadora com recolha. */
async function pickService(to: Address, parcel: Parcel, serviceId: number | null, carrier: string | null) {
  const qs = new URLSearchParams({
    "from[country]": "PT",
    "from[zip]": WAREHOUSE.postal_code,
    "to[country]": to.country_code,
    "to[zip]": to.postal_code,
    "packages[0][weight]": String(parcel.weight_g / 1000),
    "packages[0][length]": String(parcel.length_cm),
    "packages[0][width]": String(parcel.width_cm),
    "packages[0][height]": String(parcel.height_cm),
  });
  const list = await pl<Service[]>(`/services?${qs}`);
  const pickup = (Array.isArray(list) ? list : []).filter((s) => !s.dropoff && !s.delivery_to_parcelshop);
  const byId = serviceId ? pickup.find((s) => s.id === serviceId) : undefined;
  if (byId) return byId;
  const c = (carrier ?? "").toLowerCase().split(/\s+/)[0] ?? "";
  const same = pickup
    .filter((s) => c && s.carrier_name.toLowerCase().includes(c))
    .sort((a, b) => (a.price?.total_price ?? 0) - (b.price?.total_price ?? 0));
  if (same[0]) return same[0];
  throw new PacklinkError(
    `Nenhum serviço Packlink com recolha disponível para ${to.country_code} ${to.postal_code}${carrier ? ` (${carrier})` : ""}.`,
  );
}

/** Primeira data de recolha disponível (formato Packlink AAAA/MM/DD). */
function firstCollectionDate(s: Service): string | undefined {
  const dates = Object.keys(s.available_dates ?? {}).sort();
  return dates[0];
}

export async function createPacklinkDraft(input: {
  order_code: string;
  email: string;
  phone: string;
  to: Address;
  parcel: Parcel;
  content_value_eur: number;
  service_id: number | null;
  carrier: string | null;
}): Promise<{ reference: string; service: Service; collection_date?: string }> {
  if (/0{3}\s?0{3}/.test(WAREHOUSE.phone)) {
    throw new PacklinkError("Defina o telefone real do armazém em src/lib/content.ts (COMPANY.phone) antes de criar envios.");
  }
  const service = await pickService(input.to, input.parcel, input.service_id, input.carrier);
  const collection_date = firstCollectionDate(service);
  const sender = splitName(WAREHOUSE.contact_name);
  const recipient = splitName(input.to.full_name);
  const body = {
    shipment_custom_reference: input.order_code,
    service_id: service.id,
    from: {
      name: sender.name,
      surname: sender.surname,
      company: WAREHOUSE.company,
      street1: WAREHOUSE.street,
      zip_code: WAREHOUSE.postal_code,
      city: WAREHOUSE.city,
      country: "PT",
      phone: WAREHOUSE.phone,
      email: WAREHOUSE.email,
    },
    to: {
      name: recipient.name,
      surname: recipient.surname,
      company: input.to.company_name ?? "",
      street1: input.to.line1,
      street2: input.to.line2 ?? "",
      zip_code: input.to.postal_code,
      city: input.to.city,
      state: input.to.region ?? "",
      country: input.to.country_code,
      phone: input.phone,
      email: input.email,
    },
    packages: [
      {
        weight: input.parcel.weight_g / 1000,
        length: input.parcel.length_cm,
        width: input.parcel.width_cm,
        height: input.parcel.height_cm,
      },
    ],
    content: "Centralina eletrónica automóvel",
    contentvalue: Math.round(input.content_value_eur * 100) / 100,
    content_second_hand: true,
    ...(collection_date ? { collection_date } : {}),
  };
  const res = await pl<{ reference: string }>("/shipments", { method: "POST", body: JSON.stringify(body) });
  if (!res?.reference) throw new PacklinkError("A Packlink não devolveu a referência do envio.");
  return { reference: res.reference, service, collection_date };
}

export async function getPacklinkShipment(ref: string): Promise<PacklinkShipment> {
  return pl<PacklinkShipment>(`/shipments/${encodeURIComponent(ref)}`);
}

export async function getPacklinkLabels(ref: string): Promise<string[]> {
  const s = await getPacklinkShipment(ref);
  if (s.labels?.length) return s.labels;
  const labels = await pl<string[]>(`/shipments/${encodeURIComponent(ref)}/labels`).catch(() => []);
  return Array.isArray(labels) ? labels : [];
}

export async function deletePacklinkDraft(ref: string): Promise<void> {
  await pl(`/shipments/${encodeURIComponent(ref)}`, { method: "DELETE" });
}

// Estados Packlink -> estado do envio na loja
const STATE_TO_STATUS: Record<string, "in_transit" | "out_for_delivery" | "delivered" | "exception" | "returned"> = {
  IN_TRANSIT: "in_transit",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  INCIDENT: "exception",
  RETURNED_TO_SENDER: "returned",
};

const toIsoDate = (d: string | null | undefined) => (d ? d.replace(/\//g, "-").slice(0, 10) : null);

/**
 * Lê o envio na Packlink e atualiza a encomenda. Quando aparece o nº de tracking
 * cria a linha em shipments; mudanças de estado viram shipment_events.
 */
export async function syncPacklinkOrder(admin: Admin, orderId: string): Promise<{ state: string; tracking?: string }> {
  const { data: order, error } = await admin
    .from("orders")
    .select("id, packlink_reference, service_level")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order?.packlink_reference) throw new PacklinkError("Encomenda sem envio Packlink.");

  const s = await getPacklinkShipment(order.packlink_reference);
  await admin
    .from("orders")
    .update({ packlink_state: s.state, packlink_collection_date: toIsoDate(s.collection_date) })
    .eq("id", orderId);

  const tracking = s.trackings?.find(Boolean);
  if (!tracking) return { state: s.state };

  const carrier = s.carrier || s.service_info?.carrier_name || "Packlink";
  const { data: existing } = await admin
    .from("shipments")
    .select("id, status")
    .eq("packlink_reference", order.packlink_reference)
    .maybeSingle();

  let shipmentId = existing?.id as string | undefined;
  let current = existing?.status as string | undefined;
  if (!shipmentId) {
    const url = s.tracking_url && /^https:\/\//.test(s.tracking_url) ? s.tracking_url : buildTrackingUrl(carrier, tracking);
    const { data: ins, error: insErr } = await admin
      .from("shipments")
      .insert({
        order_id: orderId,
        carrier: carrier.slice(0, 60),
        service_level: order.service_level ?? "standard",
        tracking_number: tracking.slice(0, 80),
        tracking_url: url || null,
        packlink_reference: order.packlink_reference,
      })
      .select("id, status")
      .single();
    if (insErr) throw new Error(insErr.message);
    shipmentId = ins.id;
    current = ins.status;
  }

  const next = STATE_TO_STATUS[s.state];
  if (next && next !== current) {
    const { error: evErr } = await admin.from("shipment_events").insert({
      shipment_id: shipmentId,
      status: next,
      description: `Packlink: ${s.state}`,
      occurred_at: new Date().toISOString(),
    });
    if (evErr) throw new Error(evErr.message);
  }
  return { state: s.state, tracking };
}

/** Para o cron: sincroniza encomendas com envio Packlink ainda não entregue. */
export async function syncOpenPacklinkOrders(admin: Admin, limit = 25): Promise<{ synced: number; failed: number }> {
  if (!isPacklinkConfigured()) return { synced: 0, failed: 0 };
  const { data } = await admin
    .from("orders")
    .select("id")
    .not("packlink_reference", "is", null)
    .not("packlink_state", "in", "(DELIVERED,RETURNED_TO_SENDER,CANCELED,CANCELLED)")
    .not("status", "in", "(cancelled,refunded,delivered)")
    .order("updated_at", { ascending: true })
    .limit(limit);
  let synced = 0;
  let failed = 0;
  for (const o of data ?? []) {
    try {
      await syncPacklinkOrder(admin, o.id as string);
      synced++;
    } catch (err) {
      failed++;
      console.error("[packlink sync]", o.id, err);
    }
  }
  return { synced, failed };
}
