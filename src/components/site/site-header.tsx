import { Link } from "@tanstack/react-router";
import { Menu, ShoppingCart, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "./search-bar";

const NAV = [
  { to: "/catalogo", label: "Catálogo" },
  { to: "/servicos", label: "Serviços" },
  { to: "/encomenda", label: "Acompanhar Encomenda" },
  { to: "/sobre", label: "Sobre" },
  { to: "/contactos", label: "Contactos" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container-page grid grid-cols-[auto_1fr_auto] items-center gap-6 h-16 md:h-20">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="grid size-9 place-items-center rounded-md bg-primary">
            <span className="font-display font-extrabold text-primary-foreground">C</span>
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-display font-extrabold tracking-tight text-foreground">
              CENTRALINAS
            </span>
            <span className="mono-label mt-1">Euro-Stock Leader</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8 justify-center text-sm font-semibold text-muted-foreground">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="hover:text-primary transition-colors"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 justify-end">
          {/* TODO(backend): trocar por estado real de auth */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:inline-flex text-muted-foreground hover:text-foreground"
          >
            <User className="size-4" />
            <span className="hidden xl:inline">Conta</span>
          </Button>
          <Link to="/carrinho">
            <Button variant="outline" size="sm" className="gap-2">
              <ShoppingCart className="size-4" />
              <span className="hidden sm:inline">Carrinho</span>
              <span className="mono-label text-primary">0</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-surface">
          <div className="container-page py-4 flex flex-col gap-3">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm font-semibold text-muted-foreground py-2"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <SearchBar compact />
          </div>
        </div>
      )}
    </header>
  );
}
