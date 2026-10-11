import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { FormAlert } from "@/components/site/auth-shell";
import { FieldWrap, TextInput } from "@/components/site/form-field";
import { Button } from "@/components/ui/button";
import { authErrorMessage, getAuthClient, useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { passwordSchema } from "@/lib/schemas";

export const Route = createFileRoute("/conta/password")({
  component: PasswordPage,
});

function PasswordPage() {
  const { recovering } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const t = useT();
  const s = t.auth.password;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(t.common.msg(parsed.error.issues[0]?.message ?? s.invalid));
      return;
    }
    if (password !== confirm) {
      setError(s.mismatch);
      return;
    }
    setSaving(true);
    const { error: err } = await getAuthClient().auth.updateUser({ password });
    setSaving(false);
    if (err) setError(t.common.msg(authErrorMessage(err.message)));
    else {
      setDone(true);
      setPassword("");
      setConfirm("");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-md space-y-5 rounded-xl border border-border bg-surface p-6"
      noValidate
    >
      {recovering && !done && (
        <FormAlert tone="success">
          {s.recovering}
        </FormAlert>
      )}
      {done && <FormAlert tone="success">{s.done}</FormAlert>}
      {error && <FormAlert>{error}</FormAlert>}
      <FieldWrap
        id="new-password"
        label={s.new}
        hint={t.auth.signUp.passwordHint}
      >
        <TextInput
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={72}
        />
      </FieldWrap>
      <FieldWrap id="confirm-password" label={s.repeat}>
        <TextInput
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          maxLength={72}
        />
      </FieldWrap>
      <Button type="submit" className="font-bold" disabled={saving || !password}>
        {saving && <Loader2 className="animate-spin" />}
        {s.submit}
      </Button>
    </form>
  );
}
