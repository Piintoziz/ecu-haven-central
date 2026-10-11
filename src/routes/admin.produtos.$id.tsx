import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, ImagePlus, Loader2, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { FieldWrap, SelectInput, TextArea, TextInput } from "@/components/site/form-field";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  deleteProductImage,
  getAdminProduct,
  getLookups,
  saveProduct,
  uploadProductImage,
  type AdminProduct,
  type Lookup,
  type ProductForm,
} from "@/lib/admin";
import { useAuth } from "@/lib/auth";
import { conditionLabel } from "@/lib/format";
import { productImageUrl } from "@/lib/supabase";
import type { ProductCondition } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/produtos/$id")({
  component: ProductEditorPage,
});

const UUID_RE = /^[0-9a-f-]{36}$/;

const EMPTY: ProductForm = {
  brand_ids: [],
  reference: "",
  label_code: "",
  other_refs: [],
  quantity: 1,
  price_cents: null,
  condition: "used_tested",
  category_id: "",
  is_active: true,
  description: "",
};

/** "425" / "425,50" / "1.234,50 €" -> cêntimos; vazio -> null (sob consulta) */
function parseEuros(value: string): number | null | "invalid" {
  const v = value.replace(/[€\s]/g, "");
  if (!v) return null;
  const normalized = v.includes(",") ? v.replace(/\./g, "").replace(",", ".") : v;
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : "invalid";
}

function ProductEditorPage() {
  const { id } = Route.useParams();
  const isNew = id === "novo";
  const lookups = useQuery({ queryKey: ["admin", "lookups"], queryFn: getLookups, staleTime: 5 * 60_000 });
  const product = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => getAdminProduct(id),
    enabled: !isNew && UUID_RE.test(id),
  });

  if (!isNew && !UUID_RE.test(id)) return <p className="text-sm text-muted-foreground">Produto não encontrado.</p>;
  if (lookups.isLoading || (!isNew && product.isLoading)) return <div className="skeleton h-[60vh] rounded-xl" />;
  if (lookups.error || product.error)
    return <p className="text-sm text-destructive">{((lookups.error ?? product.error) as Error).message}</p>;
  if (!isNew && !product.data) return <p className="text-sm text-muted-foreground">Produto não encontrado.</p>;

  return <ProductEditor key={product.data?.id ?? "novo"} initial={product.data ?? null} lookups={lookups.data!} />;
}

function ProductEditor({
  initial,
  lookups,
}: {
  initial: AdminProduct | null;
  lookups: { brands: Lookup[]; categories: Lookup[] };
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState<ProductForm>(() => (initial ? { ...EMPTY, ...initial } : EMPTY));
  const [price, setPrice] = useState(() =>
    initial?.price_cents != null ? (initial.price_cents / 100).toFixed(2).replace(".", ",") : "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: async () => {
      const next: Record<string, string> = {};
      const cents = parseEuros(price);
      if (!form.reference.trim()) next.reference = "Indique a referência da etiqueta";
      if (cents === "invalid") next.price = "Preço inválido";
      if (!Number.isInteger(form.quantity) || form.quantity < 0) next.quantity = "Quantidade inválida";
      setErrors(next);
      if (Object.keys(next).length) throw new Error("Corrija os campos assinalados.");
      return saveProduct({
        existing: initial,
        form: { ...form, price_cents: cents as number | null },
        actorId: user!.id,
      });
    },
    onSuccess: (productId) => {
      toast.success(initial ? "Peça guardada" : "Peça criada");
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
      void qc.invalidateQueries({ queryKey: ["admin", "product", productId] });
      void qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      if (!initial) void navigate({ to: "/admin/produtos/$id", params: { id: productId }, replace: true });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      noValidate
      className="mx-auto max-w-3xl pb-24"
    >
      <Link
        to="/admin/produtos"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Produtos & stock
      </Link>
      <AdminPageHeader
        title={
          initial ? (
            <span className="font-mono">
              {initial.reference}
              {initial.label_code && <span className="ml-2 text-muted-foreground">{initial.label_code}</span>}
            </span>
          ) : (
            "Nova peça"
          )
        }
        description={initial ? undefined : "Preencha como no Excel: marca, referência, código e quantidade."}
        actions={
          initial?.is_active ? (
            <Button asChild variant="outline" size="sm" className="font-bold">
              <a href={`/centralinas/${initial.slug}`} target="_blank" rel="noopener">
                Ver na loja <ExternalLink />
              </a>
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-4">
        <Panel title="Peça">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <BrandPicker brands={lookups.brands} value={form.brand_ids} onChange={(v) => set("brand_ids", v)} />
            </div>
            <FieldWrap id="reference" label="Referência" error={errors.reference} hint="Como está na etiqueta (ex.: 0 281 016 000)">
              <TextInput
                id="reference"
                value={form.reference}
                onChange={(e) => set("reference", e.target.value)}
                maxLength={64}
                className="font-mono"
                invalid={!!errors.reference}
                autoFocus={!initial}
              />
            </FieldWrap>
            <FieldWrap id="label_code" label="Código" optional hint="Ex.: DR, DPC-530 — distingue peças com a mesma referência">
              <TextInput
                id="label_code"
                value={form.label_code}
                onChange={(e) => set("label_code", e.target.value)}
                maxLength={40}
                className="font-mono"
              />
            </FieldWrap>
            <div className="sm:col-span-2">
              <OtherRefs value={form.other_refs} onChange={(v) => set("other_refs", v)} />
            </div>
          </div>
        </Panel>

        <Panel title="Stock e preço">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <FieldWrap id="quantity" label="Quantidade em stock" error={errors.quantity}>
              <TextInput
                id="quantity"
                type="number"
                min={0}
                max={100000}
                value={form.quantity}
                onChange={(e) => set("quantity", Math.max(0, Math.trunc(Number(e.target.value) || 0)))}
                invalid={!!errors.quantity}
              />
            </FieldWrap>
            <FieldWrap id="price" label="Preço com IVA" optional error={errors.price} hint="Vazio = “Sob consulta” na loja">
              <div className="relative">
                <TextInput
                  id="price"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pr-8 font-mono"
                  placeholder="Sob consulta"
                  invalid={!!errors.price}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
              </div>
            </FieldWrap>
            <FieldWrap id="condition" label="Estado">
              <SelectInput
                id="condition"
                value={form.condition}
                onChange={(e) => set("condition", e.target.value as ProductCondition)}
              >
                {(Object.keys(conditionLabel) as ProductCondition[]).map((c) => (
                  <option key={c} value={c}>
                    {conditionLabel[c]}
                  </option>
                ))}
              </SelectInput>
            </FieldWrap>
            <FieldWrap id="category" label="Tipo de módulo">
              <SelectInput id="category" value={form.category_id} onChange={(e) => set("category_id", e.target.value)}>
                <option value="">Automático (pela referência)</option>
                {lookups.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectInput>
            </FieldWrap>
            <label className="flex items-center justify-between gap-3 rounded-md border border-border p-3 sm:col-span-2">
              <span>
                <span className="block text-sm font-bold">Publicada na loja</span>
                <span className="block text-xs text-muted-foreground">Visível no catálogo, na pesquisa e no Google</span>
              </span>
              <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
            </label>
          </div>
        </Panel>

        {initial ? (
          <ImagesPanel product={initial} />
        ) : (
          <Panel title="Fotografias">
            <p className="p-5 text-sm text-muted-foreground">Guarde a peça para poder carregar fotografias.</p>
          </Panel>
        )}

        <Panel title="Notas para o cliente">
          <div className="p-5">
            <TextArea
              id="description"
              aria-label="Notas para o cliente"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Opcional — ex.: testada em bancada, sem crash data, precisa de codificação ao imobilizador."
              className="min-h-0"
            />
          </div>
        </Panel>

        {initial && <AutoFields product={initial} />}
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:left-[232px]"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-end gap-2">
          <Button type="submit" className="font-bold" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="animate-spin" /> : <Save />}
            {initial ? "Guardar" : "Criar peça"}
          </Button>
        </div>
      </div>
    </form>
  );
}

/** Campos calculados automaticamente — só para consulta. */
function AutoFields({ product }: { product: AdminProduct }) {
  const rows: [string, string][] = [
    ["Título na loja", product.title],
    ["Endereço", `/centralinas/${product.slug}`],
    ["Fabricante da centralina", product.manufacturer?.name ?? "— (referência do construtor)"],
    ["Família", product.ecu_family ?? "—"],
  ];
  return (
    <section className="rounded-xl border border-dashed border-border p-5">
      <p className="mb-3 flex items-center gap-2 text-xs font-bold text-muted-foreground">
        <Sparkles className="size-3.5 text-primary" aria-hidden /> Preenchido automaticamente a partir da referência
      </p>
      <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[180px_1fr]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="min-w-0 break-words font-mono text-xs leading-5">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function BrandPicker({
  brands,
  value,
  onChange,
}: {
  brands: Lookup[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const selected = useMemo(() => new Set(value), [value]);
  const byId = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);
  return (
    <FieldWrap id="brand-add" label="Marca(s) do veículo" hint="Pode juntar várias — ex.: Peugeot e Citroën, ou VW, Audi, Seat e Skoda">
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background p-1.5">
        {value.map((id) => (
          <span
            key={id}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-0.5 pl-2.5 pr-1 text-xs font-semibold text-primary"
          >
            {byId.get(id)?.name ?? "?"}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== id))}
              className="rounded-full p-0.5 hover:bg-primary/20"
              aria-label={`Remover ${byId.get(id)?.name ?? "marca"}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <select
          id="brand-add"
          value=""
          onChange={(e) => e.target.value && onChange([...value, e.target.value])}
          className="h-7 min-w-36 flex-1 bg-transparent px-1 text-sm text-muted-foreground focus:outline-none"
        >
          <option value="">{value.length ? "+ outra marca" : "Escolher marca…"}</option>
          {brands
            .filter((b) => !selected.has(b.id))
            .map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
        </select>
      </div>
    </FieldWrap>
  );
}

function OtherRefs({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft("");
  };
  return (
    <FieldWrap id="other-ref" label="Outras referências" optional hint="Números alternativos da mesma peça (ex.: OEM da marca). Ajudam a encontrá-la na pesquisa.">
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background p-1.5">
        {value.map((r) => (
          <span key={r} className="inline-flex items-center gap-1 rounded bg-surface-elevated py-0.5 pl-2 pr-1 font-mono text-xs">
            {r}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== r))}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              aria-label={`Remover ${r}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id="other-ref"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          maxLength={64}
          placeholder={value.length ? "" : "Escreva e carregue Enter"}
          className="h-7 min-w-40 flex-1 bg-transparent px-1 font-mono text-sm focus:outline-none"
        />
        {draft && (
          <button type="button" onClick={add} className="rounded p-1 text-primary" aria-label="Adicionar referência">
            <Plus className="size-4" />
          </button>
        )}
      </div>
    </FieldWrap>
  );
}

function ImagesPanel({ product }: { product: AdminProduct }) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "product", product.id] });

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    let position = product.images.length;
    try {
      for (const file of Array.from(files).slice(0, 10)) {
        await uploadProductImage(product.id, file, position++, product.title);
      }
      toast.success("Fotografias carregadas");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
      void refresh();
    }
  }

  const remove = useMutation({
    mutationFn: deleteProductImage,
    onSuccess: () => {
      toast.success("Fotografia removida");
      void refresh();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Panel
      title={`Fotografias (${product.images.length})`}
      actions={
        <>
          <input
            ref={input}
            type="file"
            accept="image/webp,image/jpeg,image/png"
            multiple
            className="sr-only"
            id="image-upload"
            onChange={(e) => void onFiles(e.target.files)}
          />
          <Button type="button" size="sm" variant="outline" className="font-bold" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            Carregar
          </Button>
        </>
      }
    >
      <div className="p-5">
        {product.images.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sem fotografias — a loja mostra uma ilustração com a referência. A primeira foto é a capa; de preferência
            com a etiqueta legível.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {product.images.map((img, i) => (
              <li
                key={img.id}
                className={cn(
                  "group relative overflow-hidden rounded-lg border bg-surface-elevated",
                  i === 0 ? "border-primary/60" : "border-border",
                )}
              >
                <img
                  src={productImageUrl(img.storage_path) ?? ""}
                  alt={img.alt ?? ""}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={() => remove.mutate(img)}
                  disabled={remove.isPending}
                  className="absolute right-1.5 top-1.5 rounded-md bg-background/90 p-1.5 text-destructive opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  aria-label="Remover fotografia"
                >
                  <Trash2 className="size-4" />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    CAPA
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
