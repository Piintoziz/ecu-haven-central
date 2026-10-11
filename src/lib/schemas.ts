import { z } from "zod";
import { COUNTRY_CODES } from "./countries";

// Schemas partilhados: validados no browser (UX) e OBRIGATORIAMENTE no servidor.

const text = (max: number) => z.string().trim().max(max);
const required = (max: number, msg = "Campo obrigatório") => text(max).min(1, msg);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .email("Email inválido");

export const phoneSchema = z
  .string()
  .trim()
  .max(32)
  .regex(/^\+?[0-9 ()-]{6,}$/, "Telefone inválido");

export const addressSchema = z.object({
  full_name: required(120),
  company_name: text(160).optional().default(""),
  line1: required(200),
  line2: text(200).optional().default(""),
  postal_code: required(20),
  city: required(100),
  region: text(100).optional().default(""),
  country_code: z.string().refine((c) => COUNTRY_CODES.includes(c), "País não suportado"),
});

const localeSchema = z.enum(["pt", "en"]).optional().default("pt");

export const orderInputSchema = z
  .object({
    items: z
      .array(
        z.object({
          product_id: z.string().uuid(),
          quantity: z.number().int().min(1).max(10),
        }),
      )
      .min(1, "O carrinho está vazio")
      .max(20)
      .refine((items) => new Set(items.map((i) => i.product_id)).size === items.length, {
        message: "Artigos duplicados",
      }),
    email: emailSchema,
    phone: phoneSchema,
    vat_number: text(32)
      .regex(/^[A-Za-z0-9 .-]*$/, "NIF/VAT inválido")
      .optional()
      .default(""),
    shipping_address: addressSchema,
    billing_same_as_shipping: z.boolean(),
    billing_address: addressSchema.optional(),
    shipping_rate_id: z.string().uuid("Escolha um método de envio"),
    notes: text(1000).optional().default(""),
    accept_terms: z.literal(true, { errorMap: () => ({ message: "Tem de aceitar os termos" }) }),
    // anti-bot
    website: z.string().max(0).optional().default(""),
    turnstile_token: z.string().max(4096).optional(),
    // Sessão do cliente (opcional). O servidor valida o JWT antes de associar a encomenda.
    access_token: z.string().max(4096).optional(),
    // Idioma dos emails da encomenda
    locale: localeSchema,
  })
  .refine((v) => v.billing_same_as_shipping || !!v.billing_address, {
    message: "Morada de faturação em falta",
    path: ["billing_address"],
  });

export type OrderInput = z.input<typeof orderInputSchema>;

export const ORDER_CODE_RE = /^CT-[2-9A-HJ-NP-Z]{5}-[2-9A-HJ-NP-Z]{5}$/;

export const trackInputSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(ORDER_CODE_RE, "Código inválido. Formato: CT-XXXXX-XXXXX"),
});

export const contactInputSchema = z.object({
  name: required(120),
  company: text(160).optional().default(""),
  email: emailSchema,
  phone: z.union([phoneSchema, z.literal("")]).optional().default(""),
  product_reference: text(64)
    .regex(/^[A-Za-z0-9 .\-/]*$/, "Referência inválida")
    .optional()
    .default(""),
  vin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^([A-HJ-NPR-Z0-9]{17})?$/, "VIN deve ter 17 caracteres")
    .optional()
    .default(""),
  message: required(5000).min(10, "Descreva o pedido com um pouco mais de detalhe"),
  website: z.string().max(0).optional().default(""),
  turnstile_token: z.string().max(4096).optional(),
  locale: localeSchema,
});

export type ContactInput = z.input<typeof contactInputSchema>;

// --- Contas -------------------------------------------------------------------

export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres")
  .regex(/[A-Za-z]/, "Inclua pelo menos uma letra")
  .regex(/[0-9]/, "Inclua pelo menos um número");

export const signUpSchema = z.object({
  full_name: required(120),
  email: emailSchema,
  password: passwordSchema,
  accept_terms: z.literal(true, { errorMap: () => ({ message: "Tem de aceitar os termos" }) }),
});

export const profileSchema = z.object({
  full_name: required(120),
  phone: z.union([phoneSchema, z.literal("")]).default(""),
  company_name: text(160).default(""),
  vat_number: text(32).regex(/^[A-Za-z0-9 .-]*$/, "NIF/VAT inválido").default(""),
  customer_type: z.enum(["b2c", "b2b"]),
});

export type ProfileInput = z.infer<typeof profileSchema>;

// Os parâmetros de pesquisa chegam sempre como texto (ver parseSearch em router.tsx),
// para que referências como "0281016000" não sejam convertidas em números.
const slugParam = z.string().regex(/^[a-z0-9-]{1,60}$/).optional().catch(undefined);

export const catalogSearchSchema = z.object({
  q: z
    .string()
    .trim()
    .max(80)
    .regex(/^[\p{L}\p{N} .\-/+]*$/u)
    .optional()
    .catch(undefined),
  categoria: slugParam,
  fabricante: slugParam,
  marca: slugParam,
  estado: z.enum(["new", "used_tested", "reconditioned"]).optional().catch(undefined),
  stock: z
    .preprocess((v) => v === true || v === "1" || v === "true", z.boolean())
    .optional()
    .catch(undefined),
  ordem: z.enum(["relevance", "price_asc", "price_desc", "newest"]).optional().catch(undefined),
  pagina: z.coerce.number().int().min(1).max(500).optional().catch(undefined),
});

export type CatalogSearch = z.infer<typeof catalogSearchSchema>;
