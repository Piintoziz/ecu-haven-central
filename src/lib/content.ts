// Conteúdo institucional editável. ÚNICO sítio com contactos e dados legais:
// cabeçalho, rodapé, contactos, páginas legais, emails e JSON-LD leem daqui.
// Valores entre [ ] são marcadores por preencher com os dados reais da empresa.

export const COMPANY = {
  phone: "+351 931 604 415",
  phoneHref: "tel:+351931604415",
  phone2: "+351 967 327 878",
  phone2Href: "tel:+351967327878",
  email: "centralinas@hotmail.com",
  address: "R. Álvaro Ferreira Alves, Armazém 50B, 2855-591 Corroios, Portugal",
  street: "R. Álvaro Ferreira Alves, Armazém 50B",
  postalCode: "2855-591",
  locality: "Corroios",
  region: "Setúbal",
  hours: "Seg–Sex 09h–18h · Sáb 09h–13h",
} as const;

/** Identificação legal do prestador (DL 7/2004, art. 10.º — comércio eletrónico). */
export const LEGAL = {
  legalName: "[Denominação social, Lda.]",
  nipc: "[NIPC]",
  registeredOffice: "[Morada da sede social]",
  registry: "[Conservatória do Registo Comercial de …]",
  shareCapital: "[Capital social] €",
  /** Contacto para pedidos RGPD (pode ser o email geral). */
  privacyEmail: "centralinas@hotmail.com",
  /** Data da última revisão das páginas legais (AAAA-MM-DD). */
  lastUpdated: "2026-10-10",
} as const;

/** Entidades de Resolução Alternativa de Litígios (Lei 144/2015). */
export const RAL_ENTITIES = [
  {
    name: "CASA — Centro de Arbitragem do Setor Automóvel",
    url: "https://www.arbitragemauto.pt",
  },
  {
    name: "CNIACC — Centro Nacional de Informação e Arbitragem de Conflitos de Consumo",
    url: "https://www.cniacc.pt",
  },
] as const;

export const COMPLAINTS_BOOK_URL = "https://www.livroreclamacoes.pt/Inicio/";

export type ServiceId =
  | "diagnostico"
  | "reprogramacao"
  | "reparacao"
  | "quadrantes"
  | "chaves"
  | "adblue"
  | "airbag"
  | "clonagem";

export const SERVICES: {
  id: ServiceId;
  code: string;
  title: string;
  description: string;
  highlights: string[];
  turnaround: string;
}[] = [
  {
    id: "diagnostico",
    code: "DGN",
    title: "Diagnóstico automóvel",
    description:
      "Identificamos a origem da avaria nos sistemas eletrónicos do veículo — sensores, centralinas e cablagem — antes de trocar qualquer peça.",
    highlights: ["Leitura e análise de erros", "Teste de sensores e atuadores", "Relatório técnico"],
    turnaround: "No próprio dia",
  },
  {
    id: "reprogramacao",
    code: "PRG",
    title: "Reprogramação de centralinas",
    description:
      "Atualização e otimização do software da centralina por OBD ou em bancada, sempre com cópia de segurança do ficheiro original.",
    highlights: ["Atualizações de software", "Cópia do original guardada", "OBD ou bancada"],
    turnaround: "1–3 dias úteis",
  },
  {
    id: "reparacao",
    code: "REP",
    title: "Reparação de centralinas",
    description:
      "Reparação em bancada de centralinas de motor, ABS e caixa: alimentação, drivers de injetores, pistas e memórias danificadas.",
    highlights: ["Diagnóstico em bancada", "Orçamento antes de reparar", "Teste final com garantia"],
    turnaround: "3–5 dias úteis",
  },
  {
    id: "quadrantes",
    code: "QDR",
    title: "Reparação de quadrantes",
    description:
      "Corrigimos falhas de iluminação, ponteiros, mostradores e avarias totais do painel de instrumentos — informação fiável durante a condução.",
    highlights: ["Ecrãs e iluminação", "Ponteiros e motores", "Mantém a quilometragem"],
    turnaround: "2–4 dias úteis",
  },
  {
    id: "chaves",
    code: "KEY",
    title: "Chaves e imobilizador",
    description:
      "Programação e codificação de chaves e comandos sincronizados com o imobilizador, e reparação ou recuperação de chaves existentes.",
    highlights: ["Chaves novas e de substituição", "Codificação ao imobilizador", "Reparação de comandos"],
    turnaround: "1–2 dias úteis",
  },
  {
    id: "adblue",
    code: "ADB",
    title: "Reparação de depósito AdBlue",
    description:
      "Reparação do sistema AdBlue — depósito, bomba, aquecedor e placa eletrónica — essencial para o controlo de emissões em motores diesel.",
    highlights: ["Bomba e aquecedor", "Placa eletrónica", "Sensores de nível"],
    turnaround: "2–4 dias úteis",
  },
  {
    id: "airbag",
    code: "SRS",
    title: "Centralinas de airbag",
    description:
      "Reposição de módulos de airbag após colisão ou avaria: apagamos os dados de impacto e testamos a unidade para voltar a funcionar.",
    highlights: ["Apagar crash data", "Teste da unidade", "Reutiliza o módulo original"],
    turnaround: "1–2 dias úteis",
  },
  {
    id: "clonagem",
    code: "CLN",
    title: "Clonagem de módulos",
    description:
      "Transferimos os dados da sua unidade para uma centralina de substituição, incluindo imobilizador — instalação plug & play, sem codificar no carro.",
    highlights: ["EEPROM e flash", "Dados de imobilizador", "Plug & play"],
    turnaround: "2–4 dias úteis",
  },
];

type ServiceText = Pick<(typeof SERVICES)[number], "title" | "description" | "highlights" | "turnaround">;

const SERVICES_EN: Record<ServiceId, ServiceText> = {
  diagnostico: {
    title: "Vehicle diagnostics",
    description:
      "We find the source of faults in the vehicle's electronic systems — sensors, ECUs and wiring — before replacing any part.",
    highlights: ["Fault code reading and analysis", "Sensor and actuator testing", "Technical report"],
    turnaround: "Same day",
  },
  reprogramacao: {
    title: "ECU programming",
    description:
      "ECU software updates and optimisation via OBD or on the bench, always with a backup of the original file.",
    highlights: ["Software updates", "Original file backed up", "OBD or bench"],
    turnaround: "1–3 working days",
  },
  reparacao: {
    title: "ECU repair",
    description:
      "Bench repair of engine, ABS and gearbox ECUs: power supply, injector drivers, damaged tracks and memories.",
    highlights: ["Bench diagnosis", "Quote before repair", "Final test with warranty"],
    turnaround: "3–5 working days",
  },
  quadrantes: {
    title: "Instrument cluster repair",
    description:
      "We fix lighting faults, needles, displays and complete instrument cluster failures — reliable information while you drive.",
    highlights: ["Displays and lighting", "Needles and stepper motors", "Mileage preserved"],
    turnaround: "2–4 working days",
  },
  chaves: {
    title: "Keys and immobiliser",
    description:
      "Programming and coding of keys and remotes synchronised with the immobiliser, plus repair or recovery of existing keys.",
    highlights: ["New and replacement keys", "Immobiliser coding", "Remote repair"],
    turnaround: "1–2 working days",
  },
  adblue: {
    title: "AdBlue tank repair",
    description:
      "Repair of the AdBlue system — tank, pump, heater and control board — essential for emissions control on diesel engines.",
    highlights: ["Pump and heater", "Control board", "Level sensors"],
    turnaround: "2–4 working days",
  },
  airbag: {
    title: "Airbag modules",
    description:
      "Restoring airbag modules after a crash or fault: we clear the crash data and test the unit so it works again.",
    highlights: ["Crash data cleared", "Unit tested", "Reuses the original module"],
    turnaround: "1–2 working days",
  },
  clonagem: {
    title: "Module cloning",
    description:
      "We transfer the data from your unit to a replacement ECU, including the immobiliser — plug & play, no coding in the car.",
    highlights: ["EEPROM and flash", "Immobiliser data", "Plug & play"],
    turnaround: "2–4 working days",
  },
};

/** Serviços no idioma pedido (código e id iguais nas duas línguas). */
export function servicesFor(locale: "pt" | "en"): typeof SERVICES {
  if (locale === "pt") return SERVICES;
  return SERVICES.map((s) => ({ ...s, ...SERVICES_EN[s.id] }));
}

/** Armazém de expedição (remetente nos envios e morada de recolha das transportadoras). */
export const WAREHOUSE = {
  company: "Centralinas",
  contact_name: "Centralinas Expedição",
  street: "R. Álvaro Ferreira Alves, 50B",
  postal_code: "2855-591",
  city: "Corroios",
  country_code: "PT",
  // Usa o telefone e email da empresa; o telefone tem de ser real (a transportadora liga se houver problema na recolha).
  phone: COMPANY.phone,
  email: COMPANY.email,
  /** Hora preferida de recolha (janela da manhã das transportadoras: 09h–14h). */
  pickup_time: "10:30",
  /** Caixa e peso por omissão de uma centralina embalada. */
  default_parcel: { weight_g: 1500, length_cm: 30, width_cm: 22, height_cm: 12 },
} as const;
