import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { AuthShell, FormAlert } from "@/components/site/auth-shell";
import { FieldWrap, TextInput } from "@/components/site/form-field";
import { Button } from "@/components/ui/button";
import { authErrorMessage, authRedirectUrl, getAuthClient } from "@/lib/auth";
import { emailSchema } from "@/lib/schemas";
import { headI18n, useT } from "@/lib/i18n";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/recuperar-password")({
  head: ({ match }) => {
    const { locale, t } = headI18n(match);
    return pageHead({ title: t.auth.recover.title, description: t.auth.recover.metaDescription, path: "/recuperar-password", noindex: true, locale });
  },
  component: RecuperarPage,
});

function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = useT();
  const s = t.auth.recover;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(s.invalidEmail);
      return;
    }
    setLoading(true);
    const { error: err } = await getAuthClient().auth.resetPasswordForEmail(parsed.data, {
      redirectTo: authRedirectUrl("/conta/password"),
    });
    setLoading(false);
    // Resposta igual quer o email exista ou não (não revela contas registadas).
    if (err && err.message.toLowerCase().includes("rate")) setError(t.common.msg(authErrorMessage(err.message)));
    else setSent(true);
  }

  return (
    <AuthShell
      title={s.title}
      subtitle={s.subtitle}
    >
      {sent ? (
        <FormAlert tone="success">
          {s.sent}
        </FormAlert>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {error && <FormAlert>{error}</FormAlert>}
          <FieldWrap id="email" label={t.auth.signIn.email}>
            <TextInput
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
            />
          </FieldWrap>
          <Button type="submit" className="w-full font-bold" disabled={loading || !email}>
            {loading && <Loader2 className="animate-spin" />}
            {s.submit}
          </Button>
        </form>
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        <Link to="/entrar" className="font-semibold text-foreground hover:underline">
          {s.back}
        </Link>
      </p>
    </AuthShell>
  );
}
