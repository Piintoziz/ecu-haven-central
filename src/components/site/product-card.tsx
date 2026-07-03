import { Link } from "@tanstack/react-router";
import { availabilityLabels, type Product } from "@/lib/mock-data";
import { categoryImage } from "@/lib/images";
import { cn } from "@/lib/utils";

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const badgeClass =
    product.availability === "in-stock"
      ? "bg-success/15 text-success"
      : product.availability === "on-order"
        ? "bg-warning/15 text-warning"
        : "bg-destructive/15 text-destructive";

  const img = product.image || categoryImage[product.category];

  return (
    <Link
      to="/produto/$id"
      params={{ id: product.id }}
      className="group surface-card overflow-hidden flex flex-col hover:border-primary/50 transition-colors"
    >
      <div className="relative aspect-[4/3] bg-background border-b border-border overflow-hidden">
        <img
          src={img}
          alt={product.title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover img-treated transition-transform duration-[600ms] ease-out group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/30 to-transparent" />
        <div className="absolute top-3 right-3">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm",
              badgeClass,
            )}
          >
            {availabilityLabels[product.availability]}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 mono-label text-foreground/80">
          {product.brand}
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1">
        <div>
          <div className="mono-label text-primary mb-1">{product.make}</div>
          <h3 className="text-base font-bold text-foreground leading-tight">
            {product.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {product.models[0]} · {product.year}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-background/60 p-3">
          <div className="mono-label mb-1">OEM Reference</div>
          <div className="font-mono text-sm text-foreground tracking-tight">
            {product.oem}
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div>
            <div className="mono-label mb-1 capitalize">{product.condition}</div>
            <div className="text-xl font-extrabold text-foreground">
              €{product.price.toFixed(2)}
            </div>
          </div>
          <span className="text-xs font-bold text-primary translate-x-0 group-hover:translate-x-1 transition-transform">
            Ver detalhes →
          </span>
        </div>
      </div>
    </Link>
  );
}
