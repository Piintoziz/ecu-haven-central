// Backoffice — operações com a sessão do staff. A autorização é feita pela RLS
// (políticas "staff …") e pelas verificações nas funções SQL; esta camada só
// formata pedidos e respostas.
import { getAuthClient } from "./auth";
import { normalizeReference } from "./format";
import type { OrderStatus, ProductCondition, ReferenceType, ServiceLevel } from "./types";

export const ADMIN_PAGE_SIZE = 25;

const KNOWN_ERRORS: [string, string][] = [
  ["order_cancelled_final", "Uma encomenda cancelada não pode ser reaberta."],
  ["stock_quantity", "O stock não pode ficar negativo."],
  ["products_ref_key_uidx", "Já existe uma peça com esta referência e este código."],
  ["duplicate key", "Já existe um registo com estes dados (referência repetida)."],
  ["products_slug_check", "Slug inválido: use apenas minúsculas, números e hífenes."],
  ["tracking_url_check", "O link de tracking tem de começar por https://"],
];

function fail(context: string, message: string): never {
  console.error(`[admin] ${context}: ${message}`);
  const known = KNOWN_ERRORS.find(([needle]) => message.includes(needle));
  throw new Error(known ? known[1] : "A operação falhou. Verifique os dados e tente novamente.");
}

const sb = () => getAuthClient();

// --- Dashboard ----------------------------------------------------------------

export type AdminDashboard = {
  days: number;
  revenue_cents: number;
  orders_count: number;
  pending_payment: number;
  to_ship: number;
  active_products: number;
  stock_units: number;
  low_stock: number;
  out_of_stock: number;
  new_messages: number;
  /** peças publicadas sem preço ("sob consulta") */
  no_price: number;
  daily: { day: string; revenue_cents: number; orders: number }[];
  top_products: { reference: string; title: string; units: number; revenue_cents: number }[];
};

export async function getDashboard(days: number): Promise<AdminDashboard> {
  const { data, error } = await sb().rpc("admin_dashboard", { p_days: days });
  if (error) fail("dashboard", error.message);
  return data as AdminDashboard;
}

// --- Encomendas ---------------------------------------------------------------

export type ShipmentStatus =
  "label_created" | "in_transit" | "out_for_delivery" | "delivered" | "exception" | "returned";
export type PaymentStatus = "pending" | "authorized" | "captured" | "failed" | "refunded";

export type AdminOrderRow = {
  id: string;
  order_code: string;
  email: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_cents: number;
  created_at: string;
  service_level: ServiceLevel | null;
  shipping_address: { full_name: string; country_code: string } | null;
  order_items: { quantity: number }[];
};

export async function listOrders(opts: { status?: OrderStatus; q?: string; page?: number }) {
  const page = opts.page ?? 1;
  let query = sb()
    .from("orders")
    .select(
      "id, order_code, email, status, payment_status, total_cents, created_at, service_level, shipping_address, order_items(quantity)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE - 1);
  if (opts.status) query = query.eq("status", opts.status);
  const q = opts.q?.trim().replace(/[%_\\]/g, "");
  if (q) {
    query =
      /^ct-?/i.test(q) || /^[2-9A-HJ-NP-Z-]{5,}$/.test(q)
        ? query.ilike("order_code", `%${q.toUpperCase()}%`)
        : query.ilike("email", `%${q.toLowerCase()}%`);
  }
  const { data, error, count } = await query;
  if (error) fail("orders", error.message);
  return { rows: (data ?? []) as unknown as AdminOrderRow[], total: count ?? 0 };
}

export type AdminAddress = {
  full_name: string;
  company_name?: string;
  line1: string;
  line2?: string;
  postal_code: string;
  city: string;
  region?: string;
  country_code: string;
};

export type AdminShipment = {
  id: string;
  carrier: string;
  service_level: ServiceLevel;
  tracking_number: string | null;
  tracking_url: string | null;
  status: ShipmentStatus;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  shipment_events: {
    id: string;
    status: ShipmentStatus;
    description: string | null;
    location: string | null;
    occurred_at: string;
  }[];
};

export type AdminOrder = {
  id: string;
  order_code: string;
  user_id: string | null;
  email: string;
  phone: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  vat_rate: number;
  vat_cents: number;
  service_level: ServiceLevel | null;
  shipping_address: AdminAddress;
  billing_address: AdminAddress;
  company_name: string | null;
  vat_number: string | null;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
  shipping_rate: { carrier: string } | null;
  order_items: {
    id: string;
    product_id: string | null;
    title_snapshot: string;
    reference_snapshot: string;
    condition_snapshot: ProductCondition;
    unit_price_cents: number;
    quantity: number;
    product: { slug: string; stock_quantity: number } | null;
  }[];
  shipments: AdminShipment[];
};

export async function getOrder(id: string): Promise<AdminOrder | null> {
  const { data, error } = await sb()
    .from("orders")
    .select(
      `*, shipping_rate:shipping_rates(carrier),
       order_items(id, product_id, title_snapshot, reference_snapshot, condition_snapshot, unit_price_cents, quantity,
                   product:products(slug, stock_quantity)),
       shipments(*, shipment_events(id, status, description, location, occurred_at))`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) fail("order", error.message);
  if (!data) return null;
  const o = data as unknown as AdminOrder;
  o.shipments.sort((a, b) => a.created_at.localeCompare(b.created_at));
  for (const s of o.shipments)
    s.shipment_events.sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
  return o;
}

export async function updateOrderStatus(
  id: string,
  patch: { status?: OrderStatus; payment_status?: PaymentStatus },
) {
  const { error } = await sb().from("orders").update(patch).eq("id", id);
  if (error) fail("order status", error.message);
}

export async function createShipment(input: {
  order_id: string;
  carrier: string;
  service_level: ServiceLevel;
  tracking_number: string;
  tracking_url: string;
}) {
  const { error } = await sb()
    .from("shipments")
    .insert({
      order_id: input.order_id,
      carrier: input.carrier,
      service_level: input.service_level,
      tracking_number: input.tracking_number || null,
      tracking_url: input.tracking_url || null,
    });
  if (error) fail("shipment", error.message);
}

export async function addShipmentEvent(input: {
  shipment_id: string;
  status: ShipmentStatus;
  description: string;
  location: string;
  occurred_at: string;
}) {
  const { error } = await sb()
    .from("shipment_events")
    .insert({
      shipment_id: input.shipment_id,
      status: input.status,
      description: input.description || null,
      location: input.location || null,
      occurred_at: input.occurred_at,
    });
  if (error) fail("shipment event", error.message);
}

// --- Produtos & inventário ----------------------------------------------------
// Modelo simples (igual ao Excel da equipa): marca(s) · referência · código ·
// quantidade · preço opcional. Título, URL, fabricante, família, categoria por
// omissão e textos para o Google são calculados na BD (private.refresh_product).

export type ProductFilter = "all" | "active" | "inactive" | "noprice" | "low" | "out";

export type AdminProductRow = {
  id: string;
  slug: string;
  title: string;
  label_code: string | null;
  condition: ProductCondition;
  price_cents: number | null;
  stock_quantity: number;
  is_active: boolean;
  updated_at: string;
  category: { name: string; short_code: string | null } | null;
  product_references: { type: ReferenceType; value: string; is_primary: boolean }[];
  product_brands: { brand: { name: string } | null }[];
};

async function productIdsMatching(q: string): Promise<string[]> {
  const norm = normalizeReference(q);
  const ids = new Set<string>();
  const [refs, titles] = await Promise.all([
    norm.length >= 2
      ? sb()
          .from("product_references")
          .select("product_id")
          .ilike("value_normalized", `%${norm}%`)
          .limit(500)
      : Promise.resolve({ data: [] as { product_id: string }[], error: null }),
    sb()
      .from("products")
      .select("id")
      .or(`title.ilike.%${q}%,label_code.ilike.${q}`)
      .limit(500),
  ]);
  for (const r of (refs.data ?? []) as { product_id: string }[]) ids.add(r.product_id);
  for (const r of (titles.data ?? []) as { id: string }[]) ids.add(r.id);
  return [...ids];
}

export async function listProducts(opts: { q?: string; filter?: ProductFilter; page?: number }) {
  const page = opts.page ?? 1;
  let query = sb()
    .from("products")
    .select(
      `id, slug, title, label_code, condition, price_cents, stock_quantity, is_active, updated_at,
       category:categories(name, short_code),
       product_references(type, value, is_primary),
       product_brands(brand:vehicle_brands(name))`,
      { count: "exact" },
    )
    .order("updated_at", { ascending: false })
    .range((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE - 1);

  switch (opts.filter) {
    case "active":
      query = query.eq("is_active", true);
      break;
    case "inactive":
      query = query.eq("is_active", false);
      break;
    case "noprice":
      query = query.is("price_cents", null);
      break;
    case "low":
      query = query.eq("is_active", true).eq("stock_quantity", 1);
      break;
    case "out":
      query = query.eq("is_active", true).eq("stock_quantity", 0);
      break;
  }

  // Só caracteres de referência/título: evita injetar sintaxe nos filtros do PostgREST.
  const q = opts.q?.replace(/[^\p{L}\p{N} .\-/]/gu, "").trim();
  if (q) {
    const ids = await productIdsMatching(q);
    if (ids.length === 0) return { rows: [] as AdminProductRow[], total: 0 };
    query = query.in("id", ids.slice(0, 500));
  }

  const { data, error, count } = await query;
  if (error) fail("products", error.message);
  return { rows: (data ?? []) as unknown as AdminProductRow[], total: count ?? 0 };
}

export async function setProductActive(id: string, isActive: boolean) {
  const { error } = await sb().from("products").update({ is_active: isActive }).eq("id", id);
  if (error) fail("product active", error.message);
}

export async function adjustStock(input: {
  product_id: string;
  delta: number;
  note: string;
  actor_id: string;
  reason?: "adjustment" | "return";
}) {
  const { error } = await sb()
    .from("inventory_movements")
    .insert({
      product_id: input.product_id,
      delta: input.delta,
      reason: input.reason ?? "adjustment",
      note: input.note || null,
      actor_id: input.actor_id,
    });
  if (error) fail("stock", error.message);
}

export type InventoryMovement = {
  id: string;
  delta: number;
  reason: "import" | "sale" | "adjustment" | "return" | "cancellation";
  note: string | null;
  created_at: string;
};

export async function listMovements(productId: string): Promise<InventoryMovement[]> {
  const { data, error } = await sb()
    .from("inventory_movements")
    .select("id, delta, reason, note, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) fail("movements", error.message);
  return (data ?? []) as InventoryMovement[];
}

export type Lookup = { id: string; slug: string; name: string };

export async function getLookups() {
  const [b, c] = await Promise.all([
    sb().from("vehicle_brands").select("id, slug, name").order("name"),
    sb().from("categories").select("id, slug, name").order("position"),
  ]);
  if (b.error || c.error) fail("lookups", (b.error ?? c.error)!.message);
  return { brands: (b.data ?? []) as Lookup[], categories: (c.data ?? []) as Lookup[] };
}

/** O que a equipa preenche. Tudo o resto é automático. */
export type ProductForm = {
  brand_ids: string[];
  reference: string;
  label_code: string;
  other_refs: string[];
  quantity: number;
  /** null = sob consulta */
  price_cents: number | null;
  condition: ProductCondition;
  /** "" = automática (detetada pela referência) */
  category_id: string;
  is_active: boolean;
  description: string;
};

export type AdminProduct = ProductForm & {
  id: string;
  slug: string;
  title: string;
  stock_quantity: number;
  manufacturer: { name: string } | null;
  ecu_family: string | null;
  primary_ref_id: string | null;
  images: { id: string; storage_path: string; alt: string | null; position: number }[];
};

type ProductQueryRow = {
  id: string;
  slug: string;
  title: string;
  label_code: string | null;
  stock_quantity: number;
  price_cents: number | null;
  condition: ProductCondition;
  category_id: string | null;
  is_active: boolean;
  description: string | null;
  ecu_family: string | null;
  manufacturer: { name: string } | null;
  references: { id: string; value: string; is_primary: boolean; created_at: string }[];
  brands: { vehicle_brand_id: string }[];
  images: { id: string; storage_path: string; alt: string | null; position: number }[];
};

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  const { data, error } = await sb()
    .from("products")
    .select(
      `id, slug, title, label_code, stock_quantity, price_cents, condition, category_id, is_active,
       description, ecu_family, manufacturer:ecu_manufacturers(name),
       references:product_references(id, value, is_primary, created_at),
       brands:product_brands(vehicle_brand_id),
       images:product_images(id, storage_path, alt, position)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) fail("product", error.message);
  if (!data) return null;
  const p = data as unknown as ProductQueryRow;
  const refs = [...p.references].sort(
    (a, b) =>
      Number(b.is_primary) - Number(a.is_primary) || a.created_at.localeCompare(b.created_at),
  );
  const primary = refs[0] ?? null;
  const codeNorm = normalizeReference(p.label_code ?? "");
  const others = refs.slice(1).filter((r) => normalizeReference(r.value) !== codeNorm);
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    stock_quantity: p.stock_quantity,
    manufacturer: p.manufacturer,
    ecu_family: p.ecu_family,
    brand_ids: p.brands.map((b) => b.vehicle_brand_id),
    reference: primary?.value ?? "",
    primary_ref_id: primary?.id ?? null,
    label_code: p.label_code ?? "",
    other_refs: others.map((r) => r.value),
    quantity: p.stock_quantity,
    price_cents: p.price_cents,
    condition: p.condition,
    category_id: p.category_id ?? "",
    is_active: p.is_active,
    description: p.description ?? "",
    images: [...p.images].sort((a, b) => a.position - b.position),
  };
}

/** Guarda a ficha simples e deixa a BD calcular título, URL, fabricante, etc. */
export async function saveProduct(input: {
  existing: AdminProduct | null;
  form: ProductForm;
  actorId: string;
}): Promise<string> {
  const client = sb();
  const { existing, form } = input;
  const code = form.label_code.trim() || null;
  const reference = form.reference.trim();
  let id = existing?.id ?? null;

  const base = {
    label_code: code,
    price_cents: form.price_cents,
    condition: form.condition,
    category_id: form.category_id || null,
    is_active: form.is_active,
    description: form.description.trim() || null,
  };

  if (id) {
    const { error } = await client.from("products").update(base).eq("id", id);
    if (error) fail("save product", error.message);
    if (existing!.primary_ref_id) {
      const { error: e2 } = await client
        .from("product_references")
        .update({ value: reference })
        .eq("id", existing!.primary_ref_id);
      if (e2) fail("primary ref", e2.message);
    }
  } else {
    // URL provisório: a BD gera o definitivo (marca-referência-código) no refresh.
    const tempSlug = `p-${crypto.randomUUID().replace(/-/g, "")}`;
    const { data, error } = await client
      .from("products")
      .insert({ ...base, slug: tempSlug, title: reference })
      .select("id")
      .single();
    if (error) fail("create product", error.message);
    id = (data as { id: string }).id;
  }

  if (!existing?.primary_ref_id) {
    const { error } = await client
      .from("product_references")
      .insert({ product_id: id, type: "oem", value: reference, is_primary: true });
    if (error) fail("primary ref insert", error.message);
  }

  // Outras referências (+ código pesquisável): substitui o conjunto
  const wanted = new Map<string, string>();
  for (const r of form.other_refs) {
    const n = normalizeReference(r);
    if (n && n !== normalizeReference(reference)) wanted.set(n, r.trim());
  }
  if (code && normalizeReference(code).length >= 4) wanted.set(normalizeReference(code), code);
  const { data: current } = await client
    .from("product_references")
    .select("id, value")
    .eq("product_id", id)
    .eq("is_primary", false);
  const currentRefs = (current ?? []) as { id: string; value: string }[];
  const toDelete = currentRefs.filter((r) => !wanted.has(normalizeReference(r.value)));
  const have = new Set(currentRefs.map((r) => normalizeReference(r.value)));
  if (toDelete.length) {
    const { error } = await client
      .from("product_references")
      .delete()
      .in(
        "id",
        toDelete.map((r) => r.id),
      );
    if (error) fail("refs delete", error.message);
  }
  const toInsert = [...wanted].filter(([n]) => !have.has(n)).map(([, v]) => v);
  if (toInsert.length) {
    const { error } = await client
      .from("product_references")
      .insert(toInsert.map((value) => ({ product_id: id, type: "alternative", value })));
    if (error) fail("refs insert", error.message);
  }

  // Marcas do veículo: substitui o conjunto
  const { error: delBrands } = await client.from("product_brands").delete().eq("product_id", id);
  if (delBrands) fail("brands delete", delBrands.message);
  if (form.brand_ids.length) {
    const { error } = await client
      .from("product_brands")
      .insert(form.brand_ids.map((vehicle_brand_id) => ({ product_id: id, vehicle_brand_id })));
    if (error) fail("brands insert", error.message);
  }

  // Quantidade: regista a diferença no histórico de movimentos
  const before = existing?.stock_quantity ?? 0;
  if (form.quantity !== before) {
    await adjustStock({
      product_id: id!,
      delta: form.quantity - before,
      note: existing ? "Atualizado no backoffice" : "Stock inicial",
      actor_id: input.actorId,
    });
  }

  const { error: refreshError } = await client.rpc("admin_refresh_product", { p_id: id });
  if (refreshError) fail("refresh", refreshError.message);
  return id!;
}

const IMAGE_TYPES: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export async function uploadProductImage(
  productId: string,
  file: File,
  position: number,
  alt: string,
) {
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new Error("Formato não suportado. Use WebP, JPEG ou PNG.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Imagem acima de 5 MB.");
  // Nome gerado aqui (UUID) — nunca o nome do ficheiro do utilizador.
  const path = `${crypto.randomUUID()}.${ext}`;
  const client = sb();
  const { error: upErr } = await client.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (upErr) fail("upload", upErr.message);
  const { error } = await client
    .from("product_images")
    .insert({ product_id: productId, storage_path: path, alt: alt || null, position });
  if (error) {
    await client.storage.from("product-images").remove([path]);
    fail("image row", error.message);
  }
}

export async function deleteProductImage(image: { id: string; storage_path: string }) {
  const client = sb();
  const { error } = await client.from("product_images").delete().eq("id", image.id);
  if (error) fail("image delete", error.message);
  await client.storage.from("product-images").remove([image.storage_path]);
}

// --- Importação do Excel de stock ---------------------------------------------

export type StockImportRow = {
  brands: string[];
  reference: string;
  alt_refs: string[];
  code: string;
  quantity: number;
  price_eur?: string;
  category?: string;
  notes?: string;
  condition?: ProductCondition;
  active?: boolean;
};

export type ImportResult = {
  ok: number;
  created: number;
  failed: number;
  errors: { row: number; error: string }[];
};

export async function importStockBatch(rows: StockImportRow[]): Promise<ImportResult> {
  const { data, error } = await sb().rpc("import_stock", { p_rows: rows });
  if (error) fail("import", error.message);
  return data as ImportResult;
}

/** Peças que não vêm no ficheiro ficam com stock 0 (sincronização total). */
export async function zeroMissingStock(keys: string[]): Promise<number> {
  const { data, error } = await sb().rpc("zero_missing_stock", { p_keys: keys });
  if (error) fail("zero stock", error.message);
  return data as number;
}

// --- Mensagens de contacto ----------------------------------------------------

export type ContactStatus = "new" | "in_progress" | "answered" | "spam";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  product_reference: string | null;
  vin: string | null;
  status: ContactStatus;
  created_at: string;
};

export async function listMessages(opts: { status?: ContactStatus; page?: number }) {
  const page = opts.page ?? 1;
  let query = sb()
    .from("contact_messages")
    .select(
      "id, name, email, phone, subject, message, product_reference, vin, status, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE - 1);
  if (opts.status) query = query.eq("status", opts.status);
  const { data, error, count } = await query;
  if (error) fail("messages", error.message);
  return { rows: (data ?? []) as ContactMessage[], total: count ?? 0 };
}

export async function setMessageStatus(id: string, status: ContactStatus) {
  const { error } = await sb().from("contact_messages").update({ status }).eq("id", id);
  if (error) fail("message status", error.message);
}

// --- Definições da loja -------------------------------------------------------

export type BankTransferSettings = { holder?: string; iban?: string; bic?: string; bank?: string };
export type StoreSettings = {
  admin_email: string;
  vat_rate: number;
  bank_transfer: BankTransferSettings;
};

export async function getSettings(): Promise<StoreSettings> {
  const { data, error } = await sb().from("store_settings").select("key, value");
  if (error) fail("settings", error.message);
  const map = Object.fromEntries(
    ((data ?? []) as { key: string; value: unknown }[]).map((r) => [r.key, r.value]),
  );
  return {
    admin_email: typeof map.admin_email === "string" ? map.admin_email : "",
    vat_rate: Number(map.vat_rate ?? 23),
    bank_transfer: (map.bank_transfer as BankTransferSettings | undefined) ?? {},
  };
}

/** Só administradores (RLS "store_settings: admin atualiza"). */
export async function updateSettings(s: StoreSettings) {
  const client = sb();
  const updates = [
    client
      .from("store_settings")
      .update({ value: s.admin_email })
      .eq("key", "admin_email")
      .select("key"),
    client.from("store_settings").update({ value: s.vat_rate }).eq("key", "vat_rate").select("key"),
    client
      .from("store_settings")
      .update({ value: s.bank_transfer })
      .eq("key", "bank_transfer")
      .select("key"),
  ];
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) fail("settings update", failed.error.message);
  // RLS sem permissão devolve 0 linhas em vez de erro.
  if (results.some((r) => !r.data?.length))
    throw new Error("Só administradores podem alterar as definições.");
}
