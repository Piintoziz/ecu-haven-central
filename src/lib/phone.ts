// Indicativos e comprimento do número nacional (sem o indicativo) por país.
// Usado no checkout/contactos: o cliente escolhe o país e só pode escrever dígitos
// até ao máximo permitido. O servidor valida o mesmo (phoneSchema em schemas.ts).

export type PhoneCountry = { code: string; dial: string; min: number; max: number };

// [país, indicativo, mín, máx] — comprimentos do plano de numeração nacional (sem 0 inicial de tronco).
const RAW: [string, string, number, number][] = [
  ["PT", "351", 9, 9], ["ES", "34", 9, 9], ["FR", "33", 9, 9], ["DE", "49", 6, 13], ["IT", "39", 6, 11],
  ["BE", "32", 8, 9], ["NL", "31", 9, 9], ["LU", "352", 6, 11], ["AT", "43", 4, 13], ["IE", "353", 7, 9],
  ["PL", "48", 9, 9], ["CZ", "420", 9, 9], ["SK", "421", 9, 9], ["SI", "386", 8, 8], ["HR", "385", 8, 9],
  ["HU", "36", 8, 9], ["RO", "40", 9, 9], ["BG", "359", 8, 9], ["GR", "30", 10, 10], ["CY", "357", 8, 8],
  ["MT", "356", 8, 8], ["DK", "45", 8, 8], ["SE", "46", 7, 10], ["FI", "358", 5, 12], ["EE", "372", 7, 8],
  ["LV", "371", 8, 8], ["LT", "370", 8, 8], ["GB", "44", 9, 10], ["CH", "41", 9, 9], ["NO", "47", 8, 8],
  ["IS", "354", 7, 7], ["AD", "376", 6, 9], ["MC", "377", 8, 9], ["LI", "423", 7, 9], ["SM", "378", 6, 10],
  ["AL", "355", 8, 9], ["BA", "387", 8, 9], ["RS", "381", 8, 9], ["ME", "382", 8, 8], ["MK", "389", 8, 8],
  ["MD", "373", 8, 8], ["UA", "380", 9, 9], ["TR", "90", 10, 10], ["AO", "244", 9, 9], ["MZ", "258", 8, 9],
  ["CV", "238", 7, 7], ["ST", "239", 7, 7], ["GW", "245", 7, 9], ["BR", "55", 10, 11], ["US", "1", 10, 10],
  ["CA", "1", 10, 10], ["MX", "52", 10, 10], ["AR", "54", 10, 11], ["CL", "56", 9, 9], ["CO", "57", 10, 10],
  ["MA", "212", 9, 9], ["TN", "216", 8, 8], ["ZA", "27", 9, 9], ["AE", "971", 8, 9], ["SA", "966", 9, 9],
  ["IL", "972", 8, 9], ["AU", "61", 9, 9], ["NZ", "64", 8, 10],
];

export const PHONE_COUNTRIES: PhoneCountry[] = RAW.map(([code, dial, min, max]) => ({ code, dial, min, max }));

const BY_CODE = new Map(PHONE_COUNTRIES.map((c) => [c.code, c]));

export function phoneCountry(code: string | null | undefined): PhoneCountry {
  return BY_CODE.get((code ?? "").toUpperCase()) ?? BY_CODE.get("PT")!;
}

/** Só dígitos, sem o 0 de tronco inicial (ex.: UK 07… -> 7…), cortado ao máximo do país. */
export function cleanNational(input: string, c: PhoneCountry): string {
  let d = input.replace(/\D/g, "");
  if (d.startsWith(c.dial) && d.length > c.max) d = d.slice(c.dial.length); // colou com indicativo
  if (c.code !== "IT") d = d.replace(/^0+/, "");
  return d.slice(0, c.max);
}

/** Formato E.164: +351912345678 */
export function toE164(c: PhoneCountry, national: string): string {
  return `+${c.dial}${national}`;
}

/** Separa um E.164 guardado (ex.: perfil) em país + número; null se não reconhecer. */
export function parseE164(value: string, preferCode?: string): { code: string; national: string } | null {
  const v = value.replace(/[^\d+]/g, "");
  if (!v.startsWith("+")) return null;
  const digits = v.slice(1);
  const pref = preferCode ? BY_CODE.get(preferCode) : undefined;
  const candidates = [...(pref ? [pref] : []), ...PHONE_COUNTRIES].filter((c) => digits.startsWith(c.dial));
  // indicativo mais longo primeiro (ex.: 351 antes de 3x)
  candidates.sort((a, b) => b.dial.length - a.dial.length);
  const c = candidates[0];
  return c ? { code: c.code, national: digits.slice(c.dial.length) } : null;
}

/** Validação partilhada (cliente e servidor). */
export function isValidE164(value: string): boolean {
  const p = parseE164(value);
  if (!p) return false;
  const c = phoneCountry(p.code);
  return /^\d+$/.test(p.national) && p.national.length >= c.min && p.national.length <= c.max;
}

