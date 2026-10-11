import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { AuthShell, FormAlert } from "@/components/site/auth-shell";
import { FieldWrap, TextInput } from "@/components/site/form-field";
import { Button } from "@/components/ui/button";
import { authErrorMessage, getAuthClient, safeRedirect, useAuth } from "@/lib/auth";
import { headI18n, useT } from "@/lib/i18n";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/entrar")({
  validateSearch: (s: Record<string, unknown>) =>
    z.object({ redirect: z.string().max(200).optional().catch(undefined) }).parse(s),
  head: ({ match }) => {
    const { locale, t } = headI18n(match);
    return pageHead({ title: t.auth.signIn.title, description: t.auth.signIn.metaDescription, path: "/entrar", noindex: true, locale });
  },
  component: EntrarPage,
});

function EntrarPage() {
  const { redirect } = Route.useSearch();
  const target = safeRedirect(redirect);
  const navigate = useNavigate();
  const { ready, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const t = useT();
  const s = t.auth.signIn;

  useEffect(() => {
    if (ready && user) void navigate({ to: target, replace: true });
  }, [ready, user, target, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await getAuthClient().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (err) setError(t.common.msg(authErrorMessage(err.message)));
    // sucesso: o efeito acima redireciona quando a sessão e os papéis estiverem carregados
  }

  return (
    <AuthShell
      title={s.title}
      subtitle={
        <>
          {s.noAccount}{" "}
          <Link
            to="/registar"
            search={{ redirect }}
            className="font-semibold text-primary hover:underline"
          >
            {s.create}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {error && <FormAlert>{error}</FormAlert>}
        <FieldWrap id="email" label={s.email}>
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
          />
        </FieldWrap>
        <FieldWrap id="password" label={s.password}>
          <TextInput
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={72}
          />
        </FieldWrap>
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/recuperar-password"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            {s.forgot}
          </Link>
          <Button type="submit" className="font-bold" disabled={loading || !email || !password}>
            {loading && <Loader2 className="animate-spin" />}
            {s.submit}
          </Button>
        </div>
        <p className="border-t border-border pt-5 text-xs text-muted-foreground">
          {s.guest1}{" "}
          <Link to="/encomenda" className="font-semibold text-foreground hover:underline">
            {s.guestLink}
          </Link>{" "}
          {s.guest2}
        </p>
      </form>
    </AuthShell>
  );
}
