import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Cpu, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { products } from "@/lib/mock-data";

export const Route = createFileRoute("/carrinho")({
  component: CarrinhoPage,
  head: () => ({
    meta: [
      { title: "Carrinho — Centralinas" },
      { name: "description", content: "Reveja os artigos no seu carrinho." },
    ],
  }),
});

function CarrinhoPage() {
  // TODO(backend): substituir por estado global de carrinho persistido (Cookie / DB)
  const items = [
    { product: products[0], qty: 1 },
    { product: products[3], qty: 1 },
  ];

  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const shipping = 12;
  const total = subtotal + shipping;

  return (
    <div className="container-page py-12 md:py-16">
      <div className="mono-label text-primary mb-3">Carrinho</div>
      <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-10">
        A sua encomenda
      </h1>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-4">
          {items.map(({ product, qty }) => (
            <div
              key={product.id}
              className="surface-card p-4 sm:p-6 grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr_auto] gap-4 sm:gap-6 items-center"
            >
              <div className="aspect-square grid place-items-center rounded-md border border-border bg-background">
                <Cpu className="size-8 text-primary/50" />
              </div>
              <div className="min-w-0">
                <div className="mono-label text-primary mb-1">
                  {product.make}
                </div>
                <h3 className="font-bold text-foreground truncate">
                  {product.title}
                </h3>
                <div className="font-mono text-xs text-muted-foreground mt-1">
                  OEM {product.oem}
                </div>
                <div className="sm:hidden mt-3 text-lg font-extrabold text-foreground">
                  €{(product.price * qty).toFixed(2)}
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:flex-col sm:items-end gap-3">
                <div className="flex items-center gap-2 rounded-md border border-border">
                  <button className="p-2 hover:bg-accent transition-colors">
                    <Minus className="size-3" />
                  </button>
                  <span className="font-mono text-sm w-8 text-center">
                    {qty}
                  </span>
                  <button className="p-2 hover:bg-accent transition-colors">
                    <Plus className="size-3" />
                  </button>
                </div>
                <div className="hidden sm:block text-lg font-extrabold text-foreground">
                  €{(product.price * qty).toFixed(2)}
                </div>
                <button className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="surface-card p-6 h-fit lg:sticky lg:top-24">
          <h2 className="mono-label mb-4">Resumo</h2>
          <div className="space-y-3 mb-6">
            <Row label="Subtotal" value={`€${subtotal.toFixed(2)}`} />
            <Row label="Envio" value={`€${shipping.toFixed(2)}`} />
            <Row label="IVA" value="Incluído" muted />
          </div>
          <div className="border-t border-border pt-4 mb-6 flex items-baseline justify-between">
            <span className="mono-label">Total</span>
            <span className="text-2xl font-extrabold text-foreground">
              €{total.toFixed(2)}
            </span>
          </div>
          <Link to="/checkout">
            <Button className="w-full gap-2" size="lg">
              Finalizar encomenda <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link
            to="/catalogo"
            className="mt-4 block text-center text-xs font-bold text-muted-foreground hover:text-primary"
          >
            Continuar a comprar
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={muted ? "text-muted-foreground" : "font-bold text-foreground"}>
        {value}
      </span>
    </div>
  );
}
