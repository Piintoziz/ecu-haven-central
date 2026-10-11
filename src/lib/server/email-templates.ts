// Templates dos emails transacionais (HTML simples com estilos inline + texto).
// Todos os valores dinâmicos passam por esc(): o payload vem da BD mas pode
// conter texto escrito pelo cliente (nome, assunto).
// Emails ao cliente saem no idioma da encomenda/contacto (pt/en); os do admin em PT.
import { SITE_NAME, SITE_URL } from "../env";
import { common } from "../i18n/dict/common";
import type { OrderStatus, ServiceLevel } from "../types";

export type OutboxRow = {
  id: string;
  type:
    | "contact_received"
    | "contact_admin"
    | "order_confirmation"
    | "order_admin_new_sale"
    | "shipment_update"
    | "order_status_update";
  to_email: string;
  payload: Record<string, unknown>;
};

export type BankDetails = { holder?: string; iban?: string; bank?: string; bic?: string };

export type RenderedEmail = { subject: string; html: string; text: string };

export type EmailLocale = "pt" | "en";

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

type Line = { title: string; reference: string; quantity: number; unit_price_cents?: number };

const T = {
  pt: {
    footer: "Centralinas testadas em bancada",
    shipping: "Envio",
    total: "Total",
    vatIncluded: "IVA incluído",
    hello: (n: string) => `Olá ${n},`,
    contactSubject: "Recebemos o seu pedido",
    contactThanks: "Obrigado pelo contacto. A nossa equipa técnica responde normalmente em menos de 24 horas úteis.",
    contactThanksText: "Obrigado pelo contacto. Respondemos normalmente em menos de 24 horas úteis.",
    contactAbout: "Assunto",
    contactRef: (ref: string) => `Pedido sobre ${ref}`,
    contactGeneric: "Pedido de contacto",
    searchRef: "Pesquisar referência",
    orderSubject: (c: string) => `Encomenda ${c} registada`,
    orderTitle: "Obrigado pela sua encomenda",
    orderIntro: (c: string) => `Registámos a encomenda ${c}. Guarde este código para acompanhar o estado.`,
    bankTitle: "Pagamento por transferência bancária",
    amount: "Montante",
    holder: "Titular",
    reference: "Descritivo",
    bankWarn: "Indique o código da encomenda no descritivo. Enviamos assim que o pagamento for confirmado.",
    bankLater: "Vai receber os dados de pagamento num email separado. Enviamos assim que o pagamento for confirmado.",
    transfer: "Transferência",
    track: "Acompanhar encomenda",
    trackText: "Acompanhar",
    order: "Encomenda",
    statusExtra: {
      paid: "Recebemos o pagamento. A peça segue agora para verificação final e embalagem.",
      processing: "A sua encomenda está a ser preparada e testada antes do envio.",
      shipped: "A encomenda foi entregue à transportadora.",
      delivered: "A encomenda foi entregue. Qualquer questão técnica, responda a este email.",
      cancelled: "A encomenda foi cancelada. Se já tinha pago, o reembolso é processado em até 5 dias úteis.",
      refunded: "O reembolso foi emitido. Pode demorar alguns dias a aparecer na sua conta.",
    } as Partial<Record<OrderStatus, string>>,
    seeStatus: "Ver estado",
    shipped: "enviada",
    shippedTitle: "A sua encomenda foi enviada",
    trackingNo: "Nº de seguimento",
    followShipment: "Seguir envio",
  },
  en: {
    footer: "Bench-tested ECUs",
    shipping: "Shipping",
    total: "Total",
    vatIncluded: "VAT included",
    hello: (n: string) => `Hello ${n},`,
    contactSubject: "We've received your request",
    contactThanks: "Thank you for getting in touch. Our technical team usually replies within 24 working hours.",
    contactThanksText: "Thank you for getting in touch. We usually reply within 24 working hours.",
    contactAbout: "Subject",
    contactRef: (ref: string) => `Request about ${ref}`,
    contactGeneric: "Contact request",
    searchRef: "Search a reference",
    orderSubject: (c: string) => `Order ${c} placed`,
    orderTitle: "Thank you for your order",
    orderIntro: (c: string) => `We've registered order ${c}. Keep this code to track its status.`,
    bankTitle: "Payment by bank transfer",
    amount: "Amount",
    holder: "Account holder",
    reference: "Reference",
    bankWarn: "Include the order code in the transfer reference. We ship as soon as payment is confirmed.",
    bankLater: "You'll receive the payment details in a separate email. We ship as soon as payment is confirmed.",
    transfer: "Bank transfer",
    track: "Track order",
    trackText: "Track",
    order: "Order",
    statusExtra: {
      paid: "We've received your payment. The part now goes through final checks and packing.",
      processing: "Your order is being prepared and tested before shipping.",
      shipped: "Your order has been handed to the carrier.",
      delivered: "Your order has been delivered. For any technical question, just reply to this email.",
      cancelled: "Your order has been cancelled. If you had already paid, the refund is processed within 5 working days.",
      refunded: "The refund has been issued. It may take a few days to appear in your account.",
    } as Partial<Record<OrderStatus, string>>,
    seeStatus: "View status",
    shipped: "shipped",
    shippedTitle: "Your order has been shipped",
    trackingNo: "Tracking number",
    followShipment: "Track shipment",
  },
};

function layout(locale: EmailLocale, title: string, body: string, cta?: { href: string; label: string }): string {
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title></head>
<body style="margin:0;background:#f4f4f5;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#18181b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e4e4e7">
<tr><td style="background:#1c1c1c;padding:18px 24px"><span style="color:#ffffff;font-weight:800;letter-spacing:.5px;font-size:15px">${esc(SITE_NAME.toUpperCase())}</span><span style="color:#f97316;font-family:Consolas,monospace;font-size:11px;margin-left:8px">ECU · ABS · SRS · TCU</span></td></tr>
<tr><td style="padding:28px 24px 8px"><h1 style="margin:0 0 12px;font-size:20px;line-height:1.3">${esc(title)}</h1>${body}</td></tr>
${cta ? `<tr><td style="padding:8px 24px 28px"><a href="${esc(cta.href)}" style="display:inline-block;background:#f97316;color:#111;font-weight:700;text-decoration:none;padding:11px 18px;border-radius:6px;font-size:14px">${esc(cta.label)}</a></td></tr>` : ""}
<tr><td style="padding:16px 24px;border-top:1px solid #e4e4e7;font-size:12px;color:#71717a">${esc(SITE_NAME)} · ${esc(T[locale].footer)} · <a href="${esc(SITE_URL)}" style="color:#71717a">${esc(SITE_URL.replace(/^https?:\/\//, ""))}</a></td></tr>
</table></td></tr></table></body></html>`;
}

const p = (text: string) =>
  `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#3f3f46">${text}</p>`;
const code = (text: string) =>
  `<span style="font-family:Consolas,monospace;font-weight:700;background:#f4f4f5;padding:2px 6px;border-radius:4px">${esc(text)}</span>`;

function linesTable(
  locale: EmailLocale,
  lines: Line[],
  totals?: { subtotal: number; shipping: number; total: number; vat: number },
): string {
  const t = T[locale];
  const price = common[locale].price;
  const rows = lines
    .map(
      (
        l,
      ) => `<tr><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-size:13px"><span style="font-family:Consolas,monospace;font-weight:700">${esc(l.reference)}</span>${locale === "pt" ? `<br><span style="color:#71717a">${esc(l.title)}</span>` : ""}</td>
<td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-size:13px;text-align:right;white-space:nowrap">${esc(l.quantity)} ×${l.unit_price_cents != null ? ` ${esc(price(l.unit_price_cents))}` : ""}</td></tr>`,
    )
    .join("");
  const tot = totals
    ? `<tr><td style="padding:8px 0 2px;font-size:13px;color:#71717a">${esc(t.shipping)}</td><td style="text-align:right;font-size:13px;color:#71717a">${esc(price(totals.shipping))}</td></tr>
<tr><td style="padding:2px 0;font-size:15px;font-weight:700">${esc(t.total)}</td><td style="text-align:right;font-size:15px;font-weight:700">${esc(price(totals.total))}</td></tr>
<tr><td style="font-size:11px;color:#a1a1aa">${esc(t.vatIncluded)}</td><td style="text-align:right;font-size:11px;color:#a1a1aa">${esc(price(totals.vat))}</td></tr>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px">${rows}${tot}</table>`;
}

function trackUrl(orderCode: string, locale: EmailLocale) {
  return `${SITE_URL}/encomenda?codigo=${encodeURIComponent(orderCode)}${locale === "en" ? "&lang=en" : ""}`;
}

export function renderEmail(
  row: OutboxRow,
  ctx: { bank: BankDetails | null; locale?: EmailLocale },
): RenderedEmail {
  const d = row.payload;
  const orderCode = str(d.order_code);
  const locale: EmailLocale = ctx.locale ?? "pt";
  const t = T[locale];
  const c = common[locale];
  const formatPrice = c.price;
  const langQs = locale === "en" ? "?lang=en" : "";

  switch (row.type) {
    case "contact_received": {
      const subject = t.contactSubject;
      // O assunto guardado é em PT; para EN recompomos a partir da referência.
      const about =
        locale === "pt" ? str(d.subject) : d.reference ? t.contactRef(str(d.reference)) : t.contactGeneric;
      return {
        subject,
        html: layout(
          locale,
          subject,
          p(esc(t.hello(str(d.name)))) + p(esc(t.contactThanks)) + p(`${esc(t.contactAbout)}: <strong>${esc(about)}</strong>`),
          { href: `${SITE_URL}/catalogo${langQs}`, label: t.searchRef },
        ),
        text: `${t.hello(str(d.name))}\n\n${t.contactThanksText}\n${t.contactAbout}: ${about}\n\n${SITE_NAME}`,
      };
    }
    case "contact_admin": {
      const subject = `Novo contacto: ${str(d.subject)}`;
      return {
        subject,
        html: layout(
          "pt",
          "Novo pedido de contacto",
          p(`<strong>${esc(d.name)}</strong> &lt;${esc(d.email)}&gt;`) +
            (d.reference ? p(`Referência: ${code(str(d.reference))}`) : "") +
            p(esc(d.subject)),
          { href: `${SITE_URL}/admin/mensagens`, label: "Abrir no backoffice" },
        ),
        text: `Novo contacto de ${str(d.name)} <${str(d.email)}>\n${str(d.subject)}\n${SITE_URL}/admin/mensagens`,
      };
    }
    case "order_confirmation": {
      const lines = (Array.isArray(d.items) ? d.items : []) as Line[];
      const total = num(d.total_cents);
      const subject = t.orderSubject(orderCode);
      const bank = ctx.bank?.iban
        ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 16px;margin:4px 0 16px;font-size:13px;line-height:1.7">
<strong>${esc(t.bankTitle)}</strong><br>
${esc(t.amount)}: <strong>${esc(formatPrice(total))}</strong><br>
IBAN: ${code(ctx.bank.iban)}<br>
${ctx.bank.bic ? `BIC/SWIFT: ${code(ctx.bank.bic)}<br>` : ""}
${ctx.bank.holder ? `${esc(t.holder)}: ${esc(ctx.bank.holder)}<br>` : ""}
${esc(t.reference)}: ${code(orderCode)}<br>
<span style="color:#9a3412">${esc(t.bankWarn)}</span></div>`
        : p(esc(t.bankLater));
      const carrier = d.carrier
        ? `${str(d.carrier)} · ${c.serviceLevel[str(d.service_level) as ServiceLevel] ?? ""}`
        : "";
      return {
        subject,
        html: layout(
          locale,
          t.orderTitle,
          p(esc(t.orderIntro("\u0000")).replace("\u0000", code(orderCode))) +
            linesTable(locale, lines, {
              subtotal: num(d.subtotal_cents),
              shipping: num(d.shipping_cents),
              total,
              vat: num(d.vat_cents),
            }) +
            (carrier ? p(`${esc(t.shipping)}: ${esc(carrier)}`) : "") +
            bank,
          { href: trackUrl(orderCode, locale), label: t.track },
        ),
        text:
          `${subject}.\n\n` +
          lines.map((l) => `${l.reference} × ${l.quantity}`).join("\n") +
          `\n${t.total}: ${formatPrice(total)} (${t.vatIncluded})\n` +
          (ctx.bank?.iban ? `\n${t.transfer}: IBAN ${ctx.bank.iban} · ${t.reference} ${orderCode}\n` : "") +
          `\n${t.trackText}: ${trackUrl(orderCode, locale)}`,
      };
    }
    case "order_admin_new_sale": {
      const lines = (Array.isArray(d.items) ? d.items : []) as Line[];
      const pt = common.pt.price;
      const subject = `Nova venda ${orderCode} · ${pt(num(d.total_cents))}`;
      return {
        subject,
        html: layout(
          "pt",
          "Nova encomenda",
          p(`${code(orderCode)} · destino ${esc(d.country)} · <strong>${esc(pt(num(d.total_cents)))}</strong>`) +
            linesTable("pt", lines),
          {
            href: `${SITE_URL}/admin/encomendas/${encodeURIComponent(str(d.order_id))}`,
            label: "Abrir encomenda",
          },
        ),
        text: `Nova encomenda ${orderCode} (${pt(num(d.total_cents))})\n${SITE_URL}/admin/encomendas/${str(d.order_id)}`,
      };
    }
    case "order_status_update": {
      const status = str(d.status) as OrderStatus;
      const label = c.orderStatus[status] ?? status;
      const extra = t.statusExtra[status] ?? "";
      const subject = `${orderCode}: ${label}`;
      return {
        subject,
        html: layout(locale, label, p(`${esc(t.order)} ${code(orderCode)}`) + p(esc(extra)), {
          href: trackUrl(orderCode, locale),
          label: t.seeStatus,
        }),
        text: `${t.order} ${orderCode}: ${label}\n${extra}\n${trackUrl(orderCode, locale)}`,
      };
    }
    case "shipment_update": {
      const status = str(d.status);
      const label = c.shipmentStatus[status] ?? status;
      const tracking = str(d.tracking_number);
      const trackingUrl = /^https:\/\//.test(str(d.tracking_url)) ? str(d.tracking_url) : trackUrl(orderCode, locale);
      const subject = `${orderCode}: ${status === "label_created" ? t.shipped : label.toLowerCase()}`;
      return {
        subject,
        html: layout(
          locale,
          status === "label_created" ? t.shippedTitle : label,
          p(
            `${esc(t.order)} ${code(orderCode)} · ${esc(d.carrier)} ${esc(c.serviceLevel[str(d.service_level) as ServiceLevel] ?? "")}`,
          ) + (tracking ? p(`${esc(t.trackingNo)}: ${code(tracking)}`) : ""),
          { href: trackingUrl, label: t.followShipment },
        ),
        text: `${t.order} ${orderCode} — ${label}\n${str(d.carrier)} ${tracking}\n${trackingUrl}`,
      };
    }
  }
}
