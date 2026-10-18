import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Indicador de carregamento: centralina Bosch em 3D (modelo gerado a partir de uma
 * fotografia real, /models/ecu.glb), desenhada com three.js (ecu-model-canvas.ts).
 * Ciclo: linha vermelha percorre o contorno todo; ao fechar a volta, a centralina
 * dá um 360° (arranca devagar, acelera, trava devagar) e recomeça.
 *
 * O 3D é carregado à parte. Até estar pronto mostra-se uma imagem estática do mesmo
 * enquadramento (13 KB), que é substituída sem salto; se o WebGL falhar fica a imagem.
 */

export const ECU_POSTER_URL = "/images/ecu-loader-poster.webp";

export function EcuScanLoader({
  label = "",
  className,
  size = 220,
}: {
  label?: string | null;
  className?: string;
  size?: number;
}) {
  // proporção da imagem estática (760 × 600)
  const boxH = Math.round((size * 600) / 760);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let dispose: (() => void) | undefined;
    let cancelled = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    import("./ecu-model-canvas")
      .then((m) =>
        cancelled || !canvasRef.current ? undefined : m.mountEcuModel(canvasRef.current, { reducedMotion }),
      )
      .then((d) => {
        if (!d) return;
        if (cancelled) return d();
        dispose = d;
        // espera um fotograma desenhado antes de trocar a imagem pelo 3D
        requestAnimationFrame(() => requestAnimationFrame(() => !cancelled && setReady(true)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative" style={{ width: size, height: boxH }} aria-hidden>
        <img
          src={ECU_POSTER_URL}
          alt=""
          width={size}
          height={boxH}
          decoding="async"
          className={cn("absolute inset-0 size-full transition-opacity duration-300", ready && "opacity-0")}
        />
        <canvas
          ref={canvasRef}
          className={cn("absolute inset-0 size-full transition-opacity duration-300", ready ? "opacity-100" : "opacity-0")}
        />
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

/**
 * Descarrega o modelo 3D (three.js + ecu.glb) e a imagem estática em segundo plano,
 * depois de a página estar carregada e o browser parado, para o loader já os ter
 * quando for preciso. Não o faz com "poupança de dados" nem em ligações lentas.
 */
export function usePreloadEcuModel() {
  useEffect(() => {
    const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (c?.saveData || /(^|-)2g$/.test(c?.effectiveType ?? "")) return;
    const run = () => {
      new Image().src = ECU_POSTER_URL;
      void import("./ecu-model-canvas").then((m) => m.loadEcuGeometry()).catch(() => {});
    };
    const t = window.setTimeout(() => {
      if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 5000 });
      else run();
    }, 3000);
    return () => window.clearTimeout(t);
  }, []);
}
