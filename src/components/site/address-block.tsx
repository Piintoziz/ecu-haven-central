import { COUNTRIES } from "@/lib/countries";
import { useT } from "@/lib/i18n";

export type AddressLike = {
  full_name: string;
  company_name?: string | null;
  line1: string;
  line2?: string | null;
  postal_code: string;
  city: string;
  region?: string | null;
  country_code: string;
};

export function countryName(code: string | null | undefined): string {
  if (!code) return "—";
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

export function AddressBlock({
  title,
  address,
}: {
  title: string;
  address: AddressLike | null | undefined;
}) {
  const t = useT();
  return (
    <div>
      <h3 className="mono-label mb-2">{title}</h3>
      {address ? (
        <address className="text-sm not-italic leading-relaxed">
          <span className="font-semibold">{address.full_name}</span>
          {address.company_name && (
            <span className="block text-muted-foreground">{address.company_name}</span>
          )}
          <span className="block">{address.line1}</span>
          {address.line2 && <span className="block">{address.line2}</span>}
          <span className="block">
            {address.postal_code} {address.city}
            {address.region ? `, ${address.region}` : ""}
          </span>
          <span className="block">{t.common.country(address.country_code)}</span>
        </address>
      ) : (
        <p className="text-sm text-muted-foreground">—</p>
      )}
    </div>
  );
}
