import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useT } from "@/lib/i18n";
import { cleanNational, parseE164, PHONE_COUNTRIES, phoneCountry, toE164 } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { CountryFlag } from "./country-flag";

/**
 * Telefone com indicativo: seletor de país (bandeira + sigla + indicativo, com
 * pesquisa) e campo só de dígitos limitado ao máximo do país.
 * O valor exposto é E.164 (+351912345678).
 */
export function PhoneInput({
  id,
  value,
  onChange,
  onBlur,
  defaultCountry = "PT",
  invalid,
  autoComplete = "tel-national",
}: {
  id: string;
  value: string;
  onChange: (e164: string) => void;
  onBlur?: () => void;
  defaultCountry?: string;
  invalid?: boolean;
  autoComplete?: string;
}) {
  const t = useT();
  const parsed = useMemo(() => (value ? parseE164(value, defaultCountry) : null), [value, defaultCountry]);
  const [code, setCode] = useState(parsed?.code ?? defaultCountry);
  const [national, setNational] = useState(parsed?.national ?? "");
  const [touchedCountry, setTouchedCountry] = useState(false);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const c = phoneCountry(code);

  // Valor vindo de fora (ex.: perfil do cliente pré-preenchido)
  useEffect(() => {
    if (!value) return;
    const p = parseE164(value, code);
    if (p && (p.code !== code || p.national !== national)) {
      setCode(p.code);
      setNational(p.national);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Acompanha o país da morada enquanto o cliente não escolher outro indicativo
  useEffect(() => {
    if (!touchedCountry && !national && defaultCountry && defaultCountry !== code) setCode(defaultCountry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCountry]);

  const emit = (nextCode: string, nextNational: string) => {
    onChange(nextNational ? toE164(phoneCountry(nextCode), nextNational) : "");
  };

  const options = useMemo(
    () =>
      PHONE_COUNTRIES.map((p) => ({ ...p, name: t.common.country(p.code) })).sort((a, b) =>
        a.name.localeCompare(b.name, t.common.intl),
      ),
    [t],
  );
  const q = filter.trim().toLowerCase().replace(/^\+/, "");
  const visible = q
    ? options.filter(
        (o) =>
          o.name.toLowerCase().includes(q) || o.code.toLowerCase() === q || o.dial.startsWith(q),
      )
    : options;

  const choose = (nextCode: string) => {
    const next = phoneCountry(nextCode);
    const n = cleanNational(national, next);
    setTouchedCountry(true);
    setCode(next.code);
    setNational(n);
    emit(next.code, n);
    setOpen(false);
    setFilter("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div
      className={cn(
        "flex h-10 w-full overflow-hidden rounded-md border bg-background focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/20",
        invalid ? "border-destructive" : "border-input",
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`${t.common.dialCode}: ${t.common.country(c.code)} +${c.dial}`}
            className="flex shrink-0 items-center gap-1.5 border-r border-input bg-surface px-2.5 text-sm hover:bg-accent focus:outline-none"
          >
            <CountryFlag code={c.code} className="h-3.5 w-[21px]" />
            <span className="font-semibold">{c.code}</span>
            <span className="font-mono text-muted-foreground">+{c.dial}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-0">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 text-muted-foreground" aria-hidden />
            <input
              autoFocus
              value={filter}
              onChange={(e) => setFilter(e.target.value.slice(0, 40))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && visible[0]) {
                  e.preventDefault();
                  choose(visible[0].code);
                }
              }}
              placeholder={t.common.searchCountry}
              aria-label={t.common.searchCountry}
              className="h-10 w-full bg-transparent text-sm focus:outline-none"
            />
          </div>
          <ul role="listbox" aria-label={t.common.dialCode} className="max-h-72 overflow-y-auto py-1">
            {visible.map((o) => (
              <li key={o.code} role="option" aria-selected={o.code === code}>
                <button
                  type="button"
                  onClick={() => choose(o.code)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-accent",
                    o.code === code && "bg-primary/10",
                  )}
                >
                  <CountryFlag code={o.code} className="h-3.5 w-[21px] shrink-0" />
                  <span className="w-7 shrink-0 font-semibold">{o.code}</span>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{o.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">+{o.dial}</span>
                  {o.code === code && <Check className="size-3.5 text-primary" aria-hidden />}
                </button>
              </li>
            ))}
            {visible.length === 0 && <li className="px-3 py-3 text-sm text-muted-foreground">—</li>}
          </ul>
        </PopoverContent>
      </Popover>
      <input
        ref={inputRef}
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete={autoComplete}
        value={national}
        placeholder={"9".repeat(Math.min(c.max, 9))}
        aria-invalid={invalid || undefined}
        aria-describedby={`${id}-len`}
        onChange={(e) => {
          // O limite é aplicado aqui (não com maxLength nativo, que contaria espaços/hífens).
          const n = cleanNational(e.target.value, c);
          // Se o texto limpo for igual ao anterior o React não re-renderiza: limpa o DOM à mão.
          if (e.target.value !== n) e.target.value = n;
          setNational(n);
          emit(code, n);
        }}
        onBlur={onBlur}
        className="min-w-0 flex-1 bg-transparent px-3 font-mono text-sm tracking-wide focus:outline-none"
      />
      <span id={`${id}-len`} className="sr-only">
        {t.common.phoneDigits(c.min, c.max)}
      </span>
    </div>
  );
}
