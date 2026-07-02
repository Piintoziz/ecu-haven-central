import { createFileRoute, Link } from "@tanstack/react-router";
import { Filter } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { ProductCard } from "@/components/site/product-card";
import { SearchBar } from "@/components/site/search-bar";
import {
  carBrands,
  categories,
  products,
  type CategoryId,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  make: z.string().optional(),
});

export const Route = createFileRoute("/catalogo")({
  component: CatalogoPage,
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Catálogo de Centralinas — Centralinas" },
      {
        name: "description",
        content:
          "Pesquisa por referência OEM ou filtra por marca, modelo e categoria entre milhares de centralinas em stock.",
      },
    ],
  }),
});

function CatalogoPage() {
  const params = Route.useSearch();
  const [category, setCategory] = useState<CategoryId | "all">(
    (params.category as CategoryId) ?? "all",
  );
  const [make, setMake] = useState<string>(params.make ?? "all");
  const [q, setQ] = useState<string>(params.q ?? "");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (make !== "all" && p.make !== make) return false;
      if (q) {
        const query = q.toLowerCase();
        const matches =
          p.oem.toLowerCase().includes(query) ||
          p.title.toLowerCase().includes(query) ||
          p.make.toLowerCase().includes(query) ||
          p.models.some((m) => m.toLowerCase().includes(query));
        if (!matches) return false;
      }
      return true;
    });
  }, [category, make, q]);

  return (
    <div className="container-page py-10 md:py-14">
      <div className="mb-8">
        <div className="mono-label text-primary mb-2">Catálogo</div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-6">
          {filtered.length} referências disponíveis
        </h1>
        <SearchBar />
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        <aside className="surface-card p-6 h-fit lg:sticky lg:top-24">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="size-4 text-primary" />
            <h2 className="mono-label">Filtros</h2>
          </div>

          <div className="mb-6">
            <label className="mono-label mb-3 block">Referência OEM</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ex: 0281016000"
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60"
            />
          </div>

          <div className="mb-6">
            <h3 className="mono-label mb-3">Categoria</h3>
            <div className="space-y-1">
              <FilterButton
                active={category === "all"}
                onClick={() => setCategory("all")}
                label="Todas"
                count={products.length}
              />
              {categories.map((c) => (
                <FilterButton
                  key={c.id}
                  active={category === c.id}
                  onClick={() => setCategory(c.id)}
                  label={c.name}
                  count={products.filter((p) => p.category === c.id).length}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="mono-label mb-3">Marca do carro</h3>
            <select
              value={make}
              onChange={(e) => setMake(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60"
            >
              <option value="all">Todas as marcas</option>
              {carBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {(category !== "all" || make !== "all" || q) && (
            <button
              onClick={() => {
                setCategory("all");
                setMake("all");
                setQ("");
              }}
              className="mt-6 text-xs font-bold text-primary hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </aside>

        <div>
          {filtered.length === 0 ? (
            <div className="surface-card p-16 text-center">
              <div className="mono-label text-primary mb-4">Sem resultados</div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Não encontrámos essa referência
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Tenta ajustar os filtros ou pesquisar pela referência OEM
                original.
              </p>
              <Link
                to="/contactos"
                className="text-sm font-bold text-primary hover:underline"
              >
                Pedir orçamento personalizado →
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 rounded-md text-left text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground font-bold"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <span className="truncate">{label}</span>
      <span
        className={cn(
          "font-mono text-xs shrink-0 ml-2",
          active ? "text-primary-foreground/70" : "text-muted-foreground/60",
        )}
      >
        {count}
      </span>
    </button>
  );
}
