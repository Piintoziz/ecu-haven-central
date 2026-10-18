import { cn } from "@/lib/utils";

/** Marca: a mesma centralina do favicon (ícone pequeno, ex.: backoffice). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/images/ecu-mark.png"
      alt=""
      aria-hidden
      width={96}
      height={96}
      decoding="async"
      draggable={false}
      className={cn("size-8 select-none object-contain", className)}
    />
  );
}

/** Logótipo CENTRALINAS.COM (PNG com fundo transparente, 960×150). */
export function LogoFull({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <img
      src="/images/logo-centralinas-com.png"
      alt="Centralinas.com"
      width={960}
      height={150}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      className={cn("h-8 w-auto select-none", className)}
      draggable={false}
    />
  );
}
