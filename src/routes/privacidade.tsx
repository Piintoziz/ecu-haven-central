import { createFileRoute, Link } from "@tanstack/react-router";
import { CompanyIdentification, LegalPage, type LegalSection } from "@/components/site/legal-page";
import { LEGAL } from "@/lib/content";
import { headI18n, useI18n } from "@/lib/i18n";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/privacidade")({
  head: ({ match }) => {
    const { locale } = headI18n(match);
    return pageHead({
      title: locale === "en" ? "Privacy policy" : "Política de privacidade",
      description:
        locale === "en"
          ? "What personal data we process, why, for how long, who we share it with and how to exercise your rights (GDPR)."
          : "Que dados pessoais tratamos, para quê, durante quanto tempo, com quem partilhamos e como exercer os seus direitos (RGPD).",
      path: "/privacidade",
      locale,
    });
  },
  component: PrivacidadePage,
});

const mail = <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>;

const sectionsPt: LegalSection[] = [
  {
    id: "responsavel",
    title: "Responsável pelo tratamento",
    body: (
      <>
        <CompanyIdentification />
        <p>Para qualquer questão sobre os seus dados contacte-nos através de {mail}.</p>
      </>
    ),
  },
  {
    id: "dados",
    title: "Que dados recolhemos",
    body: (
      <ul>
        <li>
          <strong>Encomendas:</strong> nome, email, telefone, moradas de entrega e faturação,
          empresa e NIF/VAT (se indicados), artigos comprados, valores e notas.
        </li>
        <li>
          <strong>Conta de cliente:</strong> email, nome e dados de faturação que guardar no perfil.
          A palavra-passe é guardada apenas de forma cifrada (hash) pelo nosso fornecedor de
          autenticação.
        </li>
        <li>
          <strong>Pedidos de contacto:</strong> nome, email, telefone, empresa, referência da peça,
          VIN do veículo (opcional) e a mensagem.
        </li>
        <li>
          <strong>Dados técnicos:</strong> uma impressão anónima (hash) do endereço IP para limitar
          abusos dos formulários; o IP em claro não é guardado. Registos técnicos do servidor e da
          proteção anti-spam.
        </li>
      </ul>
    ),
  },
  {
    id: "finalidades",
    title: "Para que usamos e com que fundamento",
    body: (
      <div className="legal-table">
        <table>
          <thead>
            <tr>
              <th>Finalidade</th>
              <th>Fundamento (RGPD, art. 6.º)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Processar encomendas, pagamentos, envios, garantia e apoio pós-venda</td>
              <td>Execução de contrato</td>
            </tr>
            <tr>
              <td>Gerir a conta de cliente e o histórico de encomendas</td>
              <td>Execução de contrato</td>
            </tr>
            <tr>
              <td>Responder a pedidos de contacto e orçamentos</td>
              <td>Diligências pré-contratuais / interesse legítimo</td>
            </tr>
            <tr>
              <td>Emitir faturas e cumprir obrigações fiscais e contabilísticas</td>
              <td>Obrigação legal</td>
            </tr>
            <tr>
              <td>Segurança do site, prevenção de fraude e spam</td>
              <td>Interesse legítimo</td>
            </tr>
            <tr>
              <td>Cookies não essenciais (estatística, marketing) — se vierem a ser usados</td>
              <td>Consentimento</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: "conservacao",
    title: "Durante quanto tempo",
    body: (
      <ul>
        <li>
          Encomendas e faturas: <strong>10 anos</strong>, pelo prazo legal de conservação
          contabilística.
        </li>
        <li>Conta de cliente: enquanto a conta estiver ativa; eliminada a pedido.</li>
        <li>
          Pedidos de contacto: <strong>2 anos</strong> após o último contacto.
        </li>
        <li>
          Registos de envio de emails: <strong>90 dias</strong>.
        </li>
        <li>
          Impressões anónimas de IP (limitação de abusos): <strong>24 horas</strong>.
        </li>
      </ul>
    ),
  },
  {
    id: "partilha",
    title: "Com quem partilhamos",
    body: (
      <>
        <p>
          Não vendemos dados pessoais. Partilhamos apenas o necessário com prestadores que tratam os
          dados por nossa conta, ao abrigo de contratos de subcontratação:
        </p>
        <div className="legal-table">
          <table>
            <thead>
              <tr>
                <th>Prestador</th>
                <th>Serviço</th>
                <th>Localização</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Supabase</td>
                <td>Base de dados, autenticação e armazenamento de imagens</td>
                <td>UE (Frankfurt, Alemanha)</td>
              </tr>
              <tr>
                <td>Cloudflare</td>
                <td>Alojamento e entrega do site, proteção anti-spam (Turnstile)</td>
                <td>Rede global; empresa nos EUA</td>
              </tr>
              <tr>
                <td>Resend</td>
                <td>Envio de emails transacionais</td>
                <td>EUA</td>
              </tr>
              <tr>
                <td>Google Fonts</td>
                <td>Tipos de letra do site (recebe o endereço IP do visitante)</td>
                <td>EUA</td>
              </tr>
              <tr>
                <td>Transportadoras</td>
                <td>Entrega das encomendas (nome, morada, telefone)</td>
                <td>Conforme o destino</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          As transferências para fora do Espaço Económico Europeu são feitas ao abrigo do Quadro de
          Privacidade de Dados UE-EUA ou de cláusulas contratuais-tipo aprovadas pela Comissão
          Europeia. Podemos ainda comunicar dados a autoridades quando a lei o exija.
        </p>
      </>
    ),
  },
  {
    id: "direitos",
    title: "Os seus direitos",
    body: (
      <>
        <p>
          Pode pedir acesso, retificação, apagamento, limitação do tratamento e portabilidade dos
          seus dados, opor-se a tratamentos baseados em interesse legítimo e retirar o consentimento
          a qualquer momento. Envie o pedido para {mail}; respondemos no prazo máximo de um mês. Os
          dados de faturação não podem ser apagados antes do fim do prazo legal de conservação.
        </p>
        <p>
          Tem ainda o direito de apresentar reclamação à Comissão Nacional de Proteção de Dados (
          <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer">
            www.cnpd.pt
          </a>
          ).
        </p>
      </>
    ),
  },
  {
    id: "seguranca",
    title: "Segurança",
    body: (
      <p>
        Todo o tráfego é cifrado (HTTPS). O acesso aos dados é restrito por regras de segurança ao
        nível da base de dados: cada cliente só vê as suas encomendas e apenas a equipa autorizada
        acede ao backoffice. Os pagamentos com cartão, quando disponíveis, são processados
        diretamente pelo prestador de pagamentos — não guardamos dados de cartão.
      </p>
    ),
  },
  {
    id: "cookies",
    title: "Cookies",
    body: (
      <p>
        Usamos apenas armazenamento essencial ao funcionamento do site. Os detalhes e as suas opções
        estão na <Link to="/cookies">Política de Cookies</Link>.
      </p>
    ),
  },
  {
    id: "menores",
    title: "Menores",
    body: (
      <p>
        O site destina-se a maiores de 16 anos. Não recolhemos intencionalmente dados de menores.
      </p>
    ),
  },
  {
    id: "alteracoes",
    title: "Alterações",
    body: (
      <p>
        Podemos atualizar esta política para refletir alterações legais ou nos nossos serviços. A
        data da última atualização está indicada no topo da página.
      </p>
    ),
  },
];

const sectionsEn: LegalSection[] = [
  {
    id: "responsavel",
    title: "Data controller",
    body: (
      <>
        <CompanyIdentification />
        <p>For any question about your data, contact us at {mail}.</p>
      </>
    ),
  },
  {
    id: "dados",
    title: "What data we collect",
    body: (
      <ul>
        <li>
          <strong>Orders:</strong> name, email, phone, delivery and billing addresses, company and
          tax/VAT number (if provided), items purchased, amounts and notes.
        </li>
        <li>
          <strong>Customer account:</strong> email, name and the billing details you save in your
          profile. The password is only stored in encrypted form (hash) by our authentication
          provider.
        </li>
        <li>
          <strong>Contact requests:</strong> name, email, phone, company, part reference, vehicle
          VIN (optional) and the message.
        </li>
        <li>
          <strong>Technical data:</strong> an anonymous fingerprint (hash) of the IP address to
          limit abuse of the forms; the plain IP is not stored. Technical server and anti-spam logs.
        </li>
      </ul>
    ),
  },
  {
    id: "finalidades",
    title: "Why we use it and on what legal basis",
    body: (
      <div className="legal-table">
        <table>
          <thead>
            <tr>
              <th>Purpose</th>
              <th>Legal basis (GDPR, art. 6)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Processing orders, payments, shipping, warranty and after-sales support</td>
              <td>Performance of a contract</td>
            </tr>
            <tr>
              <td>Managing the customer account and order history</td>
              <td>Performance of a contract</td>
            </tr>
            <tr>
              <td>Replying to contact and quote requests</td>
              <td>Pre-contractual steps / legitimate interest</td>
            </tr>
            <tr>
              <td>Issuing invoices and meeting tax and accounting obligations</td>
              <td>Legal obligation</td>
            </tr>
            <tr>
              <td>Website security, fraud and spam prevention</td>
              <td>Legitimate interest</td>
            </tr>
            <tr>
              <td>Non-essential cookies (analytics, marketing) — if ever used</td>
              <td>Consent</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: "conservacao",
    title: "How long we keep it",
    body: (
      <ul>
        <li>
          Orders and invoices: <strong>10 years</strong>, the legal accounting retention period.
        </li>
        <li>Customer account: while the account is active; deleted on request.</li>
        <li>
          Contact requests: <strong>2 years</strong> after the last contact.
        </li>
        <li>
          Email delivery logs: <strong>90 days</strong>.
        </li>
        <li>
          Anonymous IP fingerprints (abuse limiting): <strong>24 hours</strong>.
        </li>
      </ul>
    ),
  },
  {
    id: "partilha",
    title: "Who we share it with",
    body: (
      <>
        <p>
          We do not sell personal data. We only share what is necessary with providers that process
          data on our behalf under data processing agreements:
        </p>
        <div className="legal-table">
          <table>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Service</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Supabase</td>
                <td>Database, authentication and image storage</td>
                <td>EU (Frankfurt, Germany)</td>
              </tr>
              <tr>
                <td>Cloudflare</td>
                <td>Website hosting and delivery, anti-spam protection (Turnstile)</td>
                <td>Global network; US company</td>
              </tr>
              <tr>
                <td>Resend</td>
                <td>Sending transactional emails</td>
                <td>USA</td>
              </tr>
              <tr>
                <td>Google Fonts</td>
                <td>Website fonts (receives the visitor's IP address)</td>
                <td>USA</td>
              </tr>
              <tr>
                <td>Carriers</td>
                <td>Order delivery (name, address, phone)</td>
                <td>Depending on destination</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Transfers outside the European Economic Area are made under the EU-US Data Privacy
          Framework or standard contractual clauses approved by the European Commission. We may also
          disclose data to authorities where required by law.
        </p>
      </>
    ),
  },
  {
    id: "direitos",
    title: "Your rights",
    body: (
      <>
        <p>
          You may request access, rectification, erasure, restriction of processing and portability
          of your data, object to processing based on legitimate interest and withdraw consent at any
          time. Send your request to {mail}; we reply within one month at the latest. Billing data
          cannot be erased before the end of the legal retention period.
        </p>
        <p>
          You also have the right to lodge a complaint with the Portuguese data protection
          authority, CNPD (
          <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer">
            www.cnpd.pt
          </a>
          ), or with the supervisory authority of your country of residence.
        </p>
      </>
    ),
  },
  {
    id: "seguranca",
    title: "Security",
    body: (
      <p>
        All traffic is encrypted (HTTPS). Access to data is restricted by database-level security
        rules: each customer only sees their own orders and only authorised staff can access the
        back office. Card payments, when available, are processed directly by the payment provider —
        we do not store card data.
      </p>
    ),
  },
  {
    id: "cookies",
    title: "Cookies",
    body: (
      <p>
        We only use storage that is essential for the website to work. Details and your options are
        in the <Link to="/cookies">Cookie Policy</Link>.
      </p>
    ),
  },
  {
    id: "menores",
    title: "Minors",
    body: <p>This website is intended for people aged 16 and over. We do not knowingly collect data from minors.</p>,
  },
  {
    id: "alteracoes",
    title: "Changes",
    body: (
      <p>
        We may update this policy to reflect changes in the law or in our services. The date of the
        last update is shown at the top of the page.
      </p>
    ),
  },
];

function PrivacidadePage() {
  const { locale } = useI18n();
  return locale === "en" ? (
    <LegalPage label="Legal · GDPR" title="Privacy policy" sections={sectionsEn} />
  ) : (
    <LegalPage label="Legal · RGPD" title="Política de privacidade" sections={sectionsPt} />
  );
}
