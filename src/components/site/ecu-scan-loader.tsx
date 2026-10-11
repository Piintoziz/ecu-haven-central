import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Indicador de carregamento: centralina em "blueprint" (traço branco) com um
 * feixe vermelho a percorrê-la, como um scanner de bancada. SVG + CSS puro:
 * nítido em qualquer tamanho, ~3 KB, sem imagens. Respeita reduced-motion.
 */
export function EcuScanLoader({
  label = "",
  className,
  size = 220,
}: {
  label?: string | null;
  className?: string;
  size?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const drawing = `ecu-bp-${uid}`;
  const clip = `ecu-scan-${uid}`;
  const glow = `ecu-glow-${uid}`;

  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center gap-3", className)}>
      <svg viewBox="0 0 320 200" width={size} height={(size * 200) / 320} aria-hidden className="h-auto max-w-full overflow-visible">
        <defs>
          {/* Desenho único, reutilizado em branco (base) e vermelho (zona iluminada) */}
          <g id={drawing} strokeLinecap="round" strokeLinejoin="round">
            {/* linhas de construção */}
            <g strokeDasharray="2 4" strokeWidth="0.6" opacity="0.45" fill="none">
              <line x1="160" y1="10" x2="160" y2="190" />
              <line x1="8" y1="100" x2="312" y2="100" />
            </g>
            {/* marcas de registo nos cantos */}
            <g strokeWidth="0.8" opacity="0.6" fill="none">
              <path d="M14 22h10M19 17v10M296 22h10M301 17v10M14 178h10M19 173v10M296 178h10M301 173v10" />
            </g>
            {/* patilhas de fixação */}
            <g strokeWidth="1.2" fill="none">
              <path d="M44 58h-16a4 4 0 0 0-4 4v16a4 4 0 0 0 4 4h16" />
              <path d="M44 118h-16a4 4 0 0 0-4 4v16a4 4 0 0 0 4 4h16" />
              <path d="M276 58h16a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4h-16" />
              <path d="M276 118h16a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4h-16" />
              <circle cx="33" cy="70" r="4" />
              <circle cx="33" cy="130" r="4" />
              <circle cx="287" cy="70" r="4" />
              <circle cx="287" cy="130" r="4" />
            </g>
            {/* caixa */}
            <rect x="44" y="40" width="232" height="120" rx="7" strokeWidth="1.6" fill="none" />
            <rect x="50" y="46" width="220" height="108" rx="4" strokeWidth="0.6" opacity="0.5" fill="none" />
            {/* ficha de ligação com pinos */}
            <rect x="56" y="56" width="42" height="88" rx="3" strokeWidth="1.2" fill="none" />
            <rect x="61" y="61" width="32" height="78" rx="2" strokeWidth="0.6" opacity="0.6" fill="none" />
            <g strokeWidth="0.8" fill="none">
              {Array.from({ length: 8 }, (_, r) =>
                [0, 1, 2].map((c) => <circle key={`${r}-${c}`} cx={68 + c * 9} cy={67 + r * 9.5} r="2" />),
              )}
            </g>
            {/* pistas do PCB */}
            <g strokeWidth="0.8" fill="none" opacity="0.85">
              <path d="M98 70h14l8 8h14" />
              <path d="M98 84h22l6 6h8" />
              <path d="M98 98h36" />
              <path d="M98 112h22l6-6h8" />
              <path d="M98 126h14l8-8h14" />
              <path d="M194 82h14l6-6h12" />
              <path d="M194 118h14l6 6h12" />
              <path d="M164 125v14h40" />
            </g>
            {/* microcontrolador */}
            <rect x="134" y="70" width="60" height="56" rx="2" strokeWidth="1.3" fill="none" />
            <circle cx="141" cy="77" r="1.6" strokeWidth="0.8" fill="none" />
            <g strokeWidth="0.8" fill="none">
              {Array.from({ length: 7 }, (_, i) => (
                <path key={i} d={`M${140 + i * 8} 70v-5M${140 + i * 8} 126v5`} />
              ))}
              {Array.from({ length: 6 }, (_, i) => (
                <path key={i} d={`M134 ${76 + i * 9}h-5M194 ${76 + i * 9}h5`} />
              ))}
            </g>
            {/* componentes secundários */}
            <g strokeWidth="1" fill="none">
              <rect x="226" y="66" width="22" height="18" rx="1.5" />
              <rect x="226" y="116" width="22" height="18" rx="1.5" />
              <rect x="204" y="134" width="12" height="10" rx="1" />
              <circle cx="254" cy="100" r="7" />
              <circle cx="254" cy="100" r="3" />
            </g>
            {/* cota inferior */}
            <g strokeWidth="0.7" fill="none" opacity="0.7">
              <path d="M44 166v12M276 166v12M44 174h232" />
              <path d="M44 174l5-2.5v5zM276 174l-5-2.5v5z" />
            </g>
            <text
              x="160"
              y="186"
              textAnchor="middle"
              fontSize="8"
              stroke="none"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }}
            >
              ECU · 232 × 120
            </text>
            <text x="164" y="102" textAnchor="middle" fontSize="7" stroke="none" style={{ fontFamily: "var(--font-mono)" }}>
              MCU
            </text>
          </g>

          <clipPath id={clip}>
            <rect className="ecu-scan-window" x="-40" y="0" width="80" height="200" />
          </clipPath>
          <linearGradient id={glow} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="var(--scan)" stopOpacity="0" />
            <stop offset="0.5" stopColor="var(--scan)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--scan)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* base: blueprint branco */}
        <g stroke="currentColor" fill="currentColor" className="text-foreground/80">
          <use href={`#${drawing}`} />
        </g>

        {/* zona iluminada: o mesmo desenho em vermelho, recortado pelo feixe */}
        <g stroke="var(--scan)" fill="var(--scan)" clipPath={`url(#${clip})`} className="ecu-scan-lit">
          <use href={`#${drawing}`} />
        </g>

        {/* feixe */}
        <g className="ecu-scan-beam">
          <rect x="-40" y="4" width="80" height="192" fill={`url(#${glow})`} />
          <rect x="-0.75" y="4" width="1.5" height="192" fill="var(--scan)" />
          <circle cx="0" cy="4" r="2.2" fill="var(--scan)" />
          <circle cx="0" cy="196" r="2.2" fill="var(--scan)" />
        </g>
      </svg>
      {label && (
        <p className="mono-label text-muted-foreground">
          {label}
          <span className="ecu-scan-dots" aria-hidden>
            ...
          </span>
        </p>
      )}
    </div>
  );
}
