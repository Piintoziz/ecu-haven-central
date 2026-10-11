/** Define um namespace de traduções; o inglês tem de ter exatamente as mesmas chaves. */
export function ns<T>(d: { pt: T; en: NoInfer<T> }): { pt: T; en: T } {
  return d;
}

const eurPt = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });
const eurEn = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
export const money = {
  pt: (cents: number) => eurPt.format(cents / 100),
  en: (cents: number) => eurEn.format(cents / 100),
};
