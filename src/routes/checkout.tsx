import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Controller, useForm, type Path, type UseFormRegister } from "react-hook-form";
import { AdaptationNotice, hasAdaptationAck } from "@/components/site/adaptation-notice";
import { CheckoutSteps } from "@/components/site/checkout-steps";
import { FieldWrap, Honeypot, SelectInput, TextArea, TextInput } from "@/components/site/form-field";
import { OrderComplete, type CompletedOrder } from "@/components/site/order-complete";
import { PhoneInput } from "@/components/site/phone-input";
import { Turnstile } from "@/components/site/turnstile";
import { Button } from "@/components/ui/button";
import { getAuthClient, useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { getShippingOptions } from "@/lib/catalog";
import { COUNTRIES } from "@/lib/countries";
import { headI18n, useI18n, useT } from "@/lib/i18n";
import { placeOrder } from "@/lib/orders.functions";
import { ONLINE_BRANDS, PAYMENT_METHODS } from "@/lib/payments";
import { EcuScanLoader } from "@/components/site/ecu-scan-loader";
import { orderInputSchema } from "@/lib/schemas";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: ({ match }) => {
    const { locale, t } = headI18n(match);
    return pageHead({
      title: t.shop.checkout.title,
      description: t.shop.checkout.metaDescription,
      path: "/checkout",
      noindex: true,
      locale,
    });
  },
  component: CheckoutPage,
});

type Address = {
  full_name: string;
  company_name: string;
  line1: string;
  line2: string;
  postal_code: string;
  city: string;
  region: string;
  country_code: string;
};

type FormValues = {
  email: string;
  phone: string;
  vat_number: string;
  shipping_address: Address;
  billing_same_as_shipping: boolean;
  billing_address: Address;
  shipping_rate_id: string;
  payment_method: string;
  notes: string;
  accept_terms: boolean;
  website: string;
};

const emptyAddress: Address = {
  full_name: "",
  company_name: "",
  line1: "",
  line2: "",
  postal_code: "",
  city: "",
  region: "",
  // Sem país por omissão: os portes só são calculados depois de o cliente indicar a morada.
  country_code: "",
};

function CheckoutPage() {
  const cart = useCart();
  const auth = useAuth();
  const navigate = useNavigate();
  const [done, setDone] = useState<CompletedOrder | null>(null);
  const { t, locale } = useI18n();
  const c = t.shop.checkout;
  const formatPrice = t.common.price;
  // Aviso de adaptação ao veículo: obrigatório antes de finalizar (também para quem chega direto ao /checkout)
  const [noticeOpen, setNoticeOpen] = useState(false);
  useEffect(() => {
    if (!hasAdaptationAck()) setNoticeOpen(true);
  }, []);
  const [serverError, setServerError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [redirecting, setRedirecting] = useState(false);
  const onToken = useCallback((t: string | undefined) => setTurnstileToken(t), []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      email: "",
      phone: "",
      vat_number: "",
      shipping_address: emptyAddress,
      billing_same_as_shipping: true,
      billing_address: emptyAddress,
      shipping_rate_id: "",
      payment_method: "stripe",
      notes: "",
      accept_terms: false,
      website: "",
    },
  });

  // Cliente com sessão: pré-preenche contacto e dados de faturação do perfil.
  const userId = auth.user?.id;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    if (auth.user?.email) setValue("email", auth.user.email);
    void getAuthClient()
      .from("profiles")
      .select("full_name, phone, company_name, vat_number")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data) return;
        if (data.full_name) setValue("shipping_address.full_name", data.full_name);
        if (data.phone) setValue("phone", data.phone);
        if (data.company_name) setValue("shipping_address.company_name", data.company_name);
        if (data.vat_number) setValue("vat_number", data.vat_number);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, setValue]);

  const country = watch("shipping_address.country_code");
  const postalCode = watch("shipping_address.postal_code");
  const hasDestination = !!country && (postalCode ?? "").trim().length >= 3;
  const sameBilling = watch("billing_same_as_shipping");
  const rateId = watch("shipping_rate_id");
  const paymentMethod = watch("payment_method");

  const items = useMemo(
    () => cart.lines.map((l) => ({ product_id: l.productId, quantity: l.quantity })),
    [cart.lines],
  );

  const shipping = useQuery({
    queryKey: ["shipping", country, items],
    queryFn: () => getShippingOptions(country, items),
    enabled: cart.ready && items.length > 0 && hasDestination,
  });

  // Seleciona automaticamente a opção mais barata quando o destino muda
  useEffect(() => {
    const opts = shipping.data;
    if (!opts) return;
    if (!opts.some((o) => o.id === rateId)) {
      const cheapest = [...opts].sort((a, b) => a.price_cents - b.price_cents)[0];
      setValue("shipping_rate_id", cheapest?.id ?? "");
    }
  }, [shipping.data, rateId, setValue]);

  const selectedRate = hasDestination ? shipping.data?.find((o) => o.id === rateId) : undefined;
  const totalCents = cart.subtotalCents + cart.vatCents + (selectedRate?.price_cents ?? 0);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const payload = {
      items,
      email: values.email,
      phone: values.phone,
      vat_number: values.vat_number,
      shipping_address: values.shipping_address,
      billing_same_as_shipping: values.billing_same_as_shipping,
      billing_address: values.billing_same_as_shipping ? undefined : values.billing_address,
      shipping_rate_id: values.shipping_rate_id,
      notes: values.notes,
      accept_terms: values.accept_terms,
      website: values.website,
      turnstile_token: turnstileToken,
      access_token: auth.session?.access_token,
      locale,
      payment_method: values.payment_method === "bank_transfer" ? "bank_transfer" : "stripe",
    };

    const parsed = orderInputSchema.safeParse(payload);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".");
        if (path === "items") setServerError(issue.message);
        else setError(path as Path<FormValues>, { message: issue.message });
      }
      return;
    }

    try {
      const res = await placeOrder({ data: payload });
      if (res.ok && res.pay_url) {
        // Pagamento online: o carrinho fica vazio e o cliente segue para o Stripe.
        cart.clear();
        setRedirecting(true);
        window.location.assign(res.pay_url);
        return;
      }
      if (res.ok) {
        setDone({
          order_code: res.order_code,
          email: res.email,
          subtotal_cents: res.subtotal_cents,
          shipping_cents: res.shipping_cents,
          vat_cents: res.vat_cents,
          total_cents: res.total_cents,
          bank: res.bank,
          lines: cart.lines,
          shipTo: values.shipping_address,
          rate: selectedRate ?? null,
          hasAccount: !!auth.user,
          payError: res.pay_error,
        });
        cart.clear();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setServerError(res.error);
      }
    } catch {
      setServerError(c.failed);
    }
  }

  if (done) return <OrderComplete order={done} />;
  if (redirecting) {
    return (
      <div className="container-page grid min-h-[50vh] place-items-center py-20">
        <EcuScanLoader label={c.redirecting} />
      </div>
    );
  }


  if (cart.ready && cart.lines.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-3xl font-extrabold">{c.emptyTitle}</h1>
        <Link to="/catalogo" className="mt-6 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
          {t.shop.cart.goCatalog}
        </Link>
      </div>
    );
  }

  const err = (path: string): string | undefined => {
    const parts = path.split(".");
    let node: unknown = errors;
    for (const p of parts) node = (node as Record<string, unknown> | undefined)?.[p];
    const m = (node as { message?: string } | undefined)?.message;
    return m ? t.common.msg(m) : undefined;
  };

  return (
    <div className="container-page py-10 md:py-14">
      <CheckoutSteps current={2} />
      <AdaptationNotice
        open={noticeOpen}
        cancelLabel={t.shop.adaptation.backToCart}
        onCancel={() => void navigate({ to: "/carrinho" })}
        onContinue={() => setNoticeOpen(false)}
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-extrabold md:text-4xl">{c.title}</h1>
        <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="size-3.5" aria-hidden /> {c.secure} ·{" "}
          {auth.user ? (
            <>{c.linked}</>
          ) : (
            <>
              {c.noAccount} ·{" "}
              <Link to="/entrar" search={{ redirect: "/checkout" }} className="font-semibold text-foreground hover:underline">
                {c.signIn}
              </Link>
            </>
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <Honeypot {...register("website")} />
        <div className="space-y-10">
          <Step n={1} title={c.contact}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldWrap id="email" label={c.email} error={err("email")} hint={c.emailHint}>
                <TextInput id="email" type="email" autoComplete="email" maxLength={254} invalid={!!err("email")} {...register("email")} />
              </FieldWrap>
              <FieldWrap id="phone" label={c.phone} error={err("phone")} hint={c.phoneHint}>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field }) => (
                    <PhoneInput
                      id="phone"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      defaultCountry={country || "PT"}
                      invalid={!!err("phone")}
                    />
                  )}
                />
              </FieldWrap>
              <FieldWrap id="vat_number" label={c.vat} optional error={err("vat_number")} hint={c.vatHint}>
                <TextInput id="vat_number" autoComplete="off" maxLength={32} invalid={!!err("vat_number")} {...register("vat_number")} />
              </FieldWrap>
            </div>
          </Step>

          <Step n={2} title={c.shipTo}>
            <AddressFields prefix="shipping_address" register={register} err={err} />
            <label className="mt-5 flex items-center gap-2.5 text-sm">
              <input type="checkbox" className="size-4 accent-[var(--color-primary)]" {...register("billing_same_as_shipping")} />
              {c.sameBilling}
            </label>
            {!sameBilling && (
              <div className="mt-6 border-t border-border pt-6">
                <h3 className="mb-4 text-sm font-bold">{c.billing}</h3>
                <AddressFields prefix="billing_address" register={register} err={err} />
              </div>
            )}
          </Step>

          <Step n={3} title={c.shipping}>
            {!hasDestination ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                {c.needAddress}
              </p>
            ) : shipping.isLoading ? (
              <div className="skeleton h-24 rounded-lg" />
            ) : shipping.data && shipping.data.length > 0 ? (
              <fieldset className="space-y-2">
                <legend className="sr-only">{c.shippingMethod}</legend>
                {shipping.data.map((o) => (
                  <label
                    key={o.id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-4 transition-colors",
                      rateId === o.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <input type="radio" value={o.id} className="accent-[var(--color-primary)]" {...register("shipping_rate_id")} />
                      <span>
                        <span className="block text-sm font-bold">
                          {o.carrier} · {t.common.serviceLevel[o.service_level]}
                        </span>
                        <span className="text-xs text-muted-foreground">{t.common.delivery(o.est_days_min, o.est_days_max)}</span>
                      </span>
                    </span>
                    <span className="font-mono text-sm font-bold tabular-nums">{formatPrice(o.price_cents)}</span>
                  </label>
                ))}
              </fieldset>
            ) : (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                {c.noRate}{" "}
                <Link to="/contactos" className="text-primary underline-offset-4 hover:underline">
                  {c.askQuote}
                </Link>
                .
              </p>
            )}
            {err("shipping_rate_id") && <p className="mt-2 text-xs text-destructive">{err("shipping_rate_id")}</p>}
          </Step>

          <Step n={4} title={c.payment}>
            <fieldset className="space-y-2">
              <legend className="sr-only">{c.paymentMethod}</legend>
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-4 transition-colors",
                    !m.enabled
                      ? "border-border/60 opacity-60"
                      : paymentMethod === m.id
                        ? "cursor-pointer border-primary bg-primary/5"
                        : "cursor-pointer border-border hover:border-primary/40",
                  )}
                >
                  <input type="radio" value={m.id} disabled={!m.enabled} className="mt-1 accent-[var(--color-primary)]" {...register("payment_method")} />
                  <span>
                    <span className="block text-sm font-bold">{c.methods[m.id].label}</span>
                    <span className="text-xs text-muted-foreground">{c.methods[m.id].description}</span>
                    {m.id === "stripe" && (
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        {ONLINE_BRANDS.map((b) => (
                          <span key={b} className="rounded border border-border bg-background px-1.5 py-0.5 text-[11px] font-semibold text-foreground/80">
                            {b}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </fieldset>
            <FieldWrap id="notes" label={c.notes} optional className="mt-5" error={err("notes")}>
              <TextArea id="notes" rows={3} maxLength={1000} placeholder={c.notesPlaceholder} {...register("notes")} />
            </FieldWrap>
          </Step>
        </div>

        {/* Resumo */}
        <aside className="self-start rounded-xl border border-border bg-surface p-6 lg:sticky lg:top-28">
          <h2 className="text-lg font-extrabold">{c.summary}</h2>
          <ul className="mt-4 divide-y divide-border text-sm">
            {cart.lines.map((l) => (
              <li key={l.productId} className="flex justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate font-mono font-bold">{l.reference}</span>
                  <span className="text-xs text-muted-foreground">{l.quantity} × {formatPrice(l.priceCents)}</span>
                </span>
                <span className="tabular-nums">{formatPrice(l.priceCents * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t.shop.cart.subtotal}</dt>
              <dd className="tabular-nums">{formatPrice(cart.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t.shop.cart.vat}</dt>
              <dd className="tabular-nums">{formatPrice(cart.vatCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t.shop.cart.shipping}</dt>
              <dd className="tabular-nums">{selectedRate ? formatPrice(selectedRate.price_cents) : "—"}</dd>
            </div>
          </dl>
          <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
            <span className="font-bold">Total</span>
            <span className="text-2xl font-extrabold tabular-nums">{formatPrice(totalCents)}</span>
          </div>

          <label className="mt-5 flex items-start gap-2.5 text-xs text-muted-foreground">
            <input type="checkbox" className="mt-0.5 size-4 accent-[var(--color-primary)]" {...register("accept_terms")} />
            <span>
              {c.terms1}{" "}
              <a href="/termos" target="_blank" rel="noopener" className="font-semibold text-foreground underline-offset-2 hover:underline">
                {c.termsLink}
              </a>{" "}
              {c.terms2}{" "}
              <a href="/privacidade" target="_blank" rel="noopener" className="font-semibold text-foreground underline-offset-2 hover:underline">
                {c.privacyLink}
              </a>
              {c.terms3}
            </span>
          </label>
          {err("accept_terms") && <p className="mt-1 text-xs text-destructive">{err("accept_terms")}</p>}

          <div className="mt-4">
            <Turnstile onToken={onToken} />
          </div>

          {serverError && (
            <p role="alert" className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {t.common.msg(serverError)}
            </p>
          )}

          <Button type="submit" size="lg" className="mt-5 w-full font-bold" disabled={isSubmitting || !cart.ready}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Lock />}
            {c.submit}
          </Button>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            {c.serverNote}
          </p>
        </aside>
      </form>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="mb-5 flex items-center gap-3 text-lg font-extrabold">
        <span className="grid size-7 place-items-center rounded-full border border-border font-mono text-xs text-primary">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function AddressFields({
  prefix,
  register,
  err,
}: {
  prefix: "shipping_address" | "billing_address";
  register: UseFormRegister<FormValues>;
  err: (path: string) => string | undefined;
}) {
  const id = (f: string) => `${prefix}-${f}`;
  const e = (f: keyof Address) => err(`${prefix}.${f}`);
  const auto = prefix === "shipping_address" ? "shipping" : "billing";
  const t = useT();
  const a = t.shop.checkout.address;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FieldWrap id={id("full_name")} label={a.full_name} error={e("full_name")}>
        <TextInput id={id("full_name")} autoComplete={`${auto} name`} maxLength={120} invalid={!!e("full_name")} {...register(`${prefix}.full_name`)} />
      </FieldWrap>
      <FieldWrap id={id("company_name")} label={a.company_name} optional error={e("company_name")}>
        <TextInput id={id("company_name")} autoComplete={`${auto} organization`} maxLength={160} {...register(`${prefix}.company_name`)} />
      </FieldWrap>
      <FieldWrap id={id("line1")} label={a.line1} className="sm:col-span-2" error={e("line1")}>
        <TextInput id={id("line1")} autoComplete={`${auto} address-line1`} maxLength={200} invalid={!!e("line1")} {...register(`${prefix}.line1`)} />
      </FieldWrap>
      <FieldWrap id={id("line2")} label={a.line2} optional className="sm:col-span-2">
        <TextInput id={id("line2")} autoComplete={`${auto} address-line2`} maxLength={200} {...register(`${prefix}.line2`)} />
      </FieldWrap>
      <FieldWrap id={id("postal_code")} label={a.postal_code} error={e("postal_code")}>
        <TextInput id={id("postal_code")} autoComplete={`${auto} postal-code`} maxLength={10} invalid={!!e("postal_code")} {...register(`${prefix}.postal_code`)} />
      </FieldWrap>
      <FieldWrap id={id("city")} label={a.city} error={e("city")}>
        <TextInput id={id("city")} autoComplete={`${auto} address-level2`} maxLength={100} invalid={!!e("city")} {...register(`${prefix}.city`)} />
      </FieldWrap>
      <FieldWrap id={id("region")} label={a.region} optional>
        <TextInput id={id("region")} autoComplete={`${auto} address-level1`} maxLength={100} {...register(`${prefix}.region`)} />
      </FieldWrap>
      <FieldWrap id={id("country_code")} label={a.country} error={e("country_code")}>
        <SelectInput id={id("country_code")} autoComplete={`${auto} country`} {...register(`${prefix}.country_code`)}>
          <option value="" disabled>
            {a.chooseCountry}
          </option>
          {COUNTRIES.map((c) => ({ code: c.code, name: t.common.country(c.code) }))
            .sort((x, y) => x.name.localeCompare(y.name, t.common.intl))
            .map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
        </SelectInput>
      </FieldWrap>
    </div>
  );
}

