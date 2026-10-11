import type { OrderStatus, ProductCard, ProductCondition, ServiceLevel } from "../../types";
import { money, ns } from "../ns";
import { MESSAGES_EN } from "./messages";

type TitleInput = Pick<ProductCard, "title" | "references" | "slug" | "label_code" | "brands"> & {
  manufacturer: { name: string } | null;
  category: { slug: string } | null;
};

const regionNames = {
  pt: typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["pt-PT"], { type: "region" }) : null,
  en: typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["en-GB"], { type: "region" }) : null,
};

function primaryRef(p: Pick<ProductCard, "references" | "slug">) {
  return p.references.find((r) => r.type === "hardware")?.value ?? p.references[0]?.value ?? p.slug;
}

const CATEGORY_EN: Record<string, { name: string; label: string; description: string }> = {
  motor: {
    name: "Engine ECUs",
    label: "Engine ECU",
    description: "Diesel and petrol engine management: EDC16, EDC17, MED17, SID, Simos, DCM.",
  },
  abs: { name: "ABS / ESP modules", label: "ABS/ESP module", description: "Braking and stability control units and hydraulic blocks." },
  airbag: { name: "Airbag modules", label: "Airbag module", description: "SRS units with crash data cleared and tested." },
  transmissao: { name: "Transmission (TCU)", label: "Transmission ECU (TCU)", description: "TCUs for automatic, DSG, PDK and CVT gearboxes." },
  conforto: { name: "Comfort & BCM", label: "Comfort module / BCM", description: "Body control, SAM, lighting, windows and climate." },
  imobilizador: { name: "Immobiliser & keys", label: "Immobiliser module", description: "Kessy, ELV, transponders and start modules." },
  pesados: { name: "Trucks & heavy vehicles", label: "Truck ECU", description: "Engine ECUs and modules for heavy vehicles." },
};

export const common = ns({
  pt: {
    intl: "pt-PT",
    price: money.pt,
    priceOnRequest: "Sob consulta",
    priceLabel: (c: number | null | undefined) => (c == null ? "Sob consulta" : money.pt(c)),
    vatIncluded: "IVA incluído",
    condition: {
      new: "Nova",
      used_tested: "Usada · testada",
      reconditioned: "Recondicionada",
    } as Record<ProductCondition, string>,
    serviceLevel: { standard: "Normal", express: "Expresso" } as Record<ServiceLevel, string>,
    orderStatus: {
      pending_payment: "A aguardar pagamento",
      paid: "Pagamento confirmado",
      processing: "Em preparação",
      shipped: "Enviada",
      delivered: "Entregue",
      cancelled: "Cancelada",
      refunded: "Reembolsada",
    } as Record<OrderStatus, string>,
    shipmentStatus: {
      label_created: "Etiqueta criada",
      in_transit: "Em trânsito",
      out_for_delivery: "Em distribuição",
      delivered: "Entregue",
      exception: "Ocorrência",
      returned: "Devolvida",
    } as Record<string, string>,
    stock: { out: "Sem stock", low: (n: number) => `Últimas ${n} un.`, in: "Em stock" },
    warranty: (m: number) => `${m} meses garantia`,
    delivery: (min: number | null, max: number | null) => {
      if (min == null && max == null) return "";
      if (min === max || max == null) return `${min} dia${min === 1 ? "" : "s"} úteis`;
      return `${min}–${max} dias úteis`;
    },
    years: (from: number | null, to: number | null) =>
      from && to ? `${from}–${to}` : from ? `desde ${from}` : to ? `até ${to}` : "—",
    date: (iso: string) => new Date(iso).toLocaleDateString("pt-PT"),
    dateLong: (iso: string) => new Date(iso).toLocaleDateString("pt-PT", { dateStyle: "long" }),
    dateTime: (iso: string) => new Date(iso).toLocaleString("pt-PT"),
    country: (code: string | null | undefined) => (code ? (regionNames.pt?.of(code) ?? code) : "—"),
    category: (slug: string | null | undefined, ptName: string) => ptName || slug || "",
    categoryLabel: (slug: string | null | undefined) => slug ?? "",
    categoryDescription: (_slug: string, pt: string | null) => pt ?? "",
    productTitle: (p: TitleInput) => p.title,
    msg: (s: string) => s,
    optional: "opcional",
    loading: "A carregar",
    close: "Fechar",
    back: "Voltar",
    yes: "Sim",
    no: "Não",
  },
  en: {
    intl: "en-GB",
    price: money.en,
    priceOnRequest: "Price on request",
    priceLabel: (c: number | null | undefined) => (c == null ? "Price on request" : money.en(c)),
    vatIncluded: "VAT included",
    condition: {
      new: "New",
      used_tested: "Used · tested",
      reconditioned: "Reconditioned",
    },
    serviceLevel: { standard: "Standard", express: "Express" },
    orderStatus: {
      pending_payment: "Awaiting payment",
      paid: "Payment confirmed",
      processing: "Being prepared",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
      refunded: "Refunded",
    },
    shipmentStatus: {
      label_created: "Label created",
      in_transit: "In transit",
      out_for_delivery: "Out for delivery",
      delivered: "Delivered",
      exception: "Exception",
      returned: "Returned",
    },
    stock: { out: "Out of stock", low: (n: number) => `Last ${n} left`, in: "In stock" },
    warranty: (m: number) => `${m}-month warranty`,
    delivery: (min: number | null, max: number | null) => {
      if (min == null && max == null) return "";
      if (min === max || max == null) return `${min} working day${min === 1 ? "" : "s"}`;
      return `${min}–${max} working days`;
    },
    years: (from: number | null, to: number | null) =>
      from && to ? `${from}–${to}` : from ? `from ${from}` : to ? `until ${to}` : "—",
    date: (iso: string) => new Date(iso).toLocaleDateString("en-GB"),
    dateLong: (iso: string) => new Date(iso).toLocaleDateString("en-GB", { dateStyle: "long" }),
    dateTime: (iso: string) => new Date(iso).toLocaleString("en-GB"),
    country: (code: string | null | undefined) => (code ? (regionNames.en?.of(code) ?? code) : "—"),
    category: (slug: string | null | undefined, ptName: string) =>
      (slug && CATEGORY_EN[slug]?.name) || ptName || slug || "",
    categoryLabel: (slug: string | null | undefined) => (slug && CATEGORY_EN[slug]?.label) || "ECU",
    categoryDescription: (slug: string, pt: string | null) => CATEGORY_EN[slug]?.description ?? pt ?? "",
    // Os títulos são gerados em PT na BD; em inglês recompomos a partir dos dados.
    productTitle: (p: TitleInput) => {
      const label = (p.category?.slug && CATEGORY_EN[p.category.slug]?.label) || "ECU";
      const brands = p.brands.join(" / ");
      const who = p.manufacturer?.name ?? brands;
      const code = p.label_code ? ` · ${p.label_code}` : "";
      const tail = p.manufacturer && brands ? ` — ${brands}` : "";
      return `${label} ${who} ${primaryRef(p)}${code}${tail}`.replace(/\s+/g, " ").trim();
    },
    msg: (s: string) => MESSAGES_EN[s] ?? s,
    optional: "optional",
    loading: "Loading",
    close: "Close",
    back: "Back",
    yes: "Yes",
    no: "No",
  },
});
