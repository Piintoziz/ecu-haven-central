// Área de cliente — leituras/escritas com a sessão do utilizador (RLS: só os
// seus dados). Filtramos SEMPRE por user_id: um membro do staff também é
// cliente e a RLS dá-lhe acesso a todas as encomendas.
import { getAuthClient } from "./auth";
import type { ProfileInput } from "./schemas";
import type { OrderStatus, ServiceLevel, TrackedOrder } from "./types";

export type MyOrderRow = {
  id: string;
  order_code: string;
  status: OrderStatus;
  payment_status: string;
  total_cents: number;
  created_at: string;
  order_items: { quantity: number; reference_snapshot: string }[];
};

export async function listMyOrders(userId: string): Promise<MyOrderRow[]> {
  const { data, error } = await getAuthClient()
    .from("orders")
    .select(
      "id, order_code, status, payment_status, total_cents, created_at, order_items(quantity, reference_snapshot)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Não foi possível carregar as encomendas.");
  return (data ?? []) as MyOrderRow[];
}

type AddressJson = {
  full_name: string;
  company_name?: string;
  line1: string;
  line2?: string;
  postal_code: string;
  city: string;
  region?: string;
  country_code: string;
};

export type MyOrderDetail = TrackedOrder & {
  subtotal_cents: number;
  shipping_cents: number;
  vat_cents: number;
  shipping_address: AddressJson;
  billing_address: AddressJson;
  vat_number: string | null;
  lines: { title: string; reference: string; quantity: number; unit_price_cents: number }[];
};

type OrderQueryRow = {
  order_code: string;
  status: OrderStatus;
  payment_status: string;
  created_at: string;
  total_cents: number;
  subtotal_cents: number;
  shipping_cents: number;
  vat_cents: number;
  currency: string;
  vat_number: string | null;
  shipping_address: AddressJson;
  billing_address: AddressJson;
  order_items: {
    title_snapshot: string;
    reference_snapshot: string;
    quantity: number;
    unit_price_cents: number;
  }[];
  shipments: {
    carrier: string;
    service_level: ServiceLevel;
    tracking_number: string | null;
    tracking_url: string | null;
    status: string;
    shipped_at: string | null;
    delivered_at: string | null;
    created_at: string;
    shipment_events: {
      status: string;
      description: string | null;
      location: string | null;
      occurred_at: string;
    }[];
  }[];
};

export async function getMyOrder(userId: string, code: string): Promise<MyOrderDetail | null> {
  const { data, error } = await getAuthClient()
    .from("orders")
    .select(
      `order_code, status, payment_status, created_at, total_cents, subtotal_cents, shipping_cents, vat_cents,
       currency, vat_number, shipping_address, billing_address,
       order_items(title_snapshot, reference_snapshot, quantity, unit_price_cents),
       shipments(carrier, service_level, tracking_number, tracking_url, status, shipped_at, delivered_at, created_at,
                 shipment_events(status, description, location, occurred_at))`,
    )
    .eq("user_id", userId)
    .eq("order_code", code)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar a encomenda.");
  if (!data) return null;
  const o = data as unknown as OrderQueryRow;
  const lines = o.order_items.map((i) => ({
    title: i.title_snapshot,
    reference: i.reference_snapshot,
    quantity: i.quantity,
    unit_price_cents: i.unit_price_cents,
  }));
  return {
    order_code: o.order_code,
    status: o.status,
    payment_status: o.payment_status,
    created_at: o.created_at,
    total_cents: o.total_cents,
    subtotal_cents: o.subtotal_cents,
    shipping_cents: o.shipping_cents,
    vat_cents: o.vat_cents,
    currency: o.currency,
    vat_number: o.vat_number,
    destination_country: o.shipping_address?.country_code ?? null,
    shipping_address: o.shipping_address,
    billing_address: o.billing_address,
    items: lines,
    lines,
    shipments: [...o.shipments]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((s) => ({
        carrier: s.carrier,
        service_level: s.service_level,
        tracking_number: s.tracking_number,
        tracking_url: s.tracking_url,
        status: s.status,
        shipped_at: s.shipped_at,
        delivered_at: s.delivered_at,
        events: [...s.shipment_events].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)),
      })),
  };
}

export type Profile = ProfileInput & { id: string };

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getAuthClient()
    .from("profiles")
    .select("id, full_name, phone, company_name, vat_number, customer_type")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar o perfil.");
  if (!data) return null;
  return {
    id: data.id as string,
    full_name: (data.full_name as string | null) ?? "",
    phone: (data.phone as string | null) ?? "",
    company_name: (data.company_name as string | null) ?? "",
    vat_number: (data.vat_number as string | null) ?? "",
    customer_type: (data.customer_type as "b2c" | "b2b") ?? "b2c",
  };
}

export async function updateMyProfile(userId: string, input: ProfileInput): Promise<void> {
  // Só as colunas com GRANT de update para "authenticated" (ver migração inicial).
  const { error } = await getAuthClient()
    .from("profiles")
    .update({
      full_name: input.full_name,
      phone: input.phone || null,
      company_name: input.company_name || null,
      vat_number: input.vat_number || null,
      customer_type: input.customer_type,
    })
    .eq("id", userId);
  if (error) throw new Error("Não foi possível guardar o perfil.");
}
