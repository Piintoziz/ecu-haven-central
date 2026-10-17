import { useNavigate } from "@tanstack/react-router";
import { CornerDownLeft, Loader2, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { suggestProducts } from "@/lib/catalog";
import { normalizeReference } from "@/lib/format";
import type { Suggestion } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Props {
  size?: "lg" | "md";
  defaultValue?: string;
  autoFocus?: boolean;
  className?: string;
}

const EXAMPLES = ["0281016000", "EDC17C46", "03L906023", "SID807"];

export function SearchBar({ size = "md", defaultValue = "", autoFocus, className }: Props) {
  const navigate = useNavigate();
  const s = useT().layout.search;
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);

  useEffect(() => setQuery(defaultValue), [defaultValue]);

  // Autocomplete por referência normalizada (debounce 180 ms)
  useEffect(() => {
    const norm = normalizeReference(query);
    if (norm.length < 3) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const res = await suggestProducts(query);
      if (!cancelled) {
        setItems(res);
        setActive(-1);
        setLoading(false);
      }
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  function goToProduct(slug: string) {
    setOpen(false);
    navigate({ to: "/centralinas/$slug", params: { slug } });
  }

  function submit() {
    const q = query.trim().slice(0, 80);
    setOpen(false);
    navigate({ to: "/catalogo", search: q ? { q } : {} });
  }

  const showList = open && items.length > 0;
  const lg = size === "lg";

  return (
    <div className={cn("relative w-full", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (active >= 0 && items[active]) goToProduct(items[active].slug);
          else submit();
        }}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border bg-background transition-[border-color,box-shadow] focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/20",
          lg ? "p-1.5 pl-4" : "p-1 pl-3",
        )}
      >
        <Search className={cn("shrink-0 text-muted-foreground", lg ? "size-5" : "size-4")} aria-hidden />
        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          maxLength={80}
          value={query}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-label={s.aria}
          placeholder={lg ? s.placeholderLg : s.placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (!showList) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => (i + 1) % items.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className={cn(
            "w-0 min-w-0 flex-1 bg-transparent font-mono text-foreground placeholder:font-sans placeholder:text-muted-foreground/70 focus:outline-none [&::-webkit-search-cancel-button]:hidden",
            lg ? "py-2.5 text-base" : "py-1.5 text-sm",
          )}
        />
        {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />}
        {query && !loading && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label={s.clear}
          >
            <X className="size-4" />
          </button>
        )}
        <button
          type="submit"
          className={cn(
            "shrink-0 rounded-md bg-primary font-bold text-primary-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]",
            lg ? "px-5 py-2.5 text-sm" : "px-3 py-1.5 text-xs",
          )}
        >
          {s.submit}
        </button>
      </form>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-border bg-surface-elevated shadow-2xl"
        >
          {items.map((it, i) => (
            <li
              key={`${it.slug}-${it.reference}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                goToProduct(it.slug);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-4 border-t border-border px-4 py-2.5 first:border-t-0",
                i === active && "bg-accent",
              )}
            >
              <div className="min-w-0">
                <div className="font-mono text-sm font-bold text-foreground">{it.reference}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {it.manufacturer ? `${it.manufacturer} · ` : ""}
                  {it.title}
                </div>
              </div>
              {i === active && <CornerDownLeft className="size-4 shrink-0 text-primary" aria-hidden />}
            </li>
          ))}
          <li className="border-t border-border bg-surface px-4 py-2 text-xs text-muted-foreground">
            {s.enterAll(query.trim())}
          </li>
        </ul>
      )}

      {lg && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">{s.examples}</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setQuery(ex);
                setOpen(true);
                inputRef.current?.focus();
              }}
              className="rounded border border-border px-2 py-0.5 font-mono text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
