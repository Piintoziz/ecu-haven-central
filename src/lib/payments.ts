// Arquitetura modular de pagamentos. A encomenda é criada primeiro (estado
// pending_payment) e o fornecedor é escolhido depois. Stripe/PayPal ligam-se
// aqui na próxima fase, com confirmação SEMPRE via webhook no servidor.

export type PaymentMethodId = "bank_transfer" | "stripe" | "paypal";

export type PaymentMethod = {
  id: PaymentMethodId;
  label: string;
  description: string;
  enabled: boolean;
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "bank_transfer",
    label: "Transferência bancária",
    description: "Recebe o IBAN e a referência por email. A encomenda é enviada após confirmação.",
    enabled: true,
  },
  {
    id: "stripe",
    label: "Cartão · MB Way · Multibanco",
    description: "Disponível em breve.",
    enabled: false,
  },
  {
    id: "paypal",
    label: "PayPal",
    description: "Disponível em breve.",
    enabled: false,
  },
];

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
