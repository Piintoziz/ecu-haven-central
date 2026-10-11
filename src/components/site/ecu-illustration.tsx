import { cn } from "@/lib/utils";

interface Props {
  reference: string;
  manufacturer?: string | null;
  family?: string | null;
  code?: string | null;
  className?: string;
  /** Versão reduzida para miniaturas (sem textos secundários). */
  compact?: boolean;
}

const MONO = { fontFamily: "var(--font-mono)" } as const;

/** Barras de código deterministas a partir da referência (puramente decorativo). */
function barcode(ref: string): { x: number; w: number }[] {
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  const chars = ref.length ? ref : "ECU";
  for (let i = 0; x < 150; i++) {
    const c = chars.charCodeAt(i % chars.length);
    const w = 1 + ((c + i * 7) % 3);
    bars.push({ x, w });
    x += w + 1 + ((c >> 1) % 2);
  }
  return bars;
}

/**
 * Ilustração técnica de uma centralina com a etiqueta real da peça.
 * Usada como imagem de produto enquanto não há fotografia própria.
 */
export function EcuIllustration({ reference, manufacturer, family, code, className, compact }: Props) {
  const bars = barcode(reference);
  const label = `${manufacturer ?? "Centralina"} ${family ?? ""} — referência ${reference}`.trim();

  return (
    <svg
      viewBox="0 0 400 260"
      role="img"
      aria-label={label}
      className={cn("h-auto w-full", className)}
    >
      {/* abas de fixação */}
      {[
        [8, 52],
        [8, 186],
        [312, 52],
        [312, 186],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={30} height={22} rx={3} className="fill-surface stroke-border" strokeWidth={1.5} />
          <circle cx={x! + 12} cy={y! + 11} r={4} className="fill-background stroke-border" strokeWidth={1.5} />
        </g>
      ))}

      {/* caixa */}
      <rect x={28} y={34} width={290} height={192} rx={10} className="fill-surface-elevated stroke-border" strokeWidth={2} />
      <rect x={38} y={44} width={270} height={172} rx={6} className="fill-none stroke-border" strokeWidth={1} strokeDasharray="2 4" />

      {/* nervuras */}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={i} x1={48 + i * 8} y1={196} x2={48 + i * 8} y2={210} className="stroke-border" strokeWidth={2} strokeLinecap="round" />
      ))}

      {/* conector */}
      <rect x={318} y={70} width={62} height={120} rx={5} className="fill-background stroke-border" strokeWidth={2} />
      <rect x={326} y={78} width={46} height={104} rx={3} className="fill-surface stroke-border" strokeWidth={1} />
      {Array.from({ length: 3 }, (_, col) =>
        Array.from({ length: 9 }, (_, row) => (
          <circle
            key={`${col}-${row}`}
            cx={337 + col * 12}
            cy={88 + row * 11}
            r={2.2}
            className={row === 0 && col === 0 ? "fill-primary" : "fill-muted-foreground/60"}
          />
        )),
      )}
      <rect x={380} y={110} width={10} height={40} rx={2} className="fill-surface stroke-border" strokeWidth={1.5} />

      {/* etiqueta */}
      <rect x={58} y={62} width={226} height={128} rx={4} fill="oklch(0.93 0.005 80)" />
      <rect x={58} y={62} width={226} height={22} rx={4} fill="oklch(0.86 0.01 80)" />
      <text x={68} y={78} style={MONO} fontSize={11} fontWeight={700} fill="oklch(0.2 0 0)" letterSpacing={1.5}>
        {(manufacturer ?? "ECU").toUpperCase().slice(0, 22)}
      </text>
      {code && (
        <text x={274} y={78} textAnchor="end" style={MONO} fontSize={10} fontWeight={700} fill="oklch(0.55 0.17 45)">
          {code}
        </text>
      )}
      <text x={68} y={114} style={MONO} fontSize={reference.length > 12 ? 17 : 21} fontWeight={700} fill="oklch(0.15 0 0)">
        {reference.slice(0, 18)}
      </text>
      {!compact && family && (
        <text x={68} y={133} style={MONO} fontSize={10} fill="oklch(0.35 0 0)" letterSpacing={0.5}>
          {family.slice(0, 28)}
        </text>
      )}
      <g transform="translate(68 146)">
        {bars.map((b, i) => (
          <rect key={i} x={b.x} y={0} width={b.w} height={compact ? 30 : 26} fill="oklch(0.18 0 0)" />
        ))}
      </g>
      {!compact && (
        <text x={274} y={182} textAnchor="end" style={MONO} fontSize={8} fill="oklch(0.45 0 0)">
          MADE IN EU
        </text>
      )}
    </svg>
  );
}
