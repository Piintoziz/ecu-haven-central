// Leitura do Excel de stock da equipa (uma folha por marca: Quantidade ·
// Referência · Código) e conversão para linhas de import_stock.
// Corre só no browser do staff; a validação final é feita na BD.
import { strFromU8, unzipSync } from "fflate";
import { parseCsv } from "./csv";
import { normalizeReference } from "./format";
import type { StockImportRow } from "./admin";

export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export type RawSheet = { name: string; rows: string[][] };

// ---------------------------------------------------------------------------
// Leitura de .xlsx (ZIP + XML) sem bibliotecas pesadas
// ---------------------------------------------------------------------------
function colIndex(ref: string): number {
  const letters = /^[A-Z]+/.exec(ref)?.[0] ?? "A";
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function texts(el: Element): string {
  return Array.from(el.getElementsByTagName("t"))
    .map((t) => t.textContent ?? "")
    .join("");
}

export function readXlsx(buffer: ArrayBuffer): RawSheet[] {
  const files = unzipSync(new Uint8Array(buffer), {
    // só os XML necessários e nada descomunal (proteção contra "zip bombs")
    filter: (f) =>
      f.originalSize < 60 * 1024 * 1024 &&
      (f.name === "xl/workbook.xml" ||
        f.name === "xl/_rels/workbook.xml.rels" ||
        f.name === "xl/sharedStrings.xml" ||
        /^xl\/worksheets\/sheet\d+\.xml$/.test(f.name)),
  });
  const parse = (name: string) => {
    const raw = files[name];
    return raw ? new DOMParser().parseFromString(strFromU8(raw), "application/xml") : null;
  };

  const shared = Array.from(parse("xl/sharedStrings.xml")?.getElementsByTagName("si") ?? []).map(texts);
  const rels = new Map(
    Array.from(parse("xl/_rels/workbook.xml.rels")?.getElementsByTagName("Relationship") ?? []).map((r) => [
      r.getAttribute("Id") ?? "",
      (r.getAttribute("Target") ?? "").replace(/^\/?(xl\/)?/, "xl/"),
    ]),
  );
  const workbook = parse("xl/workbook.xml");
  if (!workbook) throw new Error("Ficheiro Excel inválido.");

  const sheets: RawSheet[] = [];
  for (const sh of Array.from(workbook.getElementsByTagName("sheet"))) {
    const rid =
      sh.getAttribute("r:id") ??
      sh.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") ??
      "";
    const doc = parse(rels.get(rid) ?? "");
    if (!doc) continue;
    const rows: string[][] = [];
    for (const row of Array.from(doc.getElementsByTagName("row"))) {
      const cells: string[] = [];
      for (const c of Array.from(row.getElementsByTagName("c"))) {
        const t = c.getAttribute("t");
        const v = c.getElementsByTagName("v")[0]?.textContent ?? "";
        const value =
          t === "s" ? (shared[Number(v)] ?? "") : t === "inlineStr" ? texts(c) : v;
        cells[colIndex(c.getAttribute("r") ?? "A")] = value;
      }
      if (cells.some((x) => x && x.trim())) rows.push(Array.from(cells, (x) => x ?? ""));
    }
    sheets.push({ name: sh.getAttribute("name") ?? `Folha ${sheets.length + 1}`, rows });
  }
  return sheets;
}

export async function readStockFile(file: File): Promise<RawSheet[]> {
  if (file.size > MAX_FILE_BYTES) throw new Error("Ficheiro acima de 20 MB.");
  if (/\.xlsx$/i.test(file.name)) return readXlsx(await file.arrayBuffer());
  if (/\.csv$/i.test(file.name)) return [{ name: file.name.replace(/\.csv$/i, ""), rows: parseCsv(await file.text()) }];
  if (/\.xls$/i.test(file.name)) throw new Error("Formato .xls antigo: abra no Excel e guarde como .xlsx.");
  throw new Error("Use um ficheiro .xlsx ou .csv.");
}

// ---------------------------------------------------------------------------
// Folha -> marca(s)
// ---------------------------------------------------------------------------
export type SheetTarget =
  | { kind: "ignore" }
  | { kind: "brands"; brands: string[]; category?: string; notes?: string; label: string };

export const PRESETS: Record<string, SheetTarget> = {
  vag: { kind: "brands", brands: ["volkswagen", "audi", "seat", "skoda"], label: "Grupo VAG (VW · Audi · Seat · Skoda)" },
  psa: { kind: "brands", brands: ["peugeot", "citroen"], label: "PSA (Peugeot · Citroën)" },
  "psa-bsi": {
    kind: "brands",
    brands: ["peugeot", "citroen"],
    category: "conforto",
    label: "PSA — módulos BSI/conforto",
  },
  "truck-mercedes": { kind: "brands", brands: ["mercedes-benz"], category: "pesados", label: "Camiões Mercedes-Benz" },
  "truck-volvo": { kind: "brands", brands: ["volvo"], category: "pesados", label: "Camiões Volvo" },
  gas: { kind: "brands", brands: [], notes: "Centralina de gás (GPL).", label: "Centralinas de gás (GPL)" },
};

const ALIASES: [RegExp, string][] = [
  [/^cami(o|a)(e?s)?\s*mercedes/, "preset:truck-mercedes"],
  [/^cami(o|a)(e?s)?\s*volvo/, "preset:truck-volvo"],
  [/gas|gpl/, "preset:gas"],
  [/^(bci|bsi)/, "preset:psa-bsi"],
  [/^(grupo\s*)?vag|^vw\s*group/, "preset:vag"],
  [/^psa|^peugeot\s*citroen/, "preset:psa"],
  [/^alfa|^alpha/, "brand:alfa-romeo"],
  [/^mercedes|^merc/, "brand:mercedes-benz"],
  [/^hyun|^hund|^hunday/, "brand:hyundai"],
  [/^mitsu/, "brand:mitsubishi"],
  [/^rena|^reno/, "brand:renault"],
  [/^daiha/, "brand:daihatsu"],
  [/^pors|^porc/, "brand:porsche"],
  [/^jip|^jeep/, "brand:jeep"],
  [/^land\s*rover/, "brand:land-rover"],
  [/^citro/, "brand:citroen"],
  [/^volks|^vw$/, "brand:volkswagen"],
  [/^chevr/, "brand:chevrolet"],
];

function cleanSheetName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s*\d+\s*$/, "") // "opel 2 " -> "opel"
    .trim();
}

/** Valor do seletor: "brand:<slug>" | "preset:<id>" | "ignore" | "" (por decidir). */
export function guessSheetTarget(name: string, brandSlugs: Set<string>): string {
  const n = cleanSheetName(name);
  const slug = n.replace(/[^a-z0-9]+/g, "-");
  for (const [re, target] of ALIASES) if (re.test(n)) return target;
  if (brandSlugs.has(slug)) return `brand:${slug}`;
  return "";
}

export function resolveTarget(value: string, brandNames: Map<string, string>): SheetTarget | null {
  if (value === "ignore") return { kind: "ignore" };
  if (value.startsWith("preset:")) return PRESETS[value.slice(7)] ?? null;
  if (value.startsWith("brand:")) {
    const slug = value.slice(6);
    return { kind: "brands", brands: [slug], label: brandNames.get(slug) ?? slug };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Limpeza das linhas
// ---------------------------------------------------------------------------
const NUMERIC = /^-?\d+(\.\d+)?(e[+-]?\d+)?$/i;
const BOSCH_9 = /^2(61|81|80|27|60|65|85|86)\d{6}$/;

/** "1.619955E7" -> "16199550"; "85.0" -> "85"; Bosch sem zero -> "0 261205005". */
function fixExcelNumber(value: string): { value: string; fixed: boolean } {
  const v = value.trim();
  if (!NUMERIC.test(v)) return { value: v, fixed: false };
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || Math.abs(n) > Number.MAX_SAFE_INTEGER) {
    return { value: v, fixed: false };
  }
  let out = String(n);
  if (BOSCH_9.test(out)) out = `0 ${out}`;
  return { value: out, fixed: out !== v };
}

/** "0 261203650/651" -> principal + alternativa "0 261203651" */
function splitPair(ref: string): { main: string; alt: string | null } {
  const m = /^(.*\d)\s*[/(]\s*(\d{1,4})\s*\)?$/.exec(ref);
  if (!m) return { main: ref, alt: null };
  const main = m[1]!.trim();
  const suffix = m[2]!;
  if (suffix.length >= main.replace(/\D/g, "").length) return { main: ref, alt: null };
  return { main, alt: main.slice(0, main.length - suffix.length) + suffix };
}

const HEADERS: Record<"quantity" | "reference" | "code" | "price" | "brand" | "condition", RegExp> = {
  quantity: /^(quantidades?|qtd|qty|quant|stock|unidades)$/,
  reference: /^(referencias?|ref|refs|part\s*number|hardware)$/,
  code: /^(codigos?|code|cod)$/,
  price: /^(preco|precos|pvp|price|valor)$/,
  brand: /^(marca|marcas|brand)$/,
  condition: /^(estado|condicao)$/,
};

function headerKey(cell: string) {
  const n = cell
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .trim();
  return (Object.keys(HEADERS) as (keyof typeof HEADERS)[]).find((k) => HEADERS[k].test(n));
}

export type SheetSummary = {
  name: string;
  rows: number;
  units: number;
  skipped: number;
  hasHeader: boolean;
};

export type ImportPlan = {
  items: (StockImportRow & { key: string })[];
  sheets: SheetSummary[];
  stats: {
    rows: number;
    units: number;
    products: number;
    merged: number;
    numericFixed: number;
    refFromCode: number;
    pairs: number;
    noQuantity: number;
    withPrice: number;
  };
  warnings: string[];
};

function mapCondition(v: string): StockImportRow["condition"] | undefined {
  const n = v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  if (!n) return undefined;
  if (/^nov|^new/.test(n)) return "new";
  if (/^recond|^reman/.test(n)) return "reconditioned";
  return "used_tested";
}

export function buildPlan(
  sheets: RawSheet[],
  targets: Record<string, string>,
  brandNames: Map<string, string>,
  opts: { active: boolean },
): ImportPlan {
  const byKey = new Map<string, StockImportRow & { key: string }>();
  const summaries: SheetSummary[] = [];
  const warnings: string[] = [];
  const stats = { rows: 0, units: 0, products: 0, merged: 0, numericFixed: 0, refFromCode: 0, pairs: 0, noQuantity: 0, withPrice: 0 };
  const brandSlugByName = new Map([...brandNames].map(([slug, name]) => [name.toLowerCase(), slug]));

  for (const sheet of sheets) {
    const target = resolveTarget(targets[sheet.name] ?? "", brandNames);
    const summary: SheetSummary = { name: sheet.name, rows: 0, units: 0, skipped: 0, hasHeader: false };
    summaries.push(summary);
    if (!target || target.kind === "ignore") continue;

    // cabeçalho: primeira linha (das 5 primeiras) que tenha "referência"
    let headerAt = -1;
    let cols: Partial<Record<keyof typeof HEADERS, number>> = {};
    for (let i = 0; i < Math.min(5, sheet.rows.length); i++) {
      const found: typeof cols = {};
      sheet.rows[i]!.forEach((cell, idx) => {
        const k = headerKey(cell ?? "");
        if (k && found[k] === undefined) found[k] = idx;
      });
      if (found.reference !== undefined) {
        headerAt = i;
        cols = found;
        break;
      }
    }
    // sem cabeçalho: formato da equipa (A quantidade · B referência · C código)
    if (headerAt < 0) cols = { quantity: 0, reference: 1, code: 2 };
    summary.hasHeader = headerAt >= 0;

    for (const row of sheet.rows.slice(headerAt + 1)) {
      const cell = (k: keyof typeof HEADERS) => (cols[k] !== undefined ? (row[cols[k]!] ?? "").trim() : "");
      let refRaw = cell("reference");
      let codeRaw = cell("code");
      if (!refRaw && codeRaw) {
        refRaw = codeRaw;
        codeRaw = "";
        stats.refFromCode++;
      }
      if (!refRaw) {
        if (row.some((c) => c && c.trim())) summary.skipped++;
        continue;
      }

      const ref = fixExcelNumber(refRaw);
      const code = fixExcelNumber(codeRaw);
      if (ref.fixed) stats.numericFixed++;
      const { main, alt } = splitPair(ref.value.replace(/\s+/g, " "));
      if (alt) stats.pairs++;

      const qRaw = cell("quantity").replace(",", ".");
      let quantity = Math.round(Number(qRaw));
      if (!qRaw) {
        quantity = 1;
        stats.noQuantity++;
      } else if (!Number.isFinite(quantity) || quantity < 0) {
        warnings.push(`${sheet.name}: quantidade inválida “${qRaw}” em ${main} — assumido 1`);
        quantity = 1;
      }

      // marca por linha (CSV com coluna "marca") tem prioridade sobre a folha
      let brands = target.brands;
      const rowBrand = cell("brand");
      if (rowBrand) {
        const slug = brandSlugByName.get(rowBrand.toLowerCase());
        if (slug) brands = [slug];
      }

      const priceRaw = cell("price").replace(/[€\s]/g, "");
      const price = priceRaw ? (priceRaw.includes(",") ? priceRaw.replace(/\./g, "").replace(",", ".") : priceRaw) : "";

      const key = `${normalizeReference(main)}#${normalizeReference(code.value)}`;
      summary.rows++;
      summary.units += quantity;
      stats.rows++;
      stats.units += quantity;

      const existing = byKey.get(key);
      if (existing) {
        stats.merged++;
        existing.quantity += quantity;
        existing.brands = [...new Set([...existing.brands, ...brands])];
        if (alt && !existing.alt_refs.includes(alt)) existing.alt_refs.push(alt);
        if (!existing.price_eur && price) existing.price_eur = price;
        continue;
      }
      byKey.set(key, {
        key,
        brands: [...brands],
        reference: main.slice(0, 64),
        alt_refs: alt ? [alt] : [],
        code: code.value.slice(0, 40),
        quantity,
        ...(price && !Number.isNaN(Number(price)) ? { price_eur: price } : {}),
        ...(target.category ? { category: target.category } : {}),
        ...(target.notes ? { notes: target.notes } : {}),
        ...(mapCondition(cell("condition")) ? { condition: mapCondition(cell("condition")) } : {}),
        active: opts.active,
      });
    }
  }

  const items = [...byKey.values()];
  stats.products = items.length;
  stats.withPrice = items.filter((i) => i.price_eur).length;
  return { items, sheets: summaries, stats, warnings };
}
