// Curadoria de imagens (Unsplash) — categorizadas para uso consistente
// TODO(backend): substituir por assets reais da empresa (oficina, stock, equipa)

const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const images = {
  // Hero — motor / detalhe técnico em ambiente escuro
  heroEngine: u("1492144534655-ae79c964c9d7", 2000),
  heroCarDark: u("1583121274602-3e2820c69888", 2000),

  // Sobre — armazém, equipa, oficina
  warehouse: u("1553413077-190dd305871c"),
  workshop: u("1632823471565-1ecdf5c6da77"),
  team: u("1580273916550-e323be2ae537"),

  // Serviços
  reprogramacao: u("1518770660439-4636190af475"),
  reparacao: u("1581092160607-ee22621dd758"),
  clonagem: u("1518770660439-4636190af475"),
  imobilizador: u("1580273916550-e323be2ae537"),
  diagnostico: u("1625047509168-a7026f36de04"),
  envio: u("1601158935942-52255782ef77"),

  // Categorias (fundo subtil)
  motor: u("1486262715619-67b85e0b08d3"),
  abs: u("1600661653561-629509216228"),
  airbag: u("1553440569-bcc63803a83d"),
  transmissao: u("1502877338535-766e1452684a"),
  conforto: u("1552519507-da3b142c6e3d"),
  imobilizadorCat: u("1449965408869-eaa3f722e40d"),

  // Produto (placeholder centralinas)
  ecuGeneric: u("1518770660439-4636190af475", 1200),
} as const;

export const serviceImage: Record<string, string> = {
  reparacao: images.reparacao,
  reprogramacao: images.reprogramacao,
  clonagem: images.clonagem,
  imobilizador: images.imobilizador,
  diagnostico: images.diagnostico,
  encomenda: images.envio,
};

export const categoryImage: Record<string, string> = {
  motor: images.motor,
  abs: images.abs,
  airbag: images.airbag,
  transmissao: images.transmissao,
  conforto: images.conforto,
  imobilizador: images.imobilizadorCat,
};
