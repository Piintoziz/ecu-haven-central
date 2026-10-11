import { createFileRoute, Link } from "@tanstack/react-router";
import { CookieSettingsButton } from "@/components/site/cookie-consent";
import { LegalPage, type LegalSection } from "@/components/site/legal-page";
import { headI18n, useI18n } from "@/lib/i18n";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/cookies")({
  head: ({ match }) => {
    const { locale } = headI18n(match);
    return pageHead({
      title: locale === "en" ? "Cookie policy" : "Política de cookies",
      description:
        locale === "en"
          ? "Which cookies and local storage the website uses, why, and how to change your preferences."
          : "Que cookies e armazenamento local o site usa, para quê e como alterar as suas preferências.",
      path: "/cookies",
      locale,
    });
  },
  component: CookiesPage,
});

type Row = [name: string, purpose: string, type: string, duration: string];

const ESSENTIAL_PT: Row[] = [
  [
    "centralinas.cart.v1",
    "Guarda os artigos do carrinho",
    "Armazenamento local",
    "Até esvaziar o carrinho",
  ],
  [
    "centralinas.auth",
    "Mantém a sessão da conta de cliente",
    "Armazenamento local",
    "Até terminar a sessão",
  ],
  [
    "centralinas.consent.v1",
    "Guarda as suas escolhas de cookies",
    "Armazenamento local",
    "12 meses",
  ],
  ["lang", "Guarda o idioma escolhido (PT/EN)", "Cookie", "12 meses"],
  [
    "cf_clearance, __cf_bm",
    "Proteção anti-spam e anti-bot (Cloudflare)",
    "Cookie",
    "Até 30 minutos / sessão",
  ],
];

const sectionsPt: LegalSection[] = [
  {
    id: "o-que-sao",
    title: "O que são cookies",
    body: (
      <p>
        Cookies e armazenamento local são pequenos ficheiros guardados no seu navegador. Alguns são
        indispensáveis ao funcionamento do site; outros servem para estatística ou publicidade e só
        são usados com o seu consentimento.
      </p>
    ),
  },
  {
    id: "essenciais",
    title: "Cookies essenciais (sempre ativos)",
    body: (
      <>
        <p>Não exigem consentimento por serem estritamente necessários ao serviço que pediu:</p>
        <div className="legal-table">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Finalidade</th>
                <th>Tipo</th>
                <th>Duração</th>
              </tr>
            </thead>
            <tbody>
              {ESSENTIAL_PT.map(([name, purpose, type, duration]) => (
                <tr key={name}>
                  <td className="font-mono text-xs">{name}</td>
                  <td>{purpose}</td>
                  <td>{type}</td>
                  <td>{duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: "opcionais",
    title: "Estatística e marketing",
    body: (
      <p>
        <strong>Atualmente não usamos</strong> ferramentas de estatística, publicidade ou redes
        sociais que coloquem cookies. Se o fizermos, esta página será atualizada e essas ferramentas
        só serão ativadas depois de as autorizar.
      </p>
    ),
  },
  {
    id: "gerir",
    title: "Gerir as suas preferências",
    body: (
      <>
        <p>Pode rever ou retirar o consentimento a qualquer momento:</p>
        <p>
          <CookieSettingsButton className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90" />
        </p>
        <p>
          Também pode apagar cookies e armazenamento local nas definições do seu navegador; nesse
          caso o carrinho e a sessão serão perdidos.
        </p>
      </>
    ),
  },
  {
    id: "mais",
    title: "Mais informação",
    body: (
      <p>
        Saiba como tratamos os seus dados na <Link to="/privacidade">Política de Privacidade</Link>.
      </p>
    ),
  },
];

const ESSENTIAL_EN: Row[] = [
  ["centralinas.cart.v1", "Stores the items in your cart", "Local storage", "Until the cart is emptied"],
  ["centralinas.auth", "Keeps your customer account signed in", "Local storage", "Until you sign out"],
  ["centralinas.consent.v1", "Stores your cookie choices", "Local storage", "12 months"],
  ["lang", "Remembers the language you chose (PT/EN)", "Cookie", "12 months"],
  ["cf_clearance, __cf_bm", "Anti-spam and anti-bot protection (Cloudflare)", "Cookie", "Up to 30 minutes / session"],
];

const sectionsEn: LegalSection[] = [
  {
    id: "o-que-sao",
    title: "What cookies are",
    body: (
      <p>
        Cookies and local storage are small files stored in your browser. Some are essential for the
        website to work; others are used for analytics or advertising and are only used with your
        consent.
      </p>
    ),
  },
  {
    id: "essenciais",
    title: "Essential cookies (always active)",
    body: (
      <>
        <p>They do not require consent because they are strictly necessary for the service you requested:</p>
        <div className="legal-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Purpose</th>
                <th>Type</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {ESSENTIAL_EN.map(([name, purpose, type, duration]) => (
                <tr key={name}>
                  <td className="font-mono text-xs">{name}</td>
                  <td>{purpose}</td>
                  <td>{type}</td>
                  <td>{duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: "opcionais",
    title: "Analytics and marketing",
    body: (
      <p>
        <strong>We currently do not use</strong> any analytics, advertising or social media tools
        that set cookies. If we do, this page will be updated and those tools will only be enabled
        after you authorise them.
      </p>
    ),
  },
  {
    id: "gerir",
    title: "Managing your preferences",
    body: (
      <>
        <p>You can review or withdraw your consent at any time:</p>
        <p>
          <CookieSettingsButton className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90" />
        </p>
        <p>
          You can also delete cookies and local storage in your browser settings; in that case your
          cart and session will be lost.
        </p>
      </>
    ),
  },
  {
    id: "mais",
    title: "More information",
    body: (
      <p>
        Learn how we process your data in the <Link to="/privacidade">Privacy Policy</Link>.
      </p>
    ),
  },
];

function CookiesPage() {
  const { locale } = useI18n();
  return locale === "en" ? (
    <LegalPage label="Legal" title="Cookie policy" sections={sectionsEn} />
  ) : (
    <LegalPage label="Legal" title="Política de cookies" sections={sectionsPt} />
  );
}
