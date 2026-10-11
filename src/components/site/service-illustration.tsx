import type { ServiceId } from "@/lib/content";
import { cn } from "@/lib/utils";

/** Ilustrações em traço (estilo blueprint) para os cartões de serviços. */
export function ServiceIllustration({ id, className }: { id: ServiceId; className?: string }) {
  return (
    <svg
      viewBox="0 0 120 90"
      aria-hidden
      className={cn("h-auto w-full", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {DRAWINGS[id]}
    </svg>
  );
}

const pins = (x0: number, x1: number, y: number, step = 6, len = 4) =>
  Array.from({ length: Math.floor((x1 - x0) / step) + 1 }, (_, i) => (
    <path key={`${y}-${i}`} d={`M${x0 + i * step} ${y}v${len}`} />
  ));

const DRAWINGS: Record<ServiceId, React.ReactNode> = {
  diagnostico: (
    <>
      <rect x="18" y="14" width="84" height="58" rx="6" />
      <rect x="24" y="20" width="72" height="44" rx="2" opacity="0.5" />
      <path d="M28 50h12l5-14 7 22 6-16 4 8h18" className="text-primary" stroke="currentColor" />
      <path d="M50 78h20M60 72v6" />
    </>
  ),
  reprogramacao: (
    <>
      <rect x="20" y="22" width="62" height="46" rx="4" />
      <rect x="38" y="34" width="22" height="22" rx="2" />
      {pins(40, 58, 30)}
      {pins(40, 58, 56)}
      <path d="M26 30h8M26 60h8" opacity="0.5" />
      <path d="M90 26v28m0 0-7-7m7 7 7-7" className="text-primary" stroke="currentColor" />
      <path d="M84 64h12" className="text-primary" stroke="currentColor" />
    </>
  ),
  reparacao: (
    <>
      <path d="M16 30h6v30h-6zM98 30h6v30h-6z" opacity="0.6" />
      <rect x="22" y="22" width="76" height="46" rx="5" />
      <rect x="30" y="30" width="20" height="30" rx="2" />
      {Array.from({ length: 4 }, (_, i) => (
        <circle key={i} cx="36" cy={35 + i * 6.5} r="1.3" />
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <circle key={`b${i}`} cx="44" cy={35 + i * 6.5} r="1.3" />
      ))}
      <path d="M58 36h12l4 4h14M58 52h20" opacity="0.6" />
      <path d="M78 74 92 56m0 0 3-8 4 4-7 4" className="text-primary" stroke="currentColor" />
    </>
  ),
  quadrantes: (
    <>
      <path d="M14 58c0-20 14-34 30-34h32c16 0 30 14 30 34v6H14z" />
      <circle cx="38" cy="50" r="13" />
      <circle cx="82" cy="50" r="13" />
      <path d="M38 50l8-6M82 50l-6-8" className="text-primary" stroke="currentColor" />
      <rect x="53" y="36" width="14" height="18" rx="2" opacity="0.6" />
      <path d="M30 42h2M44 42h2M74 42h2M88 42h2" opacity="0.6" />
    </>
  ),
  chaves: (
    <>
      <rect x="40" y="10" width="40" height="70" rx="12" />
      <rect x="48" y="22" width="24" height="12" rx="3" />
      <rect x="48" y="40" width="24" height="12" rx="3" />
      <path d="M56 28h8M56 46h8" className="text-primary" stroke="currentColor" />
      <path d="M52 66h16" opacity="0.6" />
      <path d="M90 30c4 4 4 10 0 14M96 25c7 7 7 17 0 24" className="text-primary" stroke="currentColor" />
    </>
  ),
  adblue: (
    <>
      <path d="M24 34h52l8 8v30H24z" />
      <path d="M36 34v-8h20v8" />
      <rect x="32" y="46" width="22" height="16" rx="2" opacity="0.6" />
      <path d="M60 50h16M60 58h12" opacity="0.6" />
      <path d="M96 30c0 0-8 10-8 16a8 8 0 0 0 16 0c0-6-8-16-8-16z" className="text-primary" stroke="currentColor" />
      <path d="M84 72h14" opacity="0.6" />
    </>
  ),
  airbag: (
    <>
      <rect x="20" y="26" width="56" height="40" rx="4" />
      <path d="M28 66v6h40v-6" />
      <rect x="28" y="34" width="26" height="14" rx="1.5" opacity="0.6" />
      <path d="M28 56h40" opacity="0.6" />
      <circle cx="94" cy="44" r="10" className="text-primary" stroke="currentColor" />
      <path d="M94 26v6M94 56v6M76 44h6M106 44h6M82 32l4 4M106 56l-4-4M106 32l-4 4M82 56l4-4" className="text-primary" stroke="currentColor" />
    </>
  ),
  clonagem: (
    <>
      <rect x="12" y="28" width="34" height="34" rx="3" />
      <rect x="74" y="28" width="34" height="34" rx="3" />
      {pins(17, 41, 23, 6, 5)}
      {pins(79, 103, 23, 6, 5)}
      {pins(17, 41, 62, 6, 5)}
      {pins(79, 103, 62, 6, 5)}
      <rect x="21" y="37" width="16" height="16" rx="1.5" opacity="0.6" />
      <rect x="83" y="37" width="16" height="16" rx="1.5" opacity="0.6" />
      <path d="M50 45h18m0 0-5-5m5 5-5 5" className="text-primary" stroke="currentColor" />
    </>
  ),
};
