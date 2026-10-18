import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  AlertTriangle,
  BadgeCheck,
  MessageSquare,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { AddToCartButton } from "@/components/site/add-to-cart";
import { EcuIllustration } from "@/components/site/ecu-illustration";
import { ProductCard } from "@/components/site/product-card";
import { StockBadge } from "@/components/site/stock-badge";
import { getProduct } from "@/lib/catalog";
import { SITE_NAME } from "@/lib/env";
import { primaryReference } from "@/lib/format";
import { getDict, headI18n, useT, type Dict } from "@/lib/i18n";
import { absoluteUrl, breadcrumbLd, jsonLdScript, pageHead } from "@/lib/seo";
import { productImageUrl } from "@/lib/supabase";
import type { ProductCondition, ProductDetail, ReferenceType } from "@/lib/types";

export const Route = createFileRoute("/centralinas/$slug")({
  loader: async ({ params }) => {
    const product = await getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData, match }) => {
    if (!loaderData) return {};
    const { locale, t } = headI18n(match);
    const k = t.shop.product;
    const p = loaderData.product;
    const ref = primaryReference(p);
    const path = `/centralinas/${p.slug}`;
    const image = productImageUrl(p.images[0]?.path ?? p.image);
    // Título e descrição para o Google gerados a partir dos dados da peça (campos
    // seo_* só se alguém os preencher manualmente na base de dados).
    const who = p.manufacturer?.name ?? p.brands[0] ?? "";
    const title =
      p.seo_title ??
      `${ref}${p.label_code ? ` ${p.label_code}` : ""} ${who} ${p.ecu_family ?? ""} — ${p.category ? t.common.category(p.category.slug, p.category.name) : t.shop.card.ecu}`.replace(
        /\s+/g,
        " ",
      );
    const price =
      p.price_cents == null ? k.priceOnRequestMeta : k.priceWithVat(t.common.price(p.price_cents));
    const description =
      p.seo_description ??
      `${t.common.productTitle(p)}. ${t.common.condition[p.condition]}, ${k.tested}. ${price}. ${p.brands.length ? k.fitsIn(p.brands.join(", ")) : ""}${k.shipsTo}`.trim();
    const head = pageHead({
      title,
      description: description.slice(0, 165),
      path,
      type: "product",
      image,
      locale,
    });
    return {
      ...head,
      scripts: [jsonLdScript(productLd(p, path, image, t)), jsonLdScript(breadcrumbLd(crumbs(p, t)))],
    };
  },
  notFoundComponent: () => <ProductNotFound />,
  component: ProductPage,
});

function ProductNotFound() {
  const k = useT().shop.product;
  return (
    <div className="container-page py-24 text-center">
      <p className="mono-label mb-3 text-primary">{k.notFoundLabel}</p>
      <h1 className="text-3xl font-extrabold">{k.notFoundTitle}</h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">{k.notFoundText}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          to="/catalogo"
          className="rounded-md border border-border px-4 py-2 text-sm font-bold hover:bg-accent"
        >
          {k.searchCatalog}
        </Link>
        <Link
          to="/contactos"
          className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          {k.askRef}
        </Link>
      </div>
    </div>
  );
}

const schemaCondition: Record<ProductCondition, string> = {
  new: "https://schema.org/NewCondition",
  used_tested: "https://schema.org/UsedCondition",
  reconditioned: "https://schema.org/RefurbishedCondition",
};

function crumbs(p: ProductDetail, t: Dict) {
  return [
    { name: t.shop.product.home, path: "/" },
    { name: t.shop.product.catalog, path: "/catalogo" },
    ...(p.category
      ? [{ name: t.common.category(p.category.slug, p.category.name), path: `/catalogo?categoria=${p.category.slug}` }]
      : []),
    { name: primaryReference(p), path: `/centralinas/${p.slug}` },
  ];
}

function productLd(p: ProductDetail, path: string, image: string | null, t: Dict = getDict("pt")) {
  const ref = primaryReference(p);
  const refTypeLabel: Record<ReferenceType, string> = t.shop.product.refTypes;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: t.common.productTitle(p),
    sku: ref,
    mpn: ref,
    description: p.description ?? t.common.productTitle(p),
    category: p.category ? t.common.category(p.category.slug, p.category.name) : undefined,
    ...(p.manufacturer ? { brand: { "@type": "Brand", name: p.manufacturer.name } } : {}),
    ...(image ? { image: [image] } : {}),
    additionalProperty: p.references.map((r) => ({
      "@type": "PropertyValue",
      name: refTypeLabel[r.type],
      value: r.value,
    })),
    isAccessoryOrSparePartFor: p.compatibility.length
      ? p.compatibility.slice(0, 20).map((c) => ({
          "@type": "Vehicle",
          name: `${c.brand} ${c.model}${c.engine ? ` ${c.engine}` : ""}`,
          brand: { "@type": "Brand", name: c.brand },
        }))
      : p.brands.map((b) => ({
          "@type": "Vehicle",
          brand: { "@type": "Brand", name: b },
          name: b,
        })),
    // Oferta só com preço publicado (o Google rejeita Offer sem preço).
    ...(p.price_cents != null
      ? {
          offers: {
            "@type": "Offer",
            url: absoluteUrl(path),
            priceCurrency: "EUR",
            price: (p.price_cents / 100).toFixed(2),
            availability:
              p.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            itemCondition: schemaCondition[p.condition],
            priceSpecification: {
              "@type": "PriceSpecification",
              price: (p.price_cents / 100).toFixed(2),
              priceCurrency: "EUR",
              valueAddedTaxIncluded: false,
            },
            seller: { "@type": "Organization", name: SITE_NAME },
          },
        }
      : {}),
  };
}

function ProductPage() {
  const { product: p } = Route.useLoaderData();
  const ref = primaryReference(p);
  const maxQty = Math.max(1, Math.min(10, p.stock_quantity));
  const [qty, setQty] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const images = p.images
    .map((i) => ({ url: productImageUrl(i.path), alt: i.alt }))
    .filter((i) => i.url);
  const current = images[imageIndex];
  const t = useT();
  const k = t.shop.product;
  const title = t.common.productTitle(p);

  return (
    <div className="container-page py-8 md:py-10">
      <nav aria-label={t.shop.catalog.breadcrumb} className="mb-6 text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          {crumbs(p, t).map((c, i, arr) => (
            <li key={c.path} className="flex items-center gap-2">
              {i < arr.length - 1 ? (
                <a href={c.path} className="hover:text-foreground">
                  {c.name}
                </a>
              ) : (
                <span aria-current="page" className="font-mono text-foreground">
                  {c.name}
                </span>
              )}
              {i < arr.length - 1 && <span aria-hidden>/</span>}
            </li>
          ))}
        </ol>
      </nav>

      <div data-product className="grid gap-10 *:min-w-0 lg:grid-cols-[1fr_420px]">
        {/* Imagem */}
        <div>
          <div className="rounded-xl border border-border bg-surface p-6 md:p-10">
            {current?.url ? (
              <img
                src={current.url}
                alt={current.alt ?? title}
                className="mx-auto max-h-[460px] w-full object-contain"
                fetchPriority="high"
              />
            ) : (
              <EcuIllustration
                reference={ref}
                manufacturer={p.manufacturer?.name}
                family={p.ecu_family}
                code={p.category?.short_code}
                className="mx-auto max-w-xl"
              />
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => setImageIndex(i)}
                  aria-label={k.image(i + 1)}
                  aria-pressed={i === imageIndex}
                  className={`size-16 overflow-hidden rounded-md border ${i === imageIndex ? "border-primary" : "border-border"}`}
                >
                  <img
                    src={img.url!}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
          {images.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {k.illustrationNote}
            </p>
          )}
        </div>

        {/* Compra */}
        <aside className="lg:sticky lg:top-28 self-start">
          <p className="mono-label">
            {p.manufacturer?.name}
            {p.ecu_family ? ` · ${p.ecu_family}` : ""}
            {p.category ? ` · ${p.category.short_code ?? t.common.category(p.category.slug, p.category.name)}` : ""}
          </p>
          <h1 className="mt-2 font-mono text-3xl font-bold tracking-tight md:text-4xl">
            {ref}
            {p.label_code && (
              <span className="ml-3 align-middle text-lg font-semibold text-muted-foreground">
                {k.code} {p.label_code}
              </span>
            )}
          </h1>
          <p className="mt-2 text-base text-foreground/85">{title}</p>

          <div className="mt-6 rounded-xl border border-border bg-surface p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-3xl font-extrabold tabular-nums">
                  {t.common.priceLabel(p.price_cents)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.price_cents == null
                    ? k.priceOnRequestNote
                    : k.priceNote}
                </p>
              </div>
              <StockBadge quantity={p.stock_quantity} />
            </div>

            <div className="mt-5 flex items-center gap-3">
              {p.price_cents != null && (
                <div
                  className="flex h-10 items-center rounded-md border border-border"
                  role="group"
                  aria-label={k.quantity}
                >
                  <button
                    type="button"
                    className="grid h-full w-9 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1 || p.stock_quantity <= 0}
                    aria-label={k.decrease}
                  >
                    <Minus className="size-4" />
                  </button>
                  <output
                    className="w-8 text-center font-mono text-sm tabular-nums"
                    aria-live="polite"
                  >
                    {qty}
                  </output>
                  <button
                    type="button"
                    className="grid h-full w-9 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    disabled={qty >= maxQty || p.stock_quantity <= 0}
                    aria-label={k.increase}
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              )}
              <AddToCartButton
                product={p}
                quantity={qty}
                size="lg"
                className="h-10 min-w-0 flex-1 px-4"
                label={t.shop.addToCart.addLong}
              />
            </div>

            <Link
              to="/contactos"
              search={{ ref }}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border py-2.5 text-sm font-semibold hover:bg-accent"
            >
              <MessageSquare className="size-4" aria-hidden /> {k.askTech}
            </Link>
          </div>

          <ul className="mt-5 space-y-2.5 text-sm">
            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                <b>{k.warranty(p.warranty_months)}</b> ·{" "}
                {t.common.condition[p.condition].toLowerCase()}
              </span>
            </li>
            <li className="flex gap-3">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>{k.benchTested}</span>
            </li>
            <li className="flex gap-3">
              <Truck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>{k.shipping}</span>
            </li>
          </ul>
        </aside>
      </div>

      {/* Especificações + compatibilidade */}
      <div className="mt-16 grid gap-12 *:min-w-0 lg:grid-cols-[1fr_1.4fr]">
        <section aria-labelledby="specs">
          <h2 id="specs" className="text-xl font-extrabold">
            {k.specs}
          </h2>
          <dl className="mt-4 divide-y divide-border rounded-xl border border-border text-sm">
            <Spec label={k.manufacturer}>{p.manufacturer?.name ?? "—"}</Spec>
            <Spec label={k.family}>{p.ecu_family ?? "—"}</Spec>
            <Spec label={k.system}>{p.category ? t.common.category(p.category.slug, p.category.name) : "—"}</Spec>
            <Spec label={k.condition}>{t.common.condition[p.condition]}</Spec>
            <Spec label={k.warrantyLabel}>{k.months(p.warranty_months)}</Spec>
            <Spec label={k.weight}>{(p.weight_grams / 1000).toLocaleString(t.common.intl)} kg</Spec>
            {p.references.map((r) => (
              <Spec key={`${r.type}-${r.value}`} label={k.refTypes[r.type]}>
                <span className="font-mono">{r.value}</span>
              </Spec>
            ))}
          </dl>
          {p.description && (
            <div className="mt-6 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {p.description}
            </div>
          )}
        </section>

        <section aria-labelledby="compat">
          <h2 id="compat" className="text-xl font-extrabold">
            {k.compat}
          </h2>
          {p.compatibility.length > 0 ? (
            <div className="mt-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-surface text-xs text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-semibold">
                      {k.cols.brand}
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">
                      {k.cols.model}
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">
                      {k.cols.engine}
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">
                      {k.cols.code}
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">
                      {k.cols.years}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {p.compatibility.map((c, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5">
                        <Link
                          to="/catalogo"
                          search={{ marca: c.brand_slug }}
                          className="hover:text-primary"
                        >
                          {c.brand}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        {c.model}
                        {c.generation ? ` ${c.generation}` : ""}
                      </td>
                      <td className="px-4 py-2.5">{c.engine ?? "—"}</td>
                      <td className="px-4 py-2.5 font-mono">{c.engine_code ?? "—"}</td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {t.common.years(c.year_from, c.year_to)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              {k.compatByRef}
            </p>
          )}

          <div className="mt-6 rounded-xl border border-warning/30 bg-warning/5 p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <AlertTriangle className="size-4 text-warning" aria-hidden /> {k.before}
            </h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              <li>
                {k.before1}{" "}
                <span className="font-mono text-foreground">{ref}</span>.
              </li>
              <li>{k.before2}</li>
              <li>
                {k.before3}{" "}
                <Link to="/servicos" className="text-primary underline-offset-4 hover:underline">
                  {k.cloning}
                </Link>{" "}
                {k.before3b}
              </li>
            </ul>
          </div>
        </section>
      </div>

      {p.related.length > 0 && (
        <section aria-labelledby="related" className="mt-16">
          <h2 id="related" className="text-xl font-extrabold">
            {k.related}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {p.related.map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Spec({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)] gap-3 px-4 py-2.5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words text-foreground">{children}</dd>
    </div>
  );
}
