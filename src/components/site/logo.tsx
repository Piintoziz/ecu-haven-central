import { cn } from "@/lib/utils";

/** Marca: chip com pinos — desenhada em SVG (ícone pequeno, ex.: backoffice). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect x="7" y="7" width="18" height="18" rx="3" className="fill-primary" />
      <path d="M12 16h3l1.5-3 2 6 1.5-3h0" fill="none" stroke="oklch(0.14 0 0)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {[10, 14, 18, 22].map((p) => (
        <g key={p} className="fill-primary/70">
          <rect x={p - 0.75} y="2.5" width="1.5" height="3.5" rx="0.5" />
          <rect x={p - 0.75} y="26" width="1.5" height="3.5" rx="0.5" />
          <rect x="2.5" y={p - 0.75} width="3.5" height="1.5" rx="0.5" />
          <rect x="26" y={p - 0.75} width="3.5" height="1.5" rx="0.5" />
        </g>
      ))}
    </svg>
  );
}

/** Logótipo completo CENTRALINAS.COM (imagem com fundo transparente). */
export function LogoFull({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <img
      src="/images/logo-centralinas.webp"
      alt="Centralinas.com"
      width={480}
      height={197}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      className={cn("h-11 w-auto select-none", className)}
      draggable={false}
    />
  );
}
