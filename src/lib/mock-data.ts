// TODO(backend): substituir por chamadas reais à API assim que o backend
// (autenticação, catálogo, carrinho, encomendas) estiver disponível.
// Neste momento tudo é mock estático apenas para efeitos de UI/UX.

export type Availability = "in-stock" | "on-order" | "out-of-stock";
export type Condition = "recondicionado" | "usado" | "novo";

export interface Product {
  id: string;
  oem: string;
  title: string;
  brand: string; // fabricante da centralina (Bosch, Siemens…)
  category: CategoryId;
  make: string; // marca do carro
  models: string[];
  year: string;
  engine: string;
  price: number;
  availability: Availability;
  condition: Condition;
  warrantyMonths: number;
  image: string;
  description: string;
}

export type CategoryId =
  | "motor"
  | "abs"
  | "airbag"
  | "transmissao"
  | "conforto"
  | "imobilizador";

export interface Category {
  id: CategoryId;
  name: string;
  shortCode: string;
  description: string;
  count: number;
}

export const categories: Category[] = [
  {
    id: "motor",
    shortCode: "ECU",
    name: "Centralinas de Motor",
    description: "Gestão de motor Diesel e Gasolina — EDC16, EDC17, MED17, SID.",
    count: 85402,
  },
  {
    id: "abs",
    shortCode: "ABS",
    name: "Módulos ABS / ESP",
    description: "Bombas hidráulicas e módulos de travagem e estabilidade.",
    count: 12190,
  },
  {
    id: "airbag",
    shortCode: "SRS",
    name: "Módulos Airbag",
    description: "Unidades SRS, sensores de impacto e pretensores.",
    count: 4800,
  },
  {
    id: "transmissao",
    shortCode: "TCU",
    name: "Caixa de Velocidades",
    description: "TCU para caixas automáticas, DSG, PDK e CVT.",
    count: 6720,
  },
  {
    id: "conforto",
    shortCode: "BCM",
    name: "Conforto & BCM",
    description: "Módulos de conforto, luzes, vidros e climatização.",
    count: 9840,
  },
  {
    id: "imobilizador",
    shortCode: "IMO",
    name: "Imobilizador & Chaves",
    description: "Módulos de imobilizador, transponders e Kessy.",
    count: 3210,
  },
];

export const carBrands = [
  "Volkswagen",
  "Audi",
  "BMW",
  "Mercedes-Benz",
  "Peugeot",
  "Citroën",
  "Renault",
  "Ford",
  "Opel",
  "Fiat",
  "Toyota",
  "Nissan",
  "Seat",
  "Skoda",
  "Volvo",
  "Mini",
];

export const products: Product[] = [
  {
    id: "prd-0001",
    oem: "0281016000",
    title: "Bosch EDC17C46",
    brand: "Bosch",
    category: "motor",
    make: "Volkswagen",
    models: ["Golf VI 2.0 TDI", "Passat B7 2.0 TDI"],
    year: "2010–2015",
    engine: "2.0 TDI CFFB",
    price: 425,
    availability: "in-stock",
    condition: "recondicionado",
    warrantyMonths: 12,
    image: "",
    description:
      "Centralina de motor Bosch EDC17C46 recondicionada em laboratório. Testada em bancada e pronta a instalar.",
  },
  {
    id: "prd-0002",
    oem: "8E0909561",
    title: "Siemens Simos 3.3",
    brand: "Siemens",
    category: "motor",
    make: "Audi",
    models: ["A4 B6 1.8T"],
    year: "2001–2005",
    engine: "1.8T AVJ",
    price: 289,
    availability: "in-stock",
    condition: "usado",
    warrantyMonths: 6,
    image: "",
    description:
      "Centralina Simos 3.3 usada, testada e com garantia. Compatibilidade validada por número OEM.",
  },
  {
    id: "prd-0003",
    oem: "9678385480",
    title: "Siemens SID807EVO",
    brand: "Siemens",
    category: "motor",
    make: "Peugeot",
    models: ["308 1.6 HDi", "3008 1.6 HDi", "Ford Focus 1.6 TDCi"],
    year: "2010–2016",
    engine: "1.6 HDi DV6C",
    price: 380,
    availability: "on-order",
    condition: "recondicionado",
    warrantyMonths: 12,
    image: "",
    description:
      "SID807EVO reprogramável, com virginização disponível a pedido.",
  },
  {
    id: "prd-0004",
    oem: "28414561",
    title: "Delphi DCM6.2",
    brand: "Delphi",
    category: "motor",
    make: "Mercedes-Benz",
    models: ["C220 CDI W204", "E220 CDI W212"],
    year: "2009–2014",
    engine: "2.2 CDI OM651",
    price: 550,
    availability: "in-stock",
    condition: "recondicionado",
    warrantyMonths: 12,
    image: "",
    description:
      "Delphi DCM6.2 para motores OM651. Reprogramação sob consulta.",
  },
  {
    id: "prd-0005",
    oem: "0265231234",
    title: "Bosch ABS 8.0",
    brand: "Bosch",
    category: "abs",
    make: "Volkswagen",
    models: ["Golf V", "Touran"],
    year: "2004–2010",
    engine: "-",
    price: 210,
    availability: "in-stock",
    condition: "usado",
    warrantyMonths: 6,
    image: "",
    description: "Bomba/módulo ABS 8.0 recondicionado com bloco hidráulico testado.",
  },
  {
    id: "prd-0006",
    oem: "6Q0909605",
    title: "Módulo Airbag Siemens 5WK4",
    brand: "Siemens",
    category: "airbag",
    make: "Seat",
    models: ["Ibiza 6L", "Skoda Fabia I"],
    year: "2002–2008",
    engine: "-",
    price: 95,
    availability: "in-stock",
    condition: "recondicionado",
    warrantyMonths: 12,
    image: "",
    description: "Módulo airbag apagado e pronto a instalar. Crash data limpa.",
  },
  {
    id: "prd-0007",
    oem: "09G927750",
    title: "TCU Aisin TF-60SN",
    brand: "Aisin",
    category: "transmissao",
    make: "Audi",
    models: ["A3 8P 2.0 TDI"],
    year: "2005–2012",
    engine: "2.0 TDI",
    price: 645,
    availability: "on-order",
    condition: "recondicionado",
    warrantyMonths: 12,
    image: "",
    description: "TCU para caixa automática TF-60SN, adaptação necessária no veículo.",
  },
  {
    id: "prd-0008",
    oem: "3C0937049",
    title: "BCM Volkswagen Passat B6",
    brand: "VW",
    category: "conforto",
    make: "Volkswagen",
    models: ["Passat B6"],
    year: "2005–2010",
    engine: "-",
    price: 175,
    availability: "in-stock",
    condition: "usado",
    warrantyMonths: 6,
    image: "",
    description: "Body Control Module recondicionado, testado com VCDS.",
  },
  {
    id: "prd-0009",
    oem: "5WY7000B",
    title: "Imobilizador Kessy Audi A6 C6",
    brand: "Continental",
    category: "imobilizador",
    make: "Audi",
    models: ["A6 C6"],
    year: "2004–2011",
    engine: "-",
    price: 320,
    availability: "in-stock",
    condition: "recondicionado",
    warrantyMonths: 12,
    image: "",
    description: "Módulo Kessy virgem, pronto a codificar ao veículo.",
  },
  {
    id: "prd-0010",
    oem: "03L906023",
    title: "Bosch EDC17CP14",
    brand: "Bosch",
    category: "motor",
    make: "Volkswagen",
    models: ["Passat B7", "Tiguan 2.0 TDI"],
    year: "2011–2015",
    engine: "2.0 TDI CFF",
    price: 460,
    availability: "in-stock",
    condition: "recondicionado",
    warrantyMonths: 12,
    image: "",
    description: "Recondicionada com atualização de mapa EGR sob pedido.",
  },
  {
    id: "prd-0011",
    oem: "0281017946",
    title: "Bosch EDC17C64",
    brand: "Bosch",
    category: "motor",
    make: "BMW",
    models: ["320d E90", "520d E60"],
    year: "2007–2012",
    engine: "2.0d N47",
    price: 495,
    availability: "in-stock",
    condition: "recondicionado",
    warrantyMonths: 12,
    image: "",
    description: "EDC17C64 testada em bancada BMW. Reprogramação Stage 1 opcional.",
  },
  {
    id: "prd-0012",
    oem: "A0009003802",
    title: "Módulo SAM Mercedes W204",
    brand: "Mercedes-Benz",
    category: "conforto",
    make: "Mercedes-Benz",
    models: ["C-Class W204"],
    year: "2007–2014",
    engine: "-",
    price: 280,
    availability: "on-order",
    condition: "usado",
    warrantyMonths: 6,
    image: "",
    description: "SAM traseiro para W204 — codificação Xentry sob consulta.",
  },
];

export const services = [
  {
    id: "reparacao",
    title: "Reparação de Centralinas",
    icon: "wrench",
    description:
      "Reparação física de componentes eletrónicos: soldadura de chips, substituição de trilhos, driver de injetores e mais.",
  },
  {
    id: "reprogramacao",
    title: "Reprogramação",
    icon: "cpu",
    description:
      "Reprogramação de mapas de motor (Stage 1, eco-tuning) por chip tuning profissional em bancada ou OBD.",
  },
  {
    id: "clonagem",
    title: "Clonagem de Módulos",
    icon: "copy",
    description:
      "Clonagem completa de centralinas de motor, TCU, BCM e módulos afins mantendo a identificação original.",
  },
  {
    id: "imobilizador",
    title: "Remoção de Imobilizador",
    icon: "key",
    description:
      "Virginização de módulos de imobilizador e adaptação de chaves para casos de perda ou substituição.",
  },
  {
    id: "diagnostico",
    title: "Diagnóstico Avançado",
    icon: "activity",
    description:
      "Serviços técnicos de diagnóstico — verificação FAP/DPF, EGR e sondas lambda em bancada.",
  },
  {
    id: "encomenda",
    title: "Envio Rápido 24/48h",
    icon: "truck",
    description:
      "Logística dedicada a oficinas profissionais em Portugal e Europa, com tracking em tempo real.",
  },
] as const;

export const testimonials = [
  {
    name: "João Marques",
    role: "Auto Marques, Braga",
    quote:
      "Encomendo pela referência OEM e recebo no dia seguinte. Poupa-me horas de trabalho todas as semanas.",
  },
  {
    name: "Rita Alves",
    role: "MecânicaPro, Lisboa",
    quote:
      "Centralinas testadas mesmo. Zero devoluções em 2 anos — impensável no mercado das usadas.",
  },
  {
    name: "Nuno Ferreira",
    role: "GarageTech, Porto",
    quote:
      "O serviço de clonagem salvou-me em vários casos de crash data. Rápidos e sempre disponíveis.",
  },
];

export const trackingSteps = [
  { id: "confirmed", label: "Encomenda confirmada" },
  { id: "preparing", label: "Em preparação" },
  { id: "shipped", label: "Enviada" },
  { id: "in-transit", label: "Em trânsito" },
  { id: "delivered", label: "Entregue" },
] as const;

export type TrackingStepId = (typeof trackingSteps)[number]["id"];

export const availabilityLabels: Record<Availability, string> = {
  "in-stock": "Em stock",
  "on-order": "Sob encomenda",
  "out-of-stock": "Esgotado",
};

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}
