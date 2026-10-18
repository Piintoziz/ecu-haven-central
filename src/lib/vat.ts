// Os preços das peças são sem IVA; o IVA soma-se ao subtotal (os portes já são valor final).
// Tem de bater certo com public.place_order (store_settings.vat_rate).
export const VAT_RATE = 23;

export const vatOf = (netCents: number) => Math.round((netCents * VAT_RATE) / 100);
