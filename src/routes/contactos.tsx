import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, Clock, Loader2, Mail, MapPin, Phone, Send } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import { Controller, useForm, type Path } from "react-hook-form";
import { z } from "zod";
import { FieldWrap, Honeypot, TextArea, TextInput } from "@/components/site/form-field";
import { PhoneInput } from "@/components/site/phone-input";
import { Turnstile } from "@/components/site/turnstile";
import { Button } from "@/components/ui/button";
import { submitContact } from "@/lib/contact.functions";
import { COMPANY } from "@/lib/content";
import { contactInputSchema } from "@/lib/schemas";
import { headI18n, useI18n } from "@/lib/i18n";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/contactos")({
  validateSearch: (s: Record<string, unknown>) =>
    z
      .object({ ref: z.string().max(64).regex(/^[A-Za-z0-9 .\-/]*$/).optional().catch(undefined) })
      .parse(s),
  head: ({ match }) => {
    const { locale, t } = headI18n(match);
    return pageHead({ title: t.info.contact.metaTitle, description: t.info.contact.metaDescription, path: "/contactos", locale });
  },
  component: ContactosPage,
});

type FormValues = {
  name: string;
  company: string;
  email: string;
  phone: string;
  product_reference: string;
  vin: string;
  message: string;
  website: string;
};

function ContactosPage() {
  const { ref } = Route.useSearch();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [token, setToken] = useState<string | undefined>();
  const onToken = useCallback((tk: string | undefined) => setToken(tk), []);
  const { t, locale } = useI18n();
  const c = t.info.contact;
  const msg = (m?: string) => (m ? t.common.msg(m) : undefined);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      product_reference: ref ?? "",
      vin: "",
      message: "",
      website: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const payload = { ...values, turnstile_token: token, locale };
    const parsed = contactInputSchema.safeParse(payload);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        setError(issue.path.join(".") as Path<FormValues>, { message: issue.message });
      }
      return;
    }
    try {
      const res = await submitContact({ data: payload });
      if (res.ok) setSent(true);
      else setServerError(res.error);
    } catch {
      setServerError(c.failed);
    }
  }

  return (
    <div className="container-page py-12 md:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-extrabold md:text-4xl">{c.title}</h1>
        <p className="mt-3 text-muted-foreground">
          {c.lead}
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="relative rounded-xl border border-border bg-surface p-6 md:p-8">
          {sent ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="py-10 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-success/15">
                <Check className="size-6 text-success" aria-hidden />
              </div>
              <h2 className="mt-4 text-2xl font-extrabold">{c.sentTitle}</h2>
              <p className="mt-2 text-muted-foreground">{c.sentText}</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <Honeypot {...register("website")} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldWrap id="name" label={c.name} error={msg(errors.name?.message)}>
                  <TextInput id="name" autoComplete="name" maxLength={120} invalid={!!errors.name} {...register("name")} />
                </FieldWrap>
                <FieldWrap id="company" label={c.company} optional>
                  <TextInput id="company" autoComplete="organization" maxLength={160} {...register("company")} />
                </FieldWrap>
                <FieldWrap id="email" label={c.email} error={msg(errors.email?.message)}>
                  <TextInput id="email" type="email" autoComplete="email" maxLength={254} invalid={!!errors.email} {...register("email")} />
                </FieldWrap>
                <FieldWrap id="phone" label={c.phone} optional error={msg(errors.phone?.message)}>
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field }) => (
                      <PhoneInput id="phone" value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={!!errors.phone} />
                    )}
                  />
                </FieldWrap>
                <FieldWrap id="product_reference" label={c.ref} optional error={msg(errors.product_reference?.message)} hint={c.refHint}>
                  <TextInput id="product_reference" className="font-mono" maxLength={64} invalid={!!errors.product_reference} {...register("product_reference")} />
                </FieldWrap>
                <FieldWrap id="vin" label={c.vin} optional error={msg(errors.vin?.message)}>
                  <TextInput id="vin" className="font-mono uppercase" maxLength={17} invalid={!!errors.vin} {...register("vin")} />
                </FieldWrap>
              </div>
              <FieldWrap id="message" label={c.message} error={msg(errors.message?.message)}>
                <TextArea
                  id="message"
                  rows={5}
                  maxLength={5000}
                  placeholder={c.messagePlaceholder}
                  invalid={!!errors.message}
                  {...register("message")}
                />
              </FieldWrap>
              <Turnstile onToken={onToken} />
              {serverError && (
                <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {t.common.msg(serverError)}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-xs text-muted-foreground">
                  {c.privacy1}{" "}
                  <a href="/privacidade" target="_blank" rel="noopener" className="font-semibold text-foreground hover:underline">
                    {c.privacyLink}
                  </a>
                  .
                </p>
                <Button type="submit" size="lg" className="font-bold" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
                  {c.submit}
                </Button>
              </div>
            </form>
          )}
        </div>

        <aside className="space-y-6">
          <ul className="divide-y divide-border rounded-xl border border-border text-sm">
            <Info icon={Phone} label={c.phone}>
              <a href={COMPANY.phoneHref} className="hover:text-primary">{COMPANY.phone}</a>
            </Info>
            <Info icon={Mail} label={c.email}>
              <a href={`mailto:${COMPANY.email}`} className="hover:text-primary">{COMPANY.email}</a>
            </Info>
            <Info icon={MapPin} label={c.address}>{COMPANY.address}</Info>
            <Info icon={Clock} label={c.hours}>{t.layout.hours}</Info>
          </ul>
          <div className="rounded-xl border border-border p-5 text-sm">
            <h2 className="font-bold">{c.faster}</h2>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-muted-foreground">
              {c.fasterList.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, children }: { icon: typeof Phone; label: string; children: ReactNode }) {
  return (
    <li className="flex gap-4 p-4">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <div>
        <p className="mono-label mb-0.5">{label}</p>
        <div className="text-foreground">{children}</div>
      </div>
    </li>
  );
}
