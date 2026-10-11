// Transportadoras. Hoje: lista para o backoffice + links de tracking públicos.
// Próxima fase: cada transportadora implementa CarrierProvider no servidor
// (cotação em tempo real, criação de etiqueta e webhooks de tracking), e as
// tabelas shipping_rates passam a ser o fallback quando a API não responde.
import type { ServiceLevel } from "./types";

export type CarrierId =
  "ctt" | "dhl" | "ups" | "dpd" | "gls" | "fedex" | "seur" | "nacex" | "other";

type Carrier = {
  id: CarrierId;
  name: string;
  /** URL público de tracking; {n} é substituído pelo número de envio. */
  trackingUrl?: string;
};

export const CARRIERS: Carrier[] = [
  {
    id: "ctt",
    name: "CTT Expresso",
    trackingUrl: "https://www.ctt.pt/feapl_2/app/open/objectSearch/objectSearch.jspx?objects={n}",
  },
  {
    id: "dhl",
    name: "DHL Express",
    trackingUrl: "https://www.dhl.com/pt-pt/home/tracking.html?tracking-id={n}",
  },
  { id: "ups", name: "UPS", trackingUrl: "https://www.ups.com/track?tracknum={n}" },
  { id: "dpd", name: "DPD", trackingUrl: "https://tracking.dpd.de/status/pt_PT/parcel/{n}" },
  { id: "gls", name: "GLS", trackingUrl: "https://gls-group.com/PT/pt/seguir-envio?match={n}" },
  { id: "fedex", name: "FedEx", trackingUrl: "https://www.fedex.com/fedextrack/?trknbr={n}" },
  {
    id: "seur",
    name: "SEUR",
    trackingUrl: "https://www.seur.com/livetracking/?segOnlineIdentificador={n}",
  },
  { id: "nacex", name: "Nacex" },
  { id: "other", name: "Outra" },
];

export function carrierByName(name: string): Carrier | undefined {
  const n = name.trim().toLowerCase();
  return CARRIERS.find((c) => c.name.toLowerCase() === n || n.startsWith(c.id));
}

export function buildTrackingUrl(carrierName: string, trackingNumber: string): string {
  const tpl = carrierByName(carrierName)?.trackingUrl;
  const n = trackingNumber.trim();
  if (!tpl || !n) return "";
  return tpl.replace("{n}", encodeURIComponent(n));
}

/** Contrato a implementar por cada integração de transportadora (lado servidor). */
export interface CarrierProvider {
  id: CarrierId;
  quote(input: {
    countryCode: string;
    postalCode: string;
    weightGrams: number;
    serviceLevel: ServiceLevel;
  }): Promise<{ priceCents: number; estDaysMin: number; estDaysMax: number } | null>;
  createLabel(input: {
    orderCode: string;
    weightGrams: number;
    serviceLevel: ServiceLevel;
  }): Promise<{
    trackingNumber: string;
    labelPdfUrl: string;
  }>;
  /** Valida a assinatura do webhook e devolve eventos normalizados. */
  parseWebhook(
    request: Request,
  ): Promise<
    {
      trackingNumber: string;
      status: string;
      description: string;
      location: string | null;
      occurredAt: string;
    }[]
  >;
}
