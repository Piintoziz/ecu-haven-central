import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { products } from "@/lib/mock-data";

interface Props {
  compact?: boolean;
  autoFocus?: boolean;
}

export function SearchBar({ compact, autoFocus }: Props) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLInputElement>(null);

  // TODO(backend): trocar por endpoint real de autocomplete (Meilisearch/Algolia).
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.oem.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.make.toLowerCase().includes(q) ||
          p.models.some((m) => m.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [query]);

  function submit(id?: string) {
    if (id) {
      navigate({ to: "/produto/$id", params: { id } });
      return;
    }
    navigate({ to: "/catalogo", search: { q: query } });
  }

  return (
    <div className={cn("relative w-full", compact ? "max-w-full" : "max-w-2xl")}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className={cn(
          "relative flex items-center gap-2 rounded-xl border border-border bg-surface p-2 transition-all",
          focused && "border-primary/60 ring-2 ring-primary/20",
        )}
      >
        <Search className="size-5 text-muted-foreground ml-2 shrink-0" />
        <input
          ref={ref}
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={
            compact
              ? "Referência OEM, marca ou modelo…"
              : "Pesquisar por referência OEM (ex: 0281016000), marca ou modelo…"
          }
          className="flex-1 bg-transparent px-1 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              ref.current?.focus();
            }}
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label="Limpar"
          >
            <X className="size-4" />
          </button>
        )}
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Pesquisar
        </button>
      </form>

      {focused && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-surface-elevated shadow-2xl overflow-hidden z-50">
          <div className="mono-label px-4 pt-3 pb-2">
            {suggestions.length} resultados sugeridos
          </div>
          <ul>
            {suggestions.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    submit(p.id);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-accent flex items-center justify-between gap-4 border-t border-border"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">
                      {p.title}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {p.make} · {p.models[0]}
                    </div>
                  </div>
                  <div className="font-mono text-xs text-primary shrink-0">
                    {p.oem}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!compact && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mono-label">Sugestões:</span>
          {["Bosch EDC17", "Siemens SID807", "Delphi DCM6.2", "0281016000"].map(
            (s) => (
              <button
                key={s}
                onClick={() => {
                  setQuery(s);
                  ref.current?.focus();
                }}
                className="rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-mono text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {s}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
