import { Link } from "@tanstack/react-router";
import { AddToCartButton } from "./add-to-cart";
import { EcuIllustration } from "./ecu-illustration";
import { StockBadge } from "./stock-badge";
import { primaryReference } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { productImageUrl } from "@/lib/supabase";
import type { ProductCard as ProductCardData } from "@/lib/types";
import { cn } from "@/lib/utils";

function Thumb({ product, compact, cover }: { product: ProductCardData; compact?: boolean; cover?: boolean }) {
  const img = productImageUrl(product.image);
  const title = useT().common.productTitle(product);
  if (img) {
    return (
      <img
        src={img}
        alt={title}
        loading="lazy"
        decoding="async"
        className={cn("h-full w-full", cover ? "object-cover" : "object-contain")}
      />
    );
  }
  return (
    <EcuIllustration
      compact={compact}
      reference={primaryReference(product)}
      manufacturer={product.manufacturer?.name}
      family={product.ecu_family}
      code={product.category?.short_code}
    />
  );
}

/** Linha de resultados — formato de distribuidor de peças, referência primeiro. */
export function ProductRow({ product }: { product: ProductCardData }) {
  const ref = primaryReference(product);
  const otherRefs = product.references.filter((r) => r.value !== ref).slice(0, 3);
  const t = useT();
  const c = t.shop.card;

  return (
    <article className="group relative grid grid-cols-[64px_minmax(0,1fr)] sm:grid-cols-[112px_minmax(0,1fr)_auto] gap-x-4 sm:gap-x-5 gap-y-3 border-b border-border py-5 transition-colors hover:bg-surface/60 px-2 sm:px-3 -mx-2 sm:-mx-3 rounded-lg">
      <div className="row-span-2 sm:row-span-1 self-start rounded-md border border-border bg-background p-1.5">
        <Thumb product={product} compact />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <Link
            to="/centralinas/$slug"
            params={{ slug: product.slug }}
            className="font-mono text-lg font-bold tracking-tight text-foreground after:absolute after:inset-0 group-hover:text-primary transition-colors"
          >
            {ref}
            {product.label_code && <CodeTag code={product.label_code} />}
          </Link>
          {product.manufacturer && (
            <span className="text-sm font-semibold text-muted-foreground">
              {product.manufacturer.name}
              {product.ecu_family ? ` · ${product.ecu_family}` : ""}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-foreground/90 line-clamp-1">{t.common.productTitle(product)}</p>
        <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {product.category && (
            <div className="flex gap-1">
              <dt className="sr-only">{c.system}</dt>
              <dd>{t.common.category(product.category.slug, product.category.name)}</dd>
            </div>
          )}
          {product.brands.length > 0 && (
            <div className="flex gap-1">
              <dt>{c.fitsIn}</dt>
              <dd className="text-foreground/80">{product.brands.slice(0, 4).join(", ")}</dd>
            </div>
          )}
          {otherRefs.length > 0 && (
            <div className="flex gap-1">
              <dt>{c.alt}</dt>
              <dd className="font-mono">{otherRefs.map((r) => r.value).join(" · ")}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="col-start-2 sm:col-start-3 flex min-w-0 flex-wrap sm:flex-col items-center sm:items-end justify-between gap-x-3 gap-y-2 sm:min-w-44">
        <div className="text-left sm:text-right">
          <div className="text-xl font-extrabold tabular-nums text-foreground">
            {t.common.priceLabel(product.price_cents)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {t.common.condition[product.condition]} · {t.common.warranty(product.warranty_months)}
          </div>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-x-3 gap-y-2">
          <StockBadge quantity={product.stock_quantity} />
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}

/** Cartão de grelha (início, relacionados): fotografia em destaque, referência, marcas e preço. */
export function ProductCard({ product, className }: { product: ProductCardData; className?: string }) {
  const ref = primaryReference(product);
  const hasPhoto = !!productImageUrl(product.image);
  const maker = [product.manufacturer?.name, product.ecu_family].filter(Boolean).join(" · ");
  const t = useT();
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_12px_40px_-12px_rgb(0_0_0/0.6)]",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden border-b border-border bg-background">
        <div className={cn("h-full w-full transition-transform duration-500 group-hover:scale-[1.03]", hasPhoto ? "" : "p-5")}>
          <Thumb product={product} cover={hasPhoto} />
        </div>
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {product.category && (
            <span className="rounded-md bg-background/85 px-2 py-0.5 font-mono text-[10px] font-bold text-primary backdrop-blur">
              {product.category.short_code ?? t.common.category(product.category.slug, product.category.name)}
            </span>
          )}
          <span className="ml-auto rounded-md bg-background/85 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground backdrop-blur">
            {t.common.condition[product.condition]}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="mono-label truncate">{maker || (product.category ? t.common.category(product.category.slug, product.category.name) : t.shop.card.ecu)}</p>
        <Link
          to="/centralinas/$slug"
          params={{ slug: product.slug }}
          className="mt-1.5 block font-mono text-lg font-bold leading-tight text-foreground transition-colors after:absolute after:inset-0 group-hover:text-primary"
        >
          {ref}
          {product.label_code && <CodeTag code={product.label_code} />}
        </Link>
        {product.brands.length > 0 && (
          <p className="mt-1.5 truncate text-sm text-muted-foreground">
            {t.shop.card.fitsInShort} <span className="text-foreground/90">{product.brands.slice(0, 3).join(", ")}</span>
            {product.brands.length > 3 ? ` +${product.brands.length - 3}` : ""}
          </p>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className={cn("font-extrabold tabular-nums", product.price_cents == null ? "text-base" : "text-xl")}>
                {t.common.priceLabel(product.price_cents)}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {product.price_cents == null ? t.shop.card.inStockPart : t.common.vatIncluded} · {t.common.warranty(product.warranty_months)}
              </p>
            </div>
            <StockBadge quantity={product.stock_quantity} />
          </div>
          <div className="relative z-10 mt-3">
            <AddToCartButton product={product} className="w-full" />
          </div>
        </div>
      </div>
    </article>
  );
}

/** Código da etiqueta junto à referência (ex.: 16199550 · DR). */
function CodeTag({ code }: { code: string }) {
  return (
    <span className="ml-2 rounded border border-border px-1.5 py-0.5 align-middle font-mono text-[11px] font-semibold text-muted-foreground">
      {code}
    </span>
  );
}
