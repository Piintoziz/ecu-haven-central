import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut } from "lucide-react";
import { RequireAuth } from "@/components/site/require-auth";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { headI18n, useT } from "@/lib/i18n";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/conta")({
  // Sessão vive no browser: sem SSR para não renderizar dados de outra pessoa em cache.
  ssr: false,
  head: ({ match }) => {
    const { locale, t } = headI18n(match);
    return pageHead({ title: t.orders.account.metaTitle, description: t.orders.account.metaDescription, path: "/conta", noindex: true, locale });
  },
  component: ContaLayout,
});

const TABS = [
  { to: "/conta", label: "orders", exact: true },
  { to: "/conta/perfil", label: "profile", exact: false },
  { to: "/conta/password", label: "password", exact: false },
] as const;

function ContaLayout() {
  return (
    <RequireAuth>
      <ContaShell />
    </RequireAuth>
  );
}

function ContaShell() {
  const { user, isStaff, signOut } = useAuth();
  const navigate = useNavigate();
  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email;
  const tr = useT();
  const a = tr.orders.account;

  return (
    <div className="container-page py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="mono-label text-primary">{a.area}</p>
          <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">{a.hello(name ?? "")}</h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <div className="flex gap-2">
          {isStaff && (
            <Button asChild variant="outline" size="sm" className="font-bold">
              <Link to="/admin">
                <LayoutDashboard /> {a.backoffice}
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="font-bold"
            onClick={async () => {
              await signOut();
              void navigate({ to: "/" });
            }}
          >
            <LogOut /> {a.signOut}
          </Button>
        </div>
      </div>

      <nav aria-label={tr.auth.accountNav} className="mt-6 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: t.exact }}
            className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            activeProps={{ className: "!text-foreground bg-surface-elevated" }}
          >
            {a.tabs[t.label]}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
