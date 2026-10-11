import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Cabeçalho comum das páginas do backoffice. */
export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  actions,
  className,
  children,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-surface", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          {title && <h2 className="text-sm font-bold">{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function Kpi({
  label,
  value,
  hint,
  tone = "default",
  to,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "warning" | "success" | "primary";
  to?: string;
}) {
  const body = (
    <>
      <p className="mono-label">{label}</p>
      <p
        className={cn(
          "mt-2 font-mono text-2xl font-bold tabular-nums",
          tone === "warning" && "text-warning",
          tone === "success" && "text-success",
          tone === "primary" && "text-primary",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </>
  );
  const cls = "block rounded-xl border border-border bg-surface p-4 transition-colors";
  return to ? (
    <Link to={to} className={cn(cls, "hover:border-primary/50")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Paginação simples controlada por callback (as páginas guardam a página no URL). */
export function Pager({
  page,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
      <span className="tabular-nums">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}
      </span>
      <div className="flex gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="inline-flex size-8 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40"
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="inline-flex size-8 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40"
          aria-label="Página seguinte"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** Segmentos de filtro (estado, etc.). */
export function FilterTabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T | undefined;
  options: { value: T | undefined; label: string; count?: number }[];
  onChange: (v: T | undefined) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto" role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.label}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-bold transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {o.label}
            {o.count != null && <span className="ml-1.5 tabular-nums opacity-70">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-muted-foreground">
        {children}
      </td>
    </tr>
  );
}

export const th =
  "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";
export const td = "px-4 py-3 align-middle";
