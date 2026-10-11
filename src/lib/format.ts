import type { OrderStatus, ProductCard, ProductCondition, ServiceLevel } from "./types";

const eur = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });

/** 42500 -> "425,00 €" */
export function formatPrice(cents: number): string {
  return eur.format(cents / 100);
}

/** Preço de produto: sem preço definido = "Sob consulta". */
export function priceLabel(cents: number | null | undefined): string {
  return cents == null ? "Sob consulta" : formatPrice(cents);
}

export const conditionLabel: Record<ProductCondition, string> = {
  new: "Nova",
  used_tested: "Usada · testada",
  reconditioned: "Recondicionada",
};

export const serviceLevelLabel: Record<ServiceLevel, string> = {
  standard: "Normal",
  express: "Expresso",
};

export const orderStatusLabel: Record<OrderStatus, string> = {
  pending_payment: "A aguardar pagamento",
  paid: "Pagamento confirmado",
  processing: "Em preparação",
  shipped: "Enviada",
  delivered: "Entregue",
  cancelled: "Cancelada",
  refunded: "Reembolsada",
};

export const shipmentStatusLabel: Record<string, string> = {
  label_created: "Etiqueta criada",
  in_transit: "Em trânsito",
  out_for_delivery: "Em distribuição",
  delivered: "Entregue",
  exception: "Ocorrência",
  returned: "Devolvida",
};

/** Igual a public.normalize_reference no Postgres. */
export function normalizeReference(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function primaryReference(p: Pick<ProductCard, "references" | "slug">): string {
  return p.references.find((r) => r.type === "hardware")?.value ?? p.references[0]?.value ?? p.slug;
}

export function yearsLabel(from: number | null, to: number | null): string {
  if (from && to) return `${from}–${to}`;
  if (from) return `desde ${from}`;
  if (to) return `até ${to}`;
  return "—";
}

export function deliveryLabel(min: number | null, max: number | null): string {
  if (min == null && max == null) return "";
  if (min === max || max == null) return `${min} dia${min === 1 ? "" : "s"} úteis`;
  return `${min}–${max} dias úteis`;
}

export function stockState(qty: number): "in_stock" | "low" | "out" {
  if (qty <= 0) return "out";
  if (qty <= 2) return "low";
  return "in_stock";
}
