import { useI18n, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Locale; label: string; name: string }[] = [
  { value: "pt", label: "PT", name: "Português" },
  { value: "en", label: "EN", name: "English" },
];

/** Seletor PT/EN da barra de navegação. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t.layout.language}
      className={cn("inline-flex h-9 items-center rounded-md border border-border p-0.5", className)}
    >
      {OPTIONS.map((o) => {
        const active = o.value === locale;
        return (
          <button
            key={o.value}
            type="button"
            lang={o.value}
            onClick={() => setLocale(o.value)}
            aria-pressed={active}
            aria-label={o.name}
            title={o.name}
            className={cn(
              "h-full rounded px-2 font-mono text-[11px] font-bold transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
