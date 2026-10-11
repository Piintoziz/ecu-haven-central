import type { ReactNode } from "react";
import { BadgeCheck, PackageSearch, ShieldCheck } from "lucide-react";
import { useT } from "@/lib/i18n";

const PERK_ICONS = [PackageSearch, BadgeCheck, ShieldCheck];

/** Layout comum de entrar / registar / recuperar palavra-passe. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  const s = useT().auth.shell;
  return (
    <div className="container-page py-12 md:py-20">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-xl border border-border bg-surface md:grid-cols-[1fr_1.1fr]">
        <aside className="relative hidden border-r border-border p-10 md:block">
          <div className="absolute inset-0 grid-noise opacity-40" aria-hidden />
          <div className="relative">
            <p className="mono-label text-primary">{s.area}</p>
            <p className="mt-4 text-2xl font-extrabold leading-tight">
              {s.pitch}
            </p>
            <ul className="mt-8 space-y-4 text-sm text-muted-foreground">
              {s.perks.map((text, i) => ({ Icon: PERK_ICONS[i]!, text })).map(({ Icon, text }) => (
                <li key={text} className="flex gap-3">
                  <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <section className="p-6 sm:p-10">
          <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </section>
      </div>
    </div>
  );
}

export function FormAlert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success";
  children: ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          : "rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success"
      }
    >
      {children}
    </p>
  );
}
