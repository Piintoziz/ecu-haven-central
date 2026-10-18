import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Phone, ShoppingCart, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { COMPANY } from "@/lib/content";
import { useCart } from "@/lib/cart";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./language-switcher";
import { LogoFull } from "./logo";

const NAV = [
  { to: "/catalogo", key: "catalog" },
  { to: "/servicos", key: "services" },
  { to: "/encomenda", key: "track" },
  { to: "/empresa", key: "about" },
  { to: "/contactos", key: "contact" },
] as const;

export function SiteHeader() {
  const t = useT();
  const l = t.layout;
  const [open, setOpen] = useState(false);
  const { count, ready } = useCart();
  const auth = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="hidden md:block border-b border-border/60 bg-surface/50">
        <div className="container-page flex h-8 items-center justify-between text-[11px] text-muted-foreground">
          <p>{l.topbar}</p>
          <a href={COMPANY.phoneHref} className="inline-flex items-center gap-1.5 hover:text-foreground">
            <Phone className="size-3" aria-hidden /> {l.support} {COMPANY.phone}
          </a>
        </div>
      </div>

      <div className="container-page flex h-16 items-center gap-3 md:gap-6">
        <Link to="/" className="flex shrink-0 items-center" aria-label={l.homeAria}>
          <LogoFull priority className="h-6 sm:h-8" />
        </Link>

        <nav aria-label={t.layout.nav.aria} className="hidden xl:flex items-center gap-5 whitespace-nowrap text-sm font-semibold">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "!text-foreground" }}
            >
              {l.nav[item.key]}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <Link
            to={auth.user ? "/conta" : "/entrar"}
            className="inline-flex h-9 items-center gap-2 rounded-md px-2.5 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={auth.user ? l.myAccount : l.signIn}
          >
            <UserRound className="size-4" aria-hidden />
            <span className="hidden 2xl:inline">{auth.user ? l.account : l.signIn}</span>
          </Link>
          <Link
            to="/carrinho"
            data-cart-target
            className="relative inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold hover:border-primary/60"
            aria-label={l.cartAria(count)}
          >
            <ShoppingCart className="size-4" aria-hidden />
            <span className="hidden sm:inline">{l.cart}</span>
            <AnimatePresence initial={false}>
              {ready && count > 0 && (
                // chave fixa: com key={count}, cliques rápidos deixavam vários badges a sair
                // ao mesmo tempo dentro do botão, que ficava cada vez mais largo
                <motion.span
                  key="badge"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 28 }}
                  className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold tabular-nums text-primary-foreground"
                >
                  <motion.span
                    key={count}
                    initial={{ scale: 1.35 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  >
                    {count}
                  </motion.span>
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <button
            type="button"
            className="xl:hidden inline-flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-accent"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? l.closeMenu : l.openMenu}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={cn("xl:hidden max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-surface", open ? "block" : "hidden")}
      >
        <div className="container-page flex flex-col gap-1 py-4">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-2 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
              activeProps={{ className: "!text-foreground bg-accent" }}
            >
              {l.nav[item.key]}
            </Link>
          ))}
          <div className="mt-3 flex items-center justify-between border-t border-border px-2 pt-4 sm:hidden">
            <span className="text-sm font-semibold text-muted-foreground">{l.language}</span>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
