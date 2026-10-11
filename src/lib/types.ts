// Tipos das respostas JSON das funções SQL públicas (ver supabase/migrations).

export type ProductCondition = "new" | "used_tested" | "reconditioned";
export type ReferenceType = "hardware" | "software" | "oem" | "alternative";
export type ServiceLevel = "standard" | "express";

export type ProductReference = { type: ReferenceType; value: string };

export type ProductCard = {
  id: string;
  slug: string;
  title: string;
  ecu_family: string | null;
  /** Código da etiqueta (ex.: "DR", "DPC-530") — distingue variantes da mesma referência */
  label_code: string | null;
  condition: ProductCondition;
  warranty_months: number;
  /** null = preço sob consulta */
  price_cents: number | null;
  stock_quantity: number;
  weight_grams: number;
  manufacturer: { slug: string; name: string } | null;
  category: { slug: string; name: string; short_code: string | null } | null;
  references: ProductReference[];
  image: string | null;
  brands: string[];
};

export type CompatibilityRow = {
  brand: string;
  brand_slug: string;
  model: string;
  generation: string | null;
  year_from: number | null;
  year_to: number | null;
  engine_code: string | null;
  engine: string | null;
  fuel: string | null;
  notes: string | null;
};

export type ProductDetail = ProductCard & {
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
  images: { path: string; alt: string | null }[];
  compatibility: CompatibilityRow[];
  related: ProductCard[];
};

export type SearchResult = { total: number; items: ProductCard[] };

export type Facet = { slug: string; name: string; count: number };
export type CategoryFacet = Facet & { short_code: string | null; description: string | null };

export type CatalogFacets = {
  total: number;
  categories: CategoryFacet[];
  manufacturers: Facet[];
  brands: Facet[];
};

export type Suggestion = {
  slug: string;
  title: string;
  reference: string;
  manufacturer: string | null;
};

export type ShippingOption = {
  id: string;
  carrier: string;
  service_level: ServiceLevel;
  price_cents: number;
  est_days_min: number | null;
  est_days_max: number | null;
};

export type TrackedOrder = {
  order_code: string;
  status: OrderStatus;
  payment_status: string;
  created_at: string;
  total_cents: number;
  currency: string;
  destination_country: string | null;
  items: { title: string; reference: string; quantity: number }[];
  shipments: {
    carrier: string;
    service_level: ServiceLevel;
    tracking_number: string | null;
    tracking_url: string | null;
    status: string;
    shipped_at: string | null;
    delivered_at: string | null;
    events: { status: string; description: string | null; location: string | null; occurred_at: string }[];
  }[];
};

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
