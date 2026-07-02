import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Cpu,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { ProductCard } from "@/components/site/product-card";
import { Button } from "@/components/ui/button";
import {
  availabilityLabels,
  getProduct,
  products,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produto/$id")({
  component: ProductPage,
  loader: ({ params }) => {
    const product = getProduct(params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.product.title ?? "Produto"} — Centralinas`,
      },
      {
        name: "description",
        content: loaderData?.product.description ?? "",
      },
    ],
  }),
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <div className="mono-label text-primary mb-4">Referência não encontrada</div>
      <h1 className="text-3xl font-extrabold text-foreground mb-4">
        Este produto não existe
      </h1>
      <Link to="/catalogo" className="text-sm font-bold text-primary">
        Voltar ao catálogo →
      </Link>
    </div>
  ),
});

function ProductPage() {
  const { product } = Route.useLoaderData();

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const badgeClass =
    product.availability === "in-stock"
      ? "bg-success/15 text-success"
      : product.availability === "on-order"
        ? "bg-warning/15 text-warning"
        : "bg-destructive/15 text-destructive";

  return (
    <div className="container-page py-10 md:py-14">
      <Link
        to="/catalogo"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8"
      >
        <ArrowLeft className="size-4" /> Voltar ao catálogo
      </Link>

      <div className="grid lg:grid-cols-2 gap-12 mb-16">
        {/* Gallery */}
        <div>
          <div className="surface-card relative aspect-[4/3] grid place-items-center overflow-hidden mb-4">
            <div className="absolute inset-0 grid-noise opacity-40" />
            <Cpu className="size-32 text-primary/40 relative" />
            <div className="absolute top-4 right-4">
              <span
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider",
                  badgeClass,
                )}
              >
                {availabilityLabels[product.availability]}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="surface-card aspect-square grid place-items-center opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Cpu className="size-6 text-primary/40" />
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="mono-label text-primary mb-2">
            {product.brand} · {product.make}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
            {product.title}
          </h1>
          <p className="text-muted-foreground mb-6">{product.description}</p>

          <div className="surface-card p-4 mb-6">
            <div className="mono-label mb-2">Referência OEM</div>
            <div className="font-mono text-xl font-bold text-foreground">
              {product.oem}
            </div>
          </div>

          <div className="flex items-baseline gap-3 mb-8">
            <span className="text-4xl font-extrabold text-foreground">
              €{product.price.toFixed(2)}
            </span>
            <span className="mono-label capitalize">
              {product.condition} · IVA incluído
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            {/* TODO(backend): adicionar ao carrinho real via API/estado global */}
            <Button size="lg" className="gap-2 flex-1">
              <ShoppingCart className="size-4" /> Adicionar ao carrinho
            </Button>
            <Link to="/contactos" className="flex-1">
              <Button size="lg" variant="outline" className="w-full">
                Pedir orçamento
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <TrustPill icon={ShieldCheck} label={`Garantia ${product.warrantyMonths}m`} />
            <TrustPill icon={Truck} label="Envio 24/48h" />
            <TrustPill icon={BadgeCheck} label="Testado em bancada" />
          </div>
        </div>
      </div>

      {/* Spec */}
      <div className="grid lg:grid-cols-2 gap-8 mb-20">
        <div>
          <h2 className="mono-label text-primary mb-4">Ficha técnica</h2>
          <dl className="surface-card divide-y divide-border">
            <SpecRow label="Fabricante" value={product.brand} />
            <SpecRow label="Categoria" value={product.title} />
            <SpecRow label="Referência OEM" value={product.oem} mono />
            <SpecRow label="Estado" value={product.condition} />
            <SpecRow label="Garantia" value={`${product.warrantyMonths} meses`} />
          </dl>
        </div>
        <div>
          <h2 className="mono-label text-primary mb-4">Compatibilidade</h2>
          <div className="surface-card p-6">
            <div className="mb-4">
              <div className="mono-label mb-1">Marca / Motor</div>
              <div className="font-bold text-foreground">
                {product.make} · {product.engine}
              </div>
            </div>
            <div className="mb-4">
              <div className="mono-label mb-1">Anos</div>
              <div className="font-bold text-foreground">{product.year}</div>
            </div>
            <div>
              <div className="mono-label mb-2">Modelos compatíveis</div>
              <ul className="space-y-2">
                {product.models.map((m) => (
                  <li
                    key={m}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <BadgeCheck className="size-4 text-primary shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div>
          <h2 className="text-2xl font-extrabold text-foreground mb-6">
            Produtos relacionados
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TrustPill({
  icon: Icon,
  label,
}: {
  icon: typeof ShieldCheck;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
      <Icon className="size-4 text-primary" />
      <span className="text-xs font-bold text-foreground">{label}</span>
    </div>
  );
}

function SpecRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <dt className="mono-label">{label}</dt>
      <dd
        className={cn(
          "text-sm font-bold text-foreground capitalize",
          mono && "font-mono capitalize-none",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
