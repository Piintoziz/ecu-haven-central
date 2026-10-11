// Parser CSV (RFC 4180) com deteção de separador: o Excel em PT exporta com ";".

export const BOM = String.fromCharCode(0xfeff);

export function detectDelimiter(firstLine: string): "," | ";" | "\t" {
  const counts = { ",": 0, ";": 0, "\t": 0 } as Record<"," | ";" | "\t", number>;
  let inQuotes = false;
  for (const ch of firstLine) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes && ch in counts) counts[ch as "," | ";" | "\t"]++;
  }
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]![0] as "," | ";" | "\t") ?? ",";
}

export function parseCsv(text: string): string[][] {
  const src = text.startsWith(BOM) ? text.slice(1) : text; // BOM do Excel
  const firstLine = src.slice(0, src.search(/\r?\n/) === -1 ? undefined : src.search(/\r?\n/));
  const delim = detectDelimiter(firstLine);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === delim) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

/** Escapa um valor para CSV (inclui proteção contra fórmulas no Excel). */
export function csvCell(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",;\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
