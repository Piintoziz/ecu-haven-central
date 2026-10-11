import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// Carrinho guardado no browser (conveniência do visitante). Preços e stock são
// SEMPRE revalidados no carrinho/checkout e recalculados no servidor.

export type CartLine = {
  productId: string;
  slug: string;
  title: string;
  reference: string;
  priceCents: number;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  ready: boolean;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  sync: (live: { id: string; price_cents: number | null; title: string }[]) => void;
};

const STORAGE_KEY = "centralinas.cart.v1";
const MAX_QTY = 10;
const MAX_LINES = 20;

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (l): l is CartLine =>
          typeof l === "object" &&
          l !== null &&
          typeof (l as CartLine).productId === "string" &&
          typeof (l as CartLine).quantity === "number",
      )
      .slice(0, MAX_LINES);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(readStorage());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* armazenamento indisponível (modo privado) — o carrinho fica só em memória */
    }
  }, [lines, ready]);

  const add = useCallback<CartContextValue["add"]>((line, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === line.productId);
      if (existing) {
        return prev.map((l) =>
          l.productId === line.productId
            ? { ...l, ...line, quantity: Math.min(MAX_QTY, l.quantity + quantity) }
            : l,
        );
      }
      if (prev.length >= MAX_LINES) return prev;
      return [...prev, { ...line, quantity: Math.min(MAX_QTY, Math.max(1, quantity)) }];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.productId === productId ? { ...l, quantity: Math.min(MAX_QTY, Math.max(1, quantity)) } : l,
      ),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const sync = useCallback<CartContextValue["sync"]>((live) => {
    setLines((prev) => {
      const byId = new Map(live.map((p) => [p.id, p]));
      const next = prev
        // sai do carrinho o que deixou de existir ou passou a "sob consulta"
        .filter((l) => byId.get(l.productId)?.price_cents != null)
        .map((l) => {
          const p = byId.get(l.productId)!;
          return { ...l, priceCents: p.price_cents!, title: p.title };
        });
      const changed =
        next.length !== prev.length ||
        next.some((l, i) => l.priceCents !== prev[i]!.priceCents || l.title !== prev[i]!.title);
      return changed ? next : prev;
    });
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      ready,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotalCents: lines.reduce((n, l) => n + l.priceCents * l.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
      sync,
    }),
    [lines, ready, add, setQuantity, remove, clear, sync],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart tem de ser usado dentro de <CartProvider>");
  return ctx;
}
