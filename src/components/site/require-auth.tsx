import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { EcuScanLoader } from "./ecu-scan-loader";

/**
 * Proteção de interface para páginas com sessão. NÃO é a barreira de segurança:
 * essa é a RLS no Postgres — sem sessão válida as consultas devolvem vazio/erro.
 */
export function RequireAuth({ staff = false, children }: { staff?: boolean; children: ReactNode }) {
  const { ready, user, isStaff } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const href = useRouterState({ select: (s) => s.location.href });
  // URL da página protegida no momento da montagem: durante a navegação para
  // /entrar o href muda e não pode voltar a alimentar o redirect.
  const [returnTo] = useState(href);
  const redirected = useRef(false);

  useEffect(() => {
    if (ready && !user && !redirected.current) {
      redirected.current = true;
      const redirect = returnTo.startsWith("/entrar") ? undefined : returnTo;
      void navigate({ to: "/entrar", search: { redirect }, replace: true });
    }
  }, [ready, user, returnTo, navigate]);

  if (!ready || !user) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <EcuScanLoader label={t.layout.checkingSession} />
      </div>
    );
  }

  if (staff && !isStaff) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-4">
        <div className="max-w-sm text-center">
          <ShieldAlert className="mx-auto size-10 text-warning" aria-hidden />
          <h1 className="mt-4 text-xl font-extrabold">{t.auth.restricted}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.auth.restrictedText}
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-md border border-border px-4 py-2 text-sm font-bold hover:bg-accent"
          >
            {t.auth.backToShop}
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
