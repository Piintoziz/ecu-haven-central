import { Link } from "@tanstack/react-router";
import { Check, MessageSquareText, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { flyToCart } from "@/lib/fly-to-cart";
import { primaryReference } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { ProductCard } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  product: Pick<
    ProductCard,
    "id" | "slug" | "title" | "price_cents" | "stock_quantity" | "references" | "label_code"
  >;
  quantity?: number;
  size?: "sm" | "default" | "lg";
  className?: string;
  label?: string;
}

export function AddToCartButton({ product, quantity = 1, size = "sm", className, label }: Props) {
  const { add } = useCart();
  const a = useT().shop.addToCart;
  const [added, setAdded] = useState(false);
  const out = product.stock_quantity <= 0;

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(t);
  }, [added]);

  // Sem preço publicado: o cliente pede orçamento com a referência já preenchida.
  if (product.price_cents == null) {
    const ref = [primaryReference(product), product.label_code].filter(Boolean).join(" ").slice(0, 64);
    return (
      <Button asChild size={size} variant="outline" className={cn("font-bold", className)}>
        <Link to="/contactos" search={{ ref: ref.replace(/[^A-Za-z0-9 .\-/]/g, "") }}>
          <MessageSquareText />
          {a.askPrice}
        </Link>
      </Button>
    );
  }

  const priceCents = product.price_cents;
  return (
    <Button
      type="button"
      size={size}
      disabled={out}
      variant={added ? "secondary" : "default"}
      aria-live="polite"
      className={cn("font-bold", className)}
      onClick={(e) => {
        if (!added) flyToCart(e.currentTarget);
        add(
          {
            productId: product.id,
            slug: product.slug,
            title: product.title,
            reference: primaryReference(product),
            priceCents,
          },
          Math.min(quantity, product.stock_quantity),
        );
        setAdded(true);
      }}
    >
      {added ? <Check /> : <ShoppingCart />}
      {out ? a.out : added ? a.added : (label ?? a.add)}
    </Button>
  );
}
