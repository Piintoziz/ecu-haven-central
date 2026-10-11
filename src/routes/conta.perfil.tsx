import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { FormAlert } from "@/components/site/auth-shell";
import { FieldWrap, SelectInput, TextInput } from "@/components/site/form-field";
import { Button } from "@/components/ui/button";
import { getMyProfile, updateMyProfile } from "@/lib/account";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { profileSchema, type ProfileInput } from "@/lib/schemas";

export const Route = createFileRoute("/conta/perfil")({
  component: PerfilPage,
});

const EMPTY: ProfileInput = {
  full_name: "",
  phone: "",
  company_name: "",
  vat_number: "",
  customer_type: "b2c",
};

function PerfilPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profile = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: () => getMyProfile(user!.id),
    enabled: !!user,
  });
  const [form, setForm] = useState<ProfileInput>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileInput, string>>>({});
  const [status, setStatus] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const t = useT();
  const s = t.auth.profile;

  useEffect(() => {
    if (profile.data) {
      const { id: _id, ...rest } = profile.data;
      setForm(rest);
    }
  }, [profile.data]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues)
        next[issue.path[0] as keyof ProfileInput] ??= t.common.msg(issue.message);
      setErrors(next);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await updateMyProfile(user!.id, parsed.data);
      await qc.invalidateQueries({ queryKey: ["my-profile", user!.id] });
      setStatus({ tone: "success", text: s.saved });
    } catch (err) {
      setStatus({ tone: "error", text: t.common.msg((err as Error).message) });
    } finally {
      setSaving(false);
    }
  }

  if (profile.isLoading) return <div className="skeleton h-80 max-w-2xl rounded-xl" />;

  const set =
    (key: keyof ProfileInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-2xl space-y-6 rounded-xl border border-border bg-surface p-6"
      noValidate
    >
      <p className="text-sm text-muted-foreground">
        {s.intro}
      </p>
      {status && <FormAlert tone={status.tone}>{status.text}</FormAlert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldWrap id="full_name" label={s.name} error={errors.full_name}>
          <TextInput
            id="full_name"
            value={form.full_name}
            onChange={set("full_name")}
            invalid={!!errors.full_name}
            maxLength={120}
            autoComplete="name"
          />
        </FieldWrap>
        <FieldWrap id="phone" label={s.phone} optional error={errors.phone}>
          <TextInput
            id="phone"
            type="tel"
            value={form.phone}
            onChange={set("phone")}
            invalid={!!errors.phone}
            maxLength={32}
            autoComplete="tel"
          />
        </FieldWrap>
        <FieldWrap id="customer_type" label={s.type}>
          <SelectInput
            id="customer_type"
            value={form.customer_type}
            onChange={set("customer_type")}
          >
            <option value="b2c">{s.b2c}</option>
            <option value="b2b">{s.b2b}</option>
          </SelectInput>
        </FieldWrap>
        <FieldWrap id="vat_number" label={s.vat} optional error={errors.vat_number}>
          <TextInput
            id="vat_number"
            value={form.vat_number}
            onChange={set("vat_number")}
            invalid={!!errors.vat_number}
            maxLength={32}
          />
        </FieldWrap>
        <FieldWrap
          id="company_name"
          label={s.company}
          optional
          className="sm:col-span-2"
          error={errors.company_name}
        >
          <TextInput
            id="company_name"
            value={form.company_name}
            onChange={set("company_name")}
            maxLength={160}
            autoComplete="organization"
          />
        </FieldWrap>
      </div>
      <Button type="submit" className="font-bold" disabled={saving}>
        {saving && <Loader2 className="animate-spin" />}
        {s.save}
      </Button>
    </form>
  );
}
