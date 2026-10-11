import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { COMPANY } from "@/lib/content";
import { headI18n, useI18n, type Locale } from "@/lib/i18n";
import { jsonLdScript, pageHead } from "@/lib/seo";

type Faq = { q: string; a: string };

const GROUPS_PT: { title: string; items: Faq[] }[] = [
  {
    title: "Referências e compatibilidade",
    items: [
      {
        q: "Onde encontro a referência da minha centralina?",
        a: "Na etiqueta colada na caixa da centralina. O número principal é a referência de hardware (ex.: Bosch 0281…, Siemens 5WS…, Continental A2C…). Junto aparece normalmente a referência de software ou a família (EDC17C46, SID807, MED17…) e, por vezes, o número OEM da marca do carro.",
      },
      {
        q: "Como sei se a centralina é compatível com o meu carro?",
        a: "A compatibilidade confirma-se pela referência e não apenas pelo modelo do carro. Compare a referência de hardware (e, se possível, a de software) da sua peça com a da ficha do produto. Em caso de dúvida envie-nos uma foto da etiqueta e o VIN — confirmamos sem custo antes da compra.",
      },
      {
        q: "Basta trocar a centralina e o carro funciona?",
        a: "Depende do sistema. Muitas centralinas de motor, airbag e conforto estão ligadas ao imobilizador ou ao VIN e precisam de ser adaptadas (clonagem, codificação ou programação). Fazemos esse serviço: pode enviar-nos a peça original para clonagem antes do envio ou pedir orçamento nos serviços técnicos.",
      },
    ],
  },
  {
    title: "Encomendas e pagamento",
    items: [
      {
        q: "Que métodos de pagamento aceitam?",
        a: "De momento, transferência bancária: os dados seguem no email de confirmação, com o código da encomenda como descritivo. Cartão, MB WAY, Multibanco e PayPal serão adicionados em breve.",
      },
      {
        q: "Os preços incluem IVA? Emitem fatura com NIF?",
        a: "Sim. Todos os preços incluem IVA à taxa legal em vigor e a fatura é emitida com o NIF ou número de IVA indicado no checkout. Para empresas da UE com IVA intracomunitário válido e envios para fora da UE, confirmamos o regime de IVA antes do pagamento.",
      },
      {
        q: "Preciso de criar conta para comprar?",
        a: "Não. Pode comprar como convidado e seguir a encomenda com o código recebido por email. Com conta, fica com o histórico de todas as encomendas e os dados de faturação guardados.",
      },
    ],
  },
  {
    title: "Envio e entrega",
    items: [
      {
        q: "Para onde enviam e quanto custa?",
        a: "Enviamos para Portugal, toda a União Europeia e vários destinos fora da Europa. O custo e o prazo são calculados no checkout de acordo com o país, o peso e o tipo de envio (normal ou expresso), antes de confirmar a encomenda.",
      },
      {
        q: "Como acompanho a minha encomenda?",
        a: "Após a expedição recebe um email com a transportadora e o número de seguimento. Pode também consultar o estado na página Seguir encomenda, com o código CT-XXXXX-XXXXX, ou na sua conta.",
      },
      {
        q: "Há taxas alfandegárias fora da UE?",
        a: "Envios para fora da União Europeia podem estar sujeitos a direitos aduaneiros e impostos de importação cobrados no destino, a cargo do destinatário.",
      },
    ],
  },
  {
    title: "Garantia e devoluções",
    items: [
      {
        q: "As peças têm garantia?",
        a: "Sim. Para consumidores aplica-se a garantia legal: 3 anos para peças novas e 18 meses para peças usadas e recondicionadas. Para profissionais aplica-se o prazo indicado na ficha de cada produto. Todas as peças são testadas em bancada antes do envio.",
      },
      {
        q: "Posso devolver uma peça?",
        a: "Se é consumidor, tem 14 dias após a receção para desistir da compra sem indicar motivo; os custos de devolução ficam a seu cargo e reembolsamos em até 14 dias. Este direito não se aplica a peças programadas ou codificadas a pedido com os dados do seu veículo.",
      },
      {
        q: "O que faço se a peça avariar?",
        a: "Contacte-nos com o código da encomenda e a descrição da avaria (com os códigos de erro, se possível). Indicamos como enviar a peça para diagnóstico e, se estiver coberta, reparamos ou substituímos.",
      },
    ],
  },
];

const GROUPS_EN: { title: string; items: Faq[] }[] = [
  {
    title: "References and compatibility",
    items: [
      {
        q: "Where do I find my ECU's reference?",
        a: "On the label stuck to the ECU housing. The main number is the hardware reference (e.g. Bosch 0281…, Siemens 5WS…, Continental A2C…). Next to it you will usually find the software reference or the family (EDC17C46, SID807, MED17…) and sometimes the car maker's OEM number.",
      },
      {
        q: "How do I know if the ECU is compatible with my car?",
        a: "Compatibility is confirmed by the reference, not just the car model. Compare the hardware reference (and, if possible, the software reference) of your part with the one on the product page. If in doubt, send us a photo of the label and the VIN — we'll confirm free of charge before you buy.",
      },
      {
        q: "Do I just swap the ECU and the car works?",
        a: "It depends on the system. Many engine, airbag and comfort ECUs are linked to the immobiliser or the VIN and need to be adapted (cloning, coding or programming). We offer that service: you can send us your original part for cloning before shipping, or request a quote through our technical services.",
      },
    ],
  },
  {
    title: "Orders and payment",
    items: [
      {
        q: "Which payment methods do you accept?",
        a: "For now, bank transfer: the details are in the confirmation email, with the order code as the payment reference. Card, MB WAY, Multibanco and PayPal will be added soon.",
      },
      {
        q: "Do prices include VAT? Do you issue invoices with a VAT number?",
        a: "Yes. All prices include VAT at the applicable rate and the invoice is issued with the tax or VAT number entered at checkout. For EU businesses with a valid intra-community VAT number and for shipments outside the EU, we confirm the VAT treatment before payment.",
      },
      {
        q: "Do I need an account to buy?",
        a: "No. You can check out as a guest and track your order with the code you receive by email. With an account you keep the history of all your orders and your saved billing details.",
      },
    ],
  },
  {
    title: "Shipping and delivery",
    items: [
      {
        q: "Where do you ship to and how much does it cost?",
        a: "We ship to Portugal, the whole European Union and several destinations outside Europe. Cost and lead time are calculated at checkout based on country, weight and service (standard or express), before you confirm the order.",
      },
      {
        q: "How do I track my order?",
        a: "Once shipped, you receive an email with the carrier and tracking number. You can also check the status on the Track order page with your CT-XXXXX-XXXXX code, or in your account.",
      },
      {
        q: "Are there customs fees outside the EU?",
        a: "Shipments outside the European Union may be subject to customs duties and import taxes charged at the destination, payable by the recipient.",
      },
    ],
  },
  {
    title: "Warranty and returns",
    items: [
      {
        q: "Do parts come with a warranty?",
        a: "Yes. For consumers the legal warranty applies: 3 years for new parts and 18 months for used and reconditioned parts. For businesses, the period stated on each product page applies. Every part is bench tested before shipping.",
      },
      {
        q: "Can I return a part?",
        a: "If you are a consumer, you have 14 days from receipt to cancel the purchase without giving a reason; return costs are your responsibility and we refund within 14 days. This right does not apply to parts programmed or coded on request with your vehicle's data.",
      },
      {
        q: "What if the part fails?",
        a: "Contact us with your order code and a description of the fault (with error codes, if possible). We'll tell you how to send the part for diagnosis and, if covered, we'll repair or replace it.",
      },
    ],
  },
];

const GROUPS: Record<Locale, typeof GROUPS_PT> = { pt: GROUPS_PT, en: GROUPS_EN };

const TEXT = {
  pt: {
    metaTitle: "Perguntas frequentes",
    metaDescription:
      "Referências e compatibilidade de centralinas, pagamento, envio internacional, garantia e devoluções — respostas rápidas.",
    label: "Apoio",
    title: "Perguntas frequentes",
    intro: "Não encontra a resposta? Fale com a equipa técnica:",
    asideTitle: "Tem a referência mas não a encontra?",
    asideText:
      "Grande parte do stock ainda não está publicada. Envie-nos a referência e respondemos com disponibilidade e preço.",
    asideCta: "Pedir disponibilidade",
    terms1: "Condições completas nos",
    terms: "termos e condições",
  },
  en: {
    metaTitle: "Frequently asked questions",
    metaDescription:
      "ECU references and compatibility, payment, international shipping, warranty and returns — quick answers.",
    label: "Support",
    title: "Frequently asked questions",
    intro: "Can't find the answer? Talk to our technical team:",
    asideTitle: "Have the reference but can't find it?",
    asideText:
      "Much of our stock isn't published yet. Send us the reference and we'll reply with availability and price.",
    asideCta: "Check availability",
    terms1: "Full conditions in our",
    terms: "terms and conditions",
  },
};

export const Route = createFileRoute("/faq")({
  head: ({ match }) => {
    const { locale } = headI18n(match);
    const head = pageHead({
      title: TEXT[locale].metaTitle,
      description: TEXT[locale].metaDescription,
      path: "/faq",
      locale,
    });
    return {
      ...head,
      scripts: [
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: GROUPS[locale].flatMap((g) => g.items).map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      ],
    };
  },
  component: FaqPage,
});

function FaqPage() {
  const { locale } = useI18n();
  const x = TEXT[locale];
  return (
    <div className="container-page py-12 md:py-16">
      <header className="max-w-3xl">
        <p className="mono-label text-primary">{x.label}</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
          {x.title}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {x.intro} {COMPANY.phone} · {COMPANY.email}.
        </p>
      </header>

      <div className="mt-10 grid gap-10 *:min-w-0 lg:grid-cols-[1fr_300px]">
        <div className="space-y-10">
          {GROUPS[locale].map((g) => (
            <section key={g.title}>
              <h2 className="mono-label mb-2">{g.title}</h2>
              <Accordion
                type="multiple"
                className="rounded-xl border border-border bg-surface px-5"
              >
                {g.items.map((f) => (
                  <AccordionItem key={f.q} value={f.q} className="border-border last:border-b-0">
                    <AccordionTrigger className="text-left text-[15px] font-bold hover:no-underline">
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>

        <aside className="h-fit rounded-xl border border-border bg-surface p-6 lg:sticky lg:top-28">
          <MessageSquare className="size-6 text-primary" aria-hidden />
          <p className="mt-3 font-bold">{x.asideTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {x.asideText}
          </p>
          <Link
            to="/contactos"
            className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            {x.asideCta}
          </Link>
          <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
            {x.terms1}{" "}
            <Link to="/termos" className="text-foreground hover:underline">
              {x.terms}
            </Link>
            .
          </p>
        </aside>
      </div>
    </div>
  );
}
