import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Indicador de carregamento: centralina Bosch (caixa de alumínio com 4 patilhas,
 * ficha dupla, alhetas e etiqueta) em 3D com contorno branco. A espessura é
 * feita com várias camadas da silhueta empilhadas em profundidade (CSS 3D).
 * Ciclo: linha vermelha percorre o contorno a partir de um ponto; ao fechar a
 * volta, a centralina roda 360° (lados e costas) e recomeça. Sem imagens.
 */

// Desenho em unidades da viewBox 126 × 142 (proporção da caixa real)
const VB = "0 0 126 142";
const PLATE = "M2 30Q2 24 8 24H118Q124 24 124 30V134Q124 140 118 140H8Q2 140 2 134Z";
const EARS: [number, number][] = [
  [6, 26],
  [120, 26],
  [11, 136],
  [115, 136],
];
const CONNECTOR = "M11 24V4Q11 1 14 1H108Q111 1 111 4V24Z";
// Contorno completo (caixa + ficha) para a linha vermelha
const TRACE = "M2 30Q2 24 8 24H11V4Q11 1 14 1H108Q111 1 111 4V24H118Q124 24 124 30V134Q124 140 118 140H8Q2 140 2 134Z";

const LAYERS = 7; // camadas da caixa (espessura)
const PLUG_LAYERS = 4; // camadas extra da ficha (sai mais para a frente)

export function EcuScanLoader({
  label = "",
  className,
  size = 220,
}: {
  label?: string | null;
  className?: string;
  size?: number;
}) {
  const w = Math.round(size * 0.6);
  const h = Math.round((w * 142) / 126);
  const d = Math.max(10, Math.round(w * 0.16)); // espessura da caixa
  const vars = { "--w": `${w}px`, "--h": `${h}px` } as CSSProperties;
  const z = (i: number, n: number) => d / 2 - (d * i) / (n - 1);

  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center gap-4", className)}>
      <div className="ecu3d" style={{ ...vars, width: size, height: Math.round(h * 1.25) }} aria-hidden>
        <div className="ecu3d-box">
          {/* ficha: sai à frente da caixa */}
          {Array.from({ length: PLUG_LAYERS }, (_, i) => (
            <div key={`p${i}`} className="ecu3d-layer" style={{ transform: `translateZ(${d / 2 + ((i + 1) * d) / 3}px)` }}>
              <svg viewBox={VB} className="size-full overflow-visible">
                <path d={CONNECTOR} className={i === PLUG_LAYERS - 1 ? "ecu3d-solid" : "ecu3d-slice"} />
                {i === PLUG_LAYERS - 1 && <ConnectorFace />}
              </svg>
            </div>
          ))}
          {/* corpo: frente, fatias intermédias, costas */}
          {Array.from({ length: LAYERS }, (_, i) => {
            const front = i === 0;
            const back = i === LAYERS - 1;
            return (
              <div
                key={i}
                className="ecu3d-layer"
                style={{ transform: back ? `rotateY(180deg) translateZ(${d / 2}px)` : `translateZ(${z(i, LAYERS)}px)` }}
              >
                <svg viewBox={VB} className="size-full overflow-visible" style={back ? { transform: "scaleX(-1)" } : undefined}>
                  <Silhouette className={front || back ? "ecu3d-solid" : "ecu3d-slice"} />
                  {front && <FrontFace />}
                  {back && <BackFace />}
                  {front && <path className="ecu3d-trace" d={TRACE} pathLength={100} />}
                </svg>
              </div>
            );
          })}
        </div>
      </div>
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

function Silhouette({ className }: { className: string }) {
  return (
    <g className={className}>
      <path d={PLATE} />
      {EARS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="6" />
      ))}
    </g>
  );
}

/** Frente: patilhas com furo, flange da ficha, zona elevada, etiqueta e alhetas. */
function FrontFace() {
  return (
    <g className="ecu3d-detail">
      {EARS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" />
      ))}
      {/* flange da ficha (triângulos) */}
      <path d="M15 24h92v9H15z" />
      <path d="M22 33l7-8 7 8M38 33l7-8 7 8M54 33l7-8 7 8M70 33l7-8 7 8M86 33l7-8 7 8" opacity="0.7" />
      {/* zona central elevada */}
      <path d="M19 33V126Q19 130 23 130H86Q90 130 90 126V33" opacity="0.8" />
      {/* etiqueta */}
      <rect x="29" y="41" width="53" height="24" rx="2" />
      <path d="M33 47h22M33 52h30M33 58h40" opacity="0.65" />
      <text x="78" y="62" textAnchor="end" className="ecu3d-text">
        BOSCH
      </text>
      {/* alhetas esquerda e direita */}
      <path d="M8 60v56M12 58v60M16 60v56" opacity="0.75" />
      <path d="M94 56v68M99 56v68M104 56v68M109 56v68M114 58v64" opacity="0.75" />
      <text x="119" y="88" className="ecu3d-text ecu3d-text-sm" transform="rotate(90 119 88)">
        3-2 74973
      </text>
    </g>
  );
}

/** Face da ficha: duas metades com os pernos. */
function ConnectorFace() {
  return (
    <g className="ecu3d-detail">
      <path d="M56 1v23" />
      {[18, 30, 44, 66, 80, 94, 104].map((x) => (
        <circle key={x} cx={x} cy="6" r="1.4" />
      ))}
      <rect x="44" y="4" width="10" height="18" rx="2" opacity="0.6" />
    </g>
  );
}

/** Costas: tampa lisa com nervuras, parafusos e furos das patilhas. */
function BackFace() {
  return (
    <g className="ecu3d-detail">
      {EARS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" />
      ))}
      <rect x="12" y="32" width="102" height="98" rx="4" opacity="0.8" />
      <path d="M24 46h78M24 116h78" opacity="0.5" />
      {[
        [20, 40],
        [106, 40],
        [20, 122],
        [106, 122],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="3" />
          <path d={`M${x - 1.6} ${y}h3.2M${x} ${y - 1.6}v3.2`} opacity="0.7" />
        </g>
      ))}
      <rect x="40" y="62" width="46" height="38" rx="2" opacity="0.7" />
      <path d="M46 72h34M46 80h26M46 88h30" opacity="0.5" />
    </g>
  );
}
