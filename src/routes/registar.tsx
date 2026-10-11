import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { AuthShell, FormAlert } from "@/components/site/auth-shell";
import { FieldWrap, TextInput } from "@/components/site/form-field";
import { Button } from "@/components/ui/button";
import {
  authErrorMessage,
  authRedirectUrl,
  getAuthClient,
  safeRedirect,
  useAuth,
} from "@/lib/auth";
import { signUpSchema } from "@/lib/schemas";
import { headI18n, useT } from "@/lib/i18n";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/registar")({
  validateSearch: (s: Record<string, unknown>) =>
    z.object({ redirect: z.string().max(200).optional().catch(undefined) }).parse(s),
  head: ({ match }) => {
    const { locale, t } = headI18n(match);
    return pageHead({ title: t.auth.signUp.title, description: t.auth.signUp.metaDescription, path: "/registar", noindex: true, locale });
  },
  component: RegistarPage,
});

type Errors = Partial<Record<"full_name" | "email" | "password" | "accept_terms", string>>;

function RegistarPage() {
  const { redirect } = Route.useSearch();
  const target = safeRedirect(redirect);
  const navigate = useNavigate();
  const { ready, user } = useAuth();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", accept_terms: false });
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const t = useT();
  const s = t.auth.signUp;

  useEffect(() => {
    if (ready && user) void navigate({ to: target, replace: true });
  }, [ready, user, target, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const parsed = signUpSchema.safeParse(form);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues)
        next[issue.path[0] as keyof Errors] ??= t.common.msg(issue.message);
      setErrors(next);
      return;
    }
    setErrors({});
    setLoading(true);
    const { data, error } = await getAuthClient().auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.full_name },
        emailRedirectTo: authRedirectUrl(target),
      },
    });
    setLoading(false);
    if (error) {
      setServerError(t.common.msg(authErrorMessage(error.message)));
      return;
    }
    // Com confirmação de email ativa não há sessão até o utilizador clicar no link.
    if (!data.session) setSentTo(parsed.data.email);
  }

  if (sentTo) {
    return (
      <AuthShell title={s.confirmTitle}>
        <div className="space-y-4 text-sm">
          <MailCheck className="size-10 text-primary" aria-hidden />
          <p>
            {s.sent1} <strong className="font-mono">{sentTo}</strong>
            {s.sent2}
          </p>
          <p className="text-muted-foreground">
            {s.notReceived}
          </p>
        </div>
      </AuthShell>
    );
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  return (
    <AuthShell
      title={s.title}
      subtitle={
        <>
          {s.haveAccount}{" "}
          <Link
            to="/entrar"
            search={{ redirect }}
            className="font-semibold text-primary hover:underline"
          >
            {s.signIn}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {serverError && <FormAlert>{serverError}</FormAlert>}
        <FieldWrap id="full_name" label={s.name} error={errors.full_name}>
          <TextInput
            id="full_name"
            autoComplete="name"
            value={form.full_name}
            onChange={set("full_name")}
            invalid={!!errors.full_name}
            maxLength={120}
          />
        </FieldWrap>
        <FieldWrap id="email" label={t.auth.signIn.email} error={errors.email}>
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
            invalid={!!errors.email}
            maxLength={254}
          />
        </FieldWrap>
        <FieldWrap
          id="password"
          label={t.auth.signIn.password}
          error={errors.password}
          hint={s.passwordHint}
        >
          <TextInput
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={set("password")}
            invalid={!!errors.password}
            maxLength={72}
          />
        </FieldWrap>
        <div>
          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={form.accept_terms}
              onChange={set("accept_terms")}
              className="mt-0.5 size-4 accent-[var(--primary)]"
            />
            <span className="text-muted-foreground">
              {s.accept1}{" "}
              <a href="/termos" target="_blank" rel="noopener" className="font-semibold text-foreground hover:underline">
                {s.terms}
              </a>{" "}
              {s.and}{" "}
              <a href="/privacidade" target="_blank" rel="noopener" className="font-semibold text-foreground hover:underline">
                {s.privacy}
              </a>
              {s.accept2}
            </span>
          </label>
          {errors.accept_terms && (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {errors.accept_terms}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full font-bold" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          {s.submit}
        </Button>
      </form>
    </AuthShell>
  );
}
