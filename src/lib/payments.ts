// Métodos de pagamento do checkout. A encomenda é criada primeiro (pending_payment);
// o pagamento online (Stripe Checkout) é confirmado SEMPRE pelo webhook no servidor
// (src/routes/api.stripe.webhook.ts).

export type PaymentMethodId = "stripe" | "bank_transfer";

export type PaymentMethod = { id: PaymentMethodId; enabled: boolean };

// Pagamento online primeiro (mais rápido: a encomenda segue logo); textos em i18n (shop.checkout.methods).
export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "stripe", enabled: true },
  { id: "bank_transfer", enabled: true },
];

/** Marcas mostradas no checkout. Os métodos reais vêm do Dashboard do Stripe. */
export const ONLINE_BRANDS = ["Visa", "Mastercard", "Apple Pay", "Google Pay", "MB WAY", "Multibanco", "PayPal"] as const;

/** Contrato que cada gateway terá de implementar (lado servidor). */
export interface PaymentProvider {
  id: PaymentMethodId;
  /** Cria a sessão de pagamento e devolve o URL para onde redirecionar o cliente. */
  createCheckout(input: { orderCode: string; amountCents: number; email: string }): Promise<{
    redirectUrl: string | null;
    providerReference: string;
  }>;
  /** Valida a assinatura do webhook e devolve o novo estado do pagamento. */
  verifyWebhook(request: Request): Promise<{
    providerReference: string;
    status: "authorized" | "captured" | "failed" | "refunded";
  }>;
}
