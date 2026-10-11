import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { FieldWrap, TextInput } from "@/components/site/form-field";
import { Button } from "@/components/ui/button";
import { getSettings, updateSettings, type StoreSettings } from "@/lib/admin";
import { useAuth } from "@/lib/auth";
import { emailSchema } from "@/lib/schemas";

export const Route = createFileRoute("/admin/definicoes")({
  component: SettingsPage,
});

const settingsSchema = z.object({
  admin_email: z.union([emailSchema, z.literal("")]),
  vat_rate: z.number().min(0).max(30),
  bank_transfer: z.object({
    holder: z.string().trim().max(120).optional(),
    iban: z
      .string()
      .trim()
      .toUpperCase()
      .transform((v) => v.replace(/\s+/g, " "))
      .refine((v) => v === "" || /^[A-Z]{2}\d{2}[A-Z0-9 ]{10,40}$/.test(v), "IBAN inválido")
      .optional(),
    bic: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^([A-Z0-9]{8}|[A-Z0-9]{11})?$/, "BIC inválido")
      .optional(),
    bank: z.string().trim().max(80).optional(),
  }),
});

function SettingsPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ["admin", "settings"], queryFn: getSettings });
  const [form, setForm] = useState<StoreSettings | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (settings.data) setForm(settings.data);
  }, [settings.data]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = settingsSchema.safeParse(form);
      if (!parsed.success) {
        const next: Record<string, string> = {};
        for (const i of parsed.error.issues) next[i.path.join(".")] ??= i.message;
        setErrors(next);
        throw new Error("Corrija os campos assinalados.");
      }
      setErrors({});
      await updateSettings(parsed.data as StoreSettings);
    },
    onSuccess: () => {
      toast.success("Definições guardadas");
      void qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (!form) return <div className="skeleton h-96 rounded-xl" />;
  const bank = form.bank_transfer;
  const setBank = (k: keyof typeof bank, v: string) =>
    setForm({ ...form, bank_transfer: { ...bank, [k]: v } });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      noValidate
    >
      <AdminPageHeader
        title="Definições"
        description={
          isAdmin
            ? "Notificações, pagamento por transferência e IVA."
            : "Só administradores podem alterar estes valores."
        }
        actions={
          isAdmin && (
            <Button type="submit" className="font-bold" disabled={save.isPending}>
              {save.isPending ? <Loader2 className="animate-spin" /> : <Save />}
              Guardar
            </Button>
          )
        }
      />
      <fieldset disabled={!isAdmin} className="grid max-w-3xl gap-4">
        <Panel title="Notificações internas">
          <div className="p-5">
            <FieldWrap
              id="admin_email"
              label="Email para avisos de novas vendas e contactos"
              error={errors.admin_email}
              hint="Vazio = sem avisos por email (continuam visíveis no painel)."
            >
              <TextInput
                id="admin_email"
                type="email"
                value={form.admin_email}
                onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                maxLength={254}
              />
            </FieldWrap>
          </div>
        </Panel>

        <Panel title="Transferência bancária">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Incluídos no email de confirmação de cada encomenda, com o código da encomenda como
              descritivo.
            </p>
            <FieldWrap id="holder" label="Titular" className="sm:col-span-2">
              <TextInput
                id="holder"
                value={bank.holder ?? ""}
                onChange={(e) => setBank("holder", e.target.value)}
                maxLength={120}
              />
            </FieldWrap>
            <FieldWrap
              id="iban"
              label="IBAN"
              error={errors["bank_transfer.iban"]}
              className="sm:col-span-2"
            >
              <TextInput
                id="iban"
                value={bank.iban ?? ""}
                onChange={(e) => setBank("iban", e.target.value)}
                maxLength={50}
                className="font-mono"
                placeholder="PT50 0000 0000 0000 0000 0000 0"
              />
            </FieldWrap>
            <FieldWrap id="bic" label="BIC / SWIFT" optional error={errors["bank_transfer.bic"]}>
              <TextInput
                id="bic"
                value={bank.bic ?? ""}
                onChange={(e) => setBank("bic", e.target.value)}
                maxLength={11}
                className="font-mono"
              />
            </FieldWrap>
            <FieldWrap id="bank" label="Banco" optional>
              <TextInput
                id="bank"
                value={bank.bank ?? ""}
                onChange={(e) => setBank("bank", e.target.value)}
                maxLength={80}
              />
            </FieldWrap>
          </div>
        </Panel>

        <Panel title="Fiscalidade">
          <div className="p-5">
            <FieldWrap
              id="vat"
              label="Taxa de IVA (%)"
              error={errors.vat_rate}
              hint="Os preços já incluem IVA; esta taxa serve para discriminar o IVA nas encomendas."
            >
              <TextInput
                id="vat"
                type="number"
                min={0}
                max={30}
                step="0.5"
                value={form.vat_rate}
                onChange={(e) => setForm({ ...form, vat_rate: Number(e.target.value) })}
                className="max-w-32"
              />
            </FieldWrap>
          </div>
        </Panel>
      </fieldset>
    </form>
  );
}
