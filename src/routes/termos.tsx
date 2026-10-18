import { createFileRoute, Link } from "@tanstack/react-router";
import { CompanyIdentification, LegalPage, type LegalSection } from "@/components/site/legal-page";
import { COMPANY, COMPLAINTS_BOOK_URL, LEGAL, RAL_ENTITIES } from "@/lib/content";
import { getDict, headI18n, useI18n } from "@/lib/i18n";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/termos")({
  head: ({ match }) => {
    const { locale } = headI18n(match);
    return pageHead({
      title: locale === "en" ? "Terms and conditions" : "Termos e condições",
      description:
        locale === "en"
          ? "Terms of sale for ECUs and electronic modules: orders, prices, payment, shipping, right of withdrawal, warranty and dispute resolution."
          : "Condições de venda de centralinas e módulos eletrónicos: encomendas, preços, pagamento, envio, livre resolução, garantia e resolução de litígios.",
      path: "/termos",
      locale,
    });
  },
  component: TermosPage,
});

const sectionsPt: LegalSection[] = [
  {
    id: "identificacao",
    title: "Identificação do vendedor",
    body: (
      <>
        <p>Este site e as vendas nele realizadas são da responsabilidade de:</p>
        <CompanyIdentification />
        <p>
          Contactos: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> ·{" "}
          <a href={COMPANY.phoneHref}>{COMPANY.phone}</a> ({getDict("pt").layout.hours}).
        </p>
      </>
    ),
  },
  {
    id: "ambito",
    title: "Âmbito e aceitação",
    body: (
      <>
        <p>
          Estes termos aplicam-se a todas as encomendas feitas neste site, por consumidores
          (particulares) e por profissionais (oficinas, empresas). Ao concluir uma encomenda declara
          que os leu e aceita. Algumas regras aplicam-se apenas a consumidores e estão assinaladas.
        </p>
        <p>
          As peças vendidas são, salvo indicação em contrário, <strong>usadas e testadas</strong> ou{" "}
          <strong>recondicionadas</strong>. O estado de cada peça está indicado na respetiva ficha.
        </p>
      </>
    ),
  },
  {
    id: "compatibilidade",
    title: "Referências e compatibilidade",
    body: (
      <>
        <p>
          A compatibilidade de uma centralina depende da <strong>referência de hardware</strong> e,
          em muitos casos, da <strong>referência de software</strong> indicadas na etiqueta da peça
          original. A lista de veículos em cada ficha é indicativa; a confirmação deve ser feita
          pela referência.
        </p>
        <ul>
          <li>Antes de encomendar, compare a referência da sua peça com a da ficha do produto.</li>
          <li>
            Em caso de dúvida, envie-nos uma foto da etiqueta e o VIN através dos{" "}
            <Link to="/contactos">contactos</Link>. Confirmamos sem custo.
          </li>
          <li>
            Muitas centralinas exigem adaptação ao veículo (imobilizador, codificação, VIN). Esse
            serviço não está incluído no preço da peça, salvo indicação expressa, e pode ser pedido
            nos nossos <Link to="/servicos">serviços técnicos</Link>.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "encomendas",
    title: "Encomendas",
    body: (
      <>
        <p>
          Depois de submeter a encomenda recebe um email com o código (CT-XXXXX-XXXXX), o resumo e
          as instruções de pagamento. O contrato considera-se celebrado com esse email de
          confirmação.
        </p>
        <p>
          O stock é reservado no momento da encomenda. Encomendas não pagas no prazo de{" "}
          <strong>5 dias úteis</strong> podem ser canceladas e o stock libertado, com aviso por
          email. Podemos ainda cancelar uma encomenda em caso de erro manifesto de preço ou de
          stock, reembolsando integralmente qualquer valor já pago.
        </p>
      </>
    ),
  },
  {
    id: "precos-pagamento",
    title: "Preços e pagamento",
    body: (
      <>
        <p>
          Os preços das peças estão em euros e <strong>não incluem IVA</strong>, que é acrescido à taxa legal em vigor (23%) e apresentado no carrinho e no checkout. Os portes
          são calculados no checkout em função do destino, do peso e do tipo de envio, e
          apresentados antes da confirmação. Para empresas com número de IVA intracomunitário válido
          ou envios para fora da União Europeia, o regime de IVA aplicável é confirmado antes do
          pagamento.
        </p>
        <p>
          Métodos disponíveis: <strong>transferência bancária</strong> (os dados seguem no email de
          confirmação, com o código da encomenda como descritivo). Outros métodos (cartão, MB WAY,
          Multibanco, PayPal) serão indicados no checkout quando disponíveis. A encomenda é
          preparada após a confirmação do pagamento. A fatura é emitida com o NIF indicado na
          encomenda.
        </p>
      </>
    ),
  },
  {
    id: "envio",
    title: "Envio e entrega",
    body: (
      <>
        <p>
          Enviamos para Portugal, restantes países da União Europeia e outros destinos indicados no
          checkout. Os prazos apresentados são estimativas da transportadora contadas a partir da
          expedição. Após o envio recebe o número e o link de seguimento; também pode acompanhar a
          encomenda em <Link to="/encomenda">Seguir encomenda</Link> ou na sua conta.
        </p>
        <ul>
          <li>
            Verifique a embalagem na entrega e registe junto da transportadora qualquer dano
            visível.
          </li>
          <li>
            Envios para fora da UE podem estar sujeitos a direitos aduaneiros e impostos de
            importação, a cargo do destinatário.
          </li>
          <li>O risco de perda ou dano passa para o cliente no momento da entrega.</li>
        </ul>
      </>
    ),
  },
  {
    id: "livre-resolucao",
    title: "Direito de livre resolução (consumidores)",
    body: (
      <>
        <p>
          Se é consumidor, pode resolver o contrato no prazo de <strong>14 dias</strong> a contar da
          data em que recebe a encomenda, sem indicar motivo (Decreto-Lei n.º 24/2014). Basta
          comunicar-nos a decisão por escrito, para{" "}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>, indicando o código da encomenda —
          pode usar o modelo abaixo.
        </p>
        <ul>
          <li>
            Devolva a peça no prazo de 14 dias após a comunicação, na embalagem original sempre que
            possível.
          </li>
          <li>Os custos diretos da devolução ficam a seu cargo.</li>
          <li>
            Reembolsamos o valor pago, incluindo os portes de envio standard, no prazo de 14 dias a
            contar da comunicação, pelo mesmo meio de pagamento. Podemos reter o reembolso até
            recebermos a peça.
          </li>
          <li>
            É responsável pela desvalorização da peça resultante de manipulação além do necessário
            para verificar a sua natureza e funcionamento — por exemplo, abertura da caixa,
            alteração da programação ou danos na etiqueta e nos selos de controlo.
          </li>
          <li>
            Não há direito de livre resolução para peças{" "}
            <strong>programadas, clonadas ou codificadas a pedido</strong> com os dados do seu
            veículo, por serem bens personalizados (art. 17.º do mesmo diploma).
          </li>
        </ul>
        <h3>Modelo de formulário de livre resolução</h3>
        <p>
          Para: {LEGAL.legalName}, {LEGAL.registeredOffice}, {COMPANY.email}.<br />
          Pela presente comunico que resolvo o contrato de compra relativo à encomenda n.º [código],
          recebida em [data]. Nome: [nome]. Morada: [morada]. Data: [data]. Assinatura (apenas em
          papel).
        </p>
        <p>
          Profissionais (compras para a atividade da empresa) não beneficiam deste direito;
          aceitamos devoluções comerciais caso a caso, mediante contacto prévio.
        </p>
      </>
    ),
  },
  {
    id: "garantia",
    title: "Garantia",
    body: (
      <>
        <h3>Consumidores — garantia legal</h3>
        <p>
          Respondemos por qualquer falta de conformidade nos termos do Decreto-Lei n.º 84/2021:
          prazo de <strong>3 anos</strong> para bens novos e de <strong>18 meses</strong> para bens
          usados e recondicionados, prazo reduzido que o consumidor aceita expressamente ao
          encomendar uma peça usada. Perante uma falta de conformidade tem direito à reparação ou
          substituição da peça e, nos casos previstos na lei, à redução do preço ou à resolução do
          contrato.
        </p>
        <h3>Profissionais — garantia comercial</h3>
        <p>
          Para compras profissionais aplica-se o prazo de garantia indicado na ficha de cada
          produto, contado da data de entrega.
        </p>
        <h3>Condições e exclusões</h3>
        <ul>
          <li>
            A peça deve ser instalada por um técnico qualificado, seguindo as instruções do
            fabricante.
          </li>
          <li>
            Ficam excluídos danos causados por instalação incorreta, curto-circuitos ou sobretensões
            na instalação do veículo, entrada de água, quedas, abertura da caixa ou violação dos
            selos, e reprogramação por terceiros.
          </li>
          <li>
            A garantia não cobre a mão de obra de montagem/desmontagem nem a adaptação ao veículo
            (imobilizador, codificação), salvo acordo em contrário.
          </li>
          <li>
            Para acionar a garantia contacte-nos com o código da encomenda e a descrição da avaria
            (com códigos de erro, se possível). Indicamos como enviar a peça para diagnóstico.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "responsabilidade",
    title: "Responsabilidade",
    body: (
      <p>
        Fazemos todos os esforços para que as informações do catálogo (referências,
        compatibilidades, fotografias) sejam exatas, mas podem existir erros pontuais, que
        corrigiremos logo que detetados. Nada nestes termos limita os direitos que a lei reconhece
        aos consumidores.
      </p>
    ),
  },
  {
    id: "dados",
    title: "Dados pessoais e cookies",
    body: (
      <p>
        O tratamento de dados pessoais está descrito na{" "}
        <Link to="/privacidade">Política de Privacidade</Link> e a utilização de cookies na{" "}
        <Link to="/cookies">Política de Cookies</Link>.
      </p>
    ),
  },
  {
    id: "litigios",
    title: "Reclamações e resolução de litígios",
    body: (
      <>
        <p>
          Pode apresentar reclamação através dos nossos contactos ou no{" "}
          <a href={COMPLAINTS_BOOK_URL} target="_blank" rel="noopener noreferrer">
            Livro de Reclamações Eletrónico
          </a>
          .
        </p>
        <p>
          Em caso de litígio de consumo, o consumidor pode recorrer a uma das seguintes entidades de
          Resolução Alternativa de Litígios (Lei n.º 144/2015):
        </p>
        <ul>
          {RAL_ENTITIES.map((e) => (
            <li key={e.url}>
              <a href={e.url} target="_blank" rel="noopener noreferrer">
                {e.name}
              </a>
            </li>
          ))}
        </ul>
        <p>
          Mais informações no Portal do Consumidor:{" "}
          <a href="https://www.consumidor.gov.pt" target="_blank" rel="noopener noreferrer">
            www.consumidor.gov.pt
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "lei",
    title: "Lei aplicável e alterações",
    body: (
      <p>
        Estes termos regem-se pela lei portuguesa. Podemos atualizá-los a qualquer momento; a versão
        aplicável a cada encomenda é a que estava publicada na data em que foi feita.
      </p>
    ),
  },
];

const sectionsEn: LegalSection[] = [
  {
    id: "identificacao",
    title: "Seller identification",
    body: (
      <>
        <p>This website and the sales made on it are the responsibility of:</p>
        <CompanyIdentification />
        <p>
          Contact: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> ·{" "}
          <a href={COMPANY.phoneHref}>{COMPANY.phone}</a> ({getDict("en").layout.hours}).
        </p>
      </>
    ),
  },
  {
    id: "ambito",
    title: "Scope and acceptance",
    body: (
      <>
        <p>
          These terms apply to all orders placed on this website, by consumers (private individuals)
          and by businesses (workshops, companies). By completing an order you confirm that you have
          read and accept them. Some rules apply only to consumers and are marked as such.
        </p>
        <p>
          Unless stated otherwise, the parts sold are <strong>used and tested</strong> or{" "}
          <strong>reconditioned</strong>. The condition of each part is shown on its product page.
        </p>
      </>
    ),
  },
  {
    id: "compatibilidade",
    title: "References and compatibility",
    body: (
      <>
        <p>
          An ECU's compatibility depends on the <strong>hardware reference</strong> and, in many
          cases, the <strong>software reference</strong> printed on the original part's label. The
          vehicle list on each product page is for guidance only; compatibility must be confirmed by
          the reference.
        </p>
        <ul>
          <li>Before ordering, compare your part's reference with the one on the product page.</li>
          <li>
            If in doubt, send us a photo of the label and the VIN through our{" "}
            <Link to="/contactos">contact page</Link>. We'll confirm free of charge.
          </li>
          <li>
            Many ECUs require adaptation to the vehicle (immobiliser, coding, VIN). That service is
            not included in the part price unless expressly stated, and can be ordered through our{" "}
            <Link to="/servicos">technical services</Link>.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "encomendas",
    title: "Orders",
    body: (
      <>
        <p>
          After placing your order you receive an email with the code (CT-XXXXX-XXXXX), the summary
          and the payment instructions. The contract is concluded with that confirmation email.
        </p>
        <p>
          Stock is reserved when the order is placed. Orders not paid within{" "}
          <strong>5 working days</strong> may be cancelled and the stock released, with notice by
          email. We may also cancel an order in the event of an obvious pricing or stock error,
          refunding in full any amount already paid.
        </p>
      </>
    ),
  },
  {
    id: "precos-pagamento",
    title: "Prices and payment",
    body: (
      <>
        <p>
          Part prices are in euros and <strong>exclude VAT</strong>, which is added at the applicable rate (23%) and shown in the cart and at checkout. Shipping is
          calculated at checkout according to destination, weight and service, and shown before you
          confirm. For businesses with a valid intra-community VAT number or shipments outside the
          European Union, the applicable VAT treatment is confirmed before payment.
        </p>
        <p>
          Available method: <strong>bank transfer</strong> (the details are in the confirmation
          email, with the order code as the payment reference). Other methods (card, MB WAY,
          Multibanco, PayPal) will be shown at checkout when available. The order is prepared once
          payment is confirmed. The invoice is issued with the tax number entered on the order.
        </p>
      </>
    ),
  },
  {
    id: "envio",
    title: "Shipping and delivery",
    body: (
      <>
        <p>
          We ship to Portugal, other European Union countries and other destinations shown at
          checkout. Lead times are carrier estimates counted from dispatch. Once shipped, you
          receive the tracking number and link; you can also follow your order on{" "}
          <Link to="/encomenda">Track order</Link> or in your account.
        </p>
        <ul>
          <li>Check the package on delivery and report any visible damage to the carrier.</li>
          <li>
            Shipments outside the EU may be subject to customs duties and import taxes, payable by
            the recipient.
          </li>
          <li>The risk of loss or damage passes to the customer on delivery.</li>
        </ul>
      </>
    ),
  },
  {
    id: "livre-resolucao",
    title: "Right of withdrawal (consumers)",
    body: (
      <>
        <p>
          If you are a consumer, you may withdraw from the contract within <strong>14 days</strong>{" "}
          of receiving your order, without giving a reason (Portuguese Decree-Law 24/2014). Simply
          notify us in writing at <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>,
          quoting the order code — you may use the model form below.
        </p>
        <ul>
          <li>Return the part within 14 days of your notice, in its original packaging where possible.</li>
          <li>The direct cost of returning the part is borne by you.</li>
          <li>
            We refund the amount paid, including standard shipping, within 14 days of your notice,
            using the same payment method. We may withhold the refund until we receive the part.
          </li>
          <li>
            You are liable for any loss in value resulting from handling beyond what is necessary to
            establish the nature and functioning of the part — for example opening the housing,
            changing the programming or damaging the label and control seals.
          </li>
          <li>
            There is no right of withdrawal for parts{" "}
            <strong>programmed, cloned or coded on request</strong> with your vehicle's data, as these
            are personalised goods (article 17 of the same decree-law).
          </li>
        </ul>
        <h3>Model withdrawal form</h3>
        <p>
          To: {LEGAL.legalName}, {LEGAL.registeredOffice}, {COMPANY.email}.<br />
          I hereby give notice that I withdraw from the purchase contract for order no. [code],
          received on [date]. Name: [name]. Address: [address]. Date: [date]. Signature (only if on
          paper).
        </p>
        <p>
          Businesses (purchases for their professional activity) do not benefit from this right; we
          accept commercial returns case by case, subject to prior contact.
        </p>
      </>
    ),
  },
  {
    id: "garantia",
    title: "Warranty",
    body: (
      <>
        <h3>Consumers — legal guarantee</h3>
        <p>
          We are liable for any lack of conformity under Portuguese Decree-Law 84/2021: a period of{" "}
          <strong>3 years</strong> for new goods and <strong>18 months</strong> for used and
          reconditioned goods, a reduced period the consumer expressly accepts when ordering a used
          part. In the event of a lack of conformity you are entitled to repair or replacement of
          the part and, where provided by law, to a price reduction or termination of the contract.
        </p>
        <h3>Businesses — commercial warranty</h3>
        <p>
          For business purchases, the warranty period stated on each product page applies, counted
          from the delivery date.
        </p>
        <h3>Conditions and exclusions</h3>
        <ul>
          <li>The part must be installed by a qualified technician following the manufacturer's instructions.</li>
          <li>
            Damage caused by incorrect installation, short circuits or over-voltage in the vehicle's
            wiring, water ingress, drops, opening the housing or breaking the seals, and
            reprogramming by third parties is excluded.
          </li>
          <li>
            The warranty does not cover fitting/removal labour or adaptation to the vehicle
            (immobiliser, coding), unless otherwise agreed.
          </li>
          <li>
            To make a warranty claim, contact us with the order code and a description of the fault
            (with error codes, if possible). We'll tell you how to send the part for diagnosis.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "responsabilidade",
    title: "Liability",
    body: (
      <p>
        We make every effort to ensure the catalogue information (references, compatibility,
        photos) is accurate, but occasional errors may occur and will be corrected as soon as they
        are found. Nothing in these terms limits the rights that the law grants to consumers.
      </p>
    ),
  },
  {
    id: "dados",
    title: "Personal data and cookies",
    body: (
      <p>
        How we process personal data is described in the <Link to="/privacidade">Privacy Policy</Link>{" "}
        and our use of cookies in the <Link to="/cookies">Cookie Policy</Link>.
      </p>
    ),
  },
  {
    id: "litigios",
    title: "Complaints and dispute resolution",
    body: (
      <>
        <p>
          You can make a complaint through our contact details or in the Portuguese{" "}
          <a href={COMPLAINTS_BOOK_URL} target="_blank" rel="noopener noreferrer">
            Electronic Complaints Book
          </a>
          .
        </p>
        <p>
          In the event of a consumer dispute, consumers may use one of the following Alternative
          Dispute Resolution entities (Portuguese Law 144/2015):
        </p>
        <ul>
          {RAL_ENTITIES.map((e) => (
            <li key={e.url}>
              <a href={e.url} target="_blank" rel="noopener noreferrer">
                {e.name}
              </a>
            </li>
          ))}
        </ul>
        <p>
          More information on the Portuguese Consumer Portal:{" "}
          <a href="https://www.consumidor.gov.pt" target="_blank" rel="noopener noreferrer">
            www.consumidor.gov.pt
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "lei",
    title: "Governing law and changes",
    body: (
      <p>
        These terms are governed by Portuguese law. We may update them at any time; the version that
        applies to each order is the one published on the date the order was placed. In case of
        discrepancy between language versions, the Portuguese version prevails.
      </p>
    ),
  },
];

function TermosPage() {
  const { locale } = useI18n();
  return locale === "en" ? (
    <LegalPage label="Legal" title="Terms and conditions of sale" sections={sectionsEn} />
  ) : (
    <LegalPage label="Legal" title="Termos e condições de venda" sections={sectionsPt} />
  );
}
