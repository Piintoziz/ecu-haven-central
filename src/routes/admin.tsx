import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  ExternalLink,
  FileSpreadsheet,
  Gauge,
  LogOut,
  Menu,
  MessageSquareText,
  PackageCheck,
  Settings,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/site/logo";
import { RequireAuth } from "@/components/site/require-auth";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Backoffice | Centralinas" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Painel", icon: Gauge, exact: true },
  { to: "/admin/encomendas", label: "Encomendas", icon: PackageCheck, exact: false },
  { to: "/admin/produtos", label: "Produtos & stock", icon: Boxes, exact: false },
  { to: "/admin/importar", label: "Importar catálogo", icon: FileSpreadsheet, exact: false },
  { to: "/admin/mensagens", label: "Mensagens", icon: MessageSquareText, exact: false },
  { to: "/admin/definicoes", label: "Definições", icon: Settings, exact: false },
] as const;

function AdminLayout() {
  return (
    <div className="min-h-screen bg-background" lang="pt">
      <I18nProvider locale="pt">
        <RequireAuth staff>
          <AdminShell />
        </RequireAuth>
      </I18nProvider>
      <Toaster position="bottom-right" theme="dark" richColors />
    </div>
  );
}

function AdminShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const nav = (
    <nav aria-label="Backoffice" className="flex flex-col gap-0.5">
      {NAV.map(({ to, label, icon: Icon, exact }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact }}
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          activeProps={{ className: "!bg-primary/10 !text-primary" }}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="space-y-1 border-t border-border pt-4 text-sm">
      <a
        href="/"
        target="_blank"
        rel="noopener"
        className="flex items-center gap-2.5 rounded-md px-3 py-2 font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <ExternalLink className="size-4" aria-hidden /> Ver loja
      </a>
      <button
        type="button"
        onClick={async () => {
          await signOut();
          void navigate({ to: "/" });
        }}
        className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <LogOut className="size-4" aria-hidden /> Sair
      </button>
      <p className="truncate px-3 pt-2 font-mono text-[11px] text-muted-foreground/70">
        {user?.email}
      </p>
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-[232px_1fr]">
      {/* Barra lateral (desktop) */}
      <aside className="sticky top-0 hidden h-screen flex-col justify-between border-r border-border bg-surface/60 p-4 lg:flex">
        <div>
          <Link to="/admin" className="mb-6 flex items-center gap-2.5 px-2">
            <LogoMark />
            <span className="leading-none">
              <span className="block text-[13px] font-extrabold tracking-tight">CENTRALINAS</span>
              <span className="mono-label text-[10px] text-primary">backoffice</span>
            </span>
          </Link>
          {nav}
        </div>
        {footer}
      </aside>

      {/* Barra superior (mobile) */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
        <Link to="/admin" className="flex items-center gap-2">
          <LogoMark />
          <span className="mono-label text-primary">backoffice</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          className="inline-flex size-9 items-center justify-center rounded-md hover:bg-accent"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      <div
        className={cn("border-b border-border bg-surface p-4 lg:hidden", open ? "block" : "hidden")}
      >
        {nav}
        <div className="mt-4">{footer}</div>
      </div>

      <div className="min-w-0 px-4 py-6 md:px-8 md:py-8">
        <Outlet />
      </div>
    </div>
  );
}
