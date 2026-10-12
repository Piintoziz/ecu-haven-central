// Bandeiras (SVG, pacote country-flag-icons, MIT) só dos países de entrega.
// Importação por nome para o bundle levar apenas estas bandeiras.
import { PT, ES, FR, DE, IT, BE, NL, LU, AT, IE, PL, CZ, SK, SI, HR, HU, RO, BG, GR, CY, MT, DK, SE, FI, EE, LV, LT, GB, CH, NO, IS, AD, MC, LI, SM, AL, BA, RS, ME, MK, MD, UA, TR, AO, MZ, CV, ST, GW, BR, US, CA, MX, AR, CL, CO, MA, TN, ZA, AE, SA, IL, AU, NZ } from "country-flag-icons/react/3x2";
import type { FlagComponent } from "country-flag-icons/react/3x2";
import { cn } from "@/lib/utils";


const FLAGS: Record<string, FlagComponent> = { PT, ES, FR, DE, IT, BE, NL, LU, AT, IE, PL, CZ, SK, SI, HR, HU, RO, BG, GR, CY, MT, DK, SE, FI, EE, LV, LT, GB, CH, NO, IS, AD, MC, LI, SM, AL, BA, RS, ME, MK, MD, UA, TR, AO, MZ, CV, ST, GW, BR, US, CA, MX, AR, CL, CO, MA, TN, ZA, AE, SA, IL, AU, NZ };

export function CountryFlag({ code, className }: { code: string; className?: string }) {
  const Flag = FLAGS[code.toUpperCase()];
  if (!Flag) return <span className={cn("inline-block rounded-[2px] bg-muted", className)} aria-hidden />;
  return <Flag aria-hidden className={cn("inline-block rounded-[2px] shadow-[0_0_0_1px_rgb(0_0_0/0.25)]", className)} />;
}
