import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, FileUp, Loader2, Upload, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminPageHeader, Panel, td, th } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getLookups, importStockBatch, zeroMissingStock, type ImportResult } from "@/lib/admin";
import { BOM, csvCell } from "@/lib/csv";
import {
  PRESETS,
  buildPlan,
  guessSheetTarget,
  readStockFile,
  type RawSheet,
} from "@/lib/stock-import";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/importar")({
  component: ImportPage,
});

const BATCH = 250;

function downloadTemplate() {
  const rows = [
    ["Marca", "Quantidade", "Referência", "Código", "Preço"],
    ["Opel", "2", "16199550", "DR", ""],
    ["Ford", "3", "97BB-12A650-JB", "DPC-530", "180,00"],
    ["BMW", "1", "0 281016175", "", ""],
  ];
  const csv = rows.map((r) => r.map(csvCell).join(";")).join("\r\n");
  // BOM para o Excel abrir o ficheiro em UTF-8 (acentos corretos)
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "modelo-stock-centralinas.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

function ImportPage() {
  const qc = useQueryClient();
  const lookups = useQuery({ queryKey: ["admin", "lookups"], queryFn: getLookups, staleTime: 5 * 60_000 });
  const [fileName, setFileName] = useState<string | null>(null);
  const [sheets, setSheets] = useState<RawSheet[] | null>(null);
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [publish, setPublish] = useState(true);
  const [zeroMissing, setZeroMissing] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<(ImportResult & { zeroed: number }) | null>(null);
  const [running, setRunning] = useState(false);

  const brandNames = useMemo(
    () => new Map((lookups.data?.brands ?? []).map((b) => [b.slug, b.name])),
    [lookups.data],
  );

  const plan = useMemo(
    () => (sheets ? buildPlan(sheets, targets, brandNames, { active: publish }) : null),
    [sheets, targets, brandNames, publish],
  );
  const undecided = sheets?.filter((s) => !targets[s.name]) ?? [];

  async function onFile(file: File | undefined) {
    setReadError(null);
    setResult(null);
    setSheets(null);
    if (!file) return;
    setReading(true);
    try {
      const read = await readStockFile(file);
      if (!read.some((s) => s.rows.length > 1)) throw new Error("O ficheiro não tem linhas de dados.");
      const slugs = new Set(brandNames.keys());
      setTargets(Object.fromEntries(read.map((s) => [s.name, guessSheetTarget(s.name, slugs)])));
      setSheets(read);
      setFileName(file.name);
    } catch (e) {
      setReadError((e as Error).message);
    } finally {
      setReading(false);
    }
  }

  async function run() {
    if (!plan) return;
    setRunning(true);
    setResult(null);
    const total = plan.items.length;
    const agg: ImportResult & { zeroed: number } = { ok: 0, created: 0, failed: 0, errors: [], zeroed: 0 };
    try {
      for (let i = 0; i < total; i += BATCH) {
        setProgress({ done: i, total });
        const batch = plan.items.slice(i, i + BATCH);
        const res = await importStockBatch(batch.map(({ key: _key, ...row }) => row));
        agg.ok += res.ok;
        agg.created += res.created;
        agg.failed += res.failed;
        agg.errors.push(
          ...res.errors.map((e) => ({ row: e.row + i, error: `${batch[e.row - 1]?.reference ?? ""}: ${e.error}` })),
        );
      }
      setProgress({ done: total, total });
      if (zeroMissing && agg.failed === 0) agg.zeroed = await zeroMissingStock(plan.items.map((x) => x.key));
    } catch (e) {
      agg.errors.push({ row: 0, error: (e as Error).message });
    } finally {
      setResult(agg);
      setRunning(false);
      void qc.invalidateQueries({ queryKey: ["admin"] });
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Importar stock"
        description="Carregue o Excel de stock tal como a equipa o usa: uma folha por marca com Quantidade, Referência e Código."
        actions={
          <Button variant="outline" className="font-bold" onClick={downloadTemplate}>
            <Download /> Modelo CSV
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <Panel>
            <label
              htmlFor="stock-file"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void onFile(e.dataTransfer.files[0]);
              }}
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-10 text-center transition-colors hover:border-primary/50"
            >
              {reading ? (
                <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
              ) : (
                <FileUp className="size-8 text-muted-foreground" aria-hidden />
              )}
              <span className="text-sm font-bold">{fileName ?? "Arraste o Excel (.xlsx) ou clique para escolher"}</span>
              <span className="text-xs text-muted-foreground">Também aceita .csv · até 20 MB</span>
              <input
                id="stock-file"
                type="file"
                accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                className="sr-only"
                disabled={lookups.isLoading}
                onChange={(e) => void onFile(e.target.files?.[0])}
              />
            </label>
          </Panel>

          {readError && (
            <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {readError}
            </p>
          )}

          {sheets && plan && (
            <>
              <Panel title={`Folhas (${sheets.length}) — confirme a marca de cada uma`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className={th}>Folha</th>
                        <th className={th}>Marca(s) no site</th>
                        <th className={`${th} text-right`}>Referências</th>
                        <th className={`${th} text-right`}>Unidades</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sheets.map((s) => {
                        const summary = plan.sheets.find((x) => x.name === s.name);
                        const value = targets[s.name] ?? "";
                        return (
                          <tr key={s.name} className={cn(!value && "bg-warning/5")}>
                            <td className={`${td} font-semibold`}>{s.name}</td>
                            <td className={td}>
                              <select
                                aria-label={`Marca da folha ${s.name}`}
                                value={value}
                                onChange={(e) => setTargets((t) => ({ ...t, [s.name]: e.target.value }))}
                                className={cn(
                                  "h-8 w-full max-w-72 rounded-md border bg-background px-2 text-sm",
                                  value ? "border-input" : "border-warning text-warning",
                                )}
                              >
                                <option value="">— escolher —</option>
                                <optgroup label="Grupos">
                                  {Object.entries(PRESETS).map(([id, p]) => (
                                    <option key={id} value={`preset:${id}`}>
                                      {p.kind === "brands" ? p.label : id}
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="Marcas">
                                  {(lookups.data?.brands ?? []).map((b) => (
                                    <option key={b.slug} value={`brand:${b.slug}`}>
                                      {b.name}
                                    </option>
                                  ))}
                                </optgroup>
                                <option value="ignore">Ignorar esta folha</option>
                              </select>
                            </td>
                            <td className={`${td} text-right font-mono tabular-nums`}>{value === "ignore" ? "—" : summary?.rows ?? 0}</td>
                            <td className={`${td} text-right font-mono tabular-nums`}>{value === "ignore" ? "—" : summary?.units ?? 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <Panel title="Resumo">
                <dl className="grid grid-cols-2 gap-px bg-border text-center sm:grid-cols-4">
                  {[
                    { k: "Peças distintas", v: plan.stats.products },
                    { k: "Unidades", v: plan.stats.units },
                    { k: "Juntadas (repetidas)", v: plan.stats.merged },
                    { k: "Com preço", v: plan.stats.withPrice },
                  ].map((s) => (
                    <div key={s.k} className="bg-surface p-4">
                      <dt className="text-xs text-muted-foreground">{s.k}</dt>
                      <dd className="mt-1 font-mono text-xl font-bold tabular-nums">{s.v}</dd>
                    </div>
                  ))}
                </dl>
                <ul className="space-y-1.5 border-t border-border px-5 py-4 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2 font-semibold text-foreground">
                    <Wand2 className="size-3.5 text-primary" aria-hidden /> Correções automáticas
                  </li>
                  <li>
                    {plan.stats.numericFixed} referências que o Excel tinha convertido em número (ex.: 1.619955E7 →
                    16199550; Bosch sem o “0” inicial)
                  </li>
                  <li>{plan.stats.pairs} referências duplas separadas (ex.: 0 261203650/651)</li>
                  <li>{plan.stats.refFromCode} referências que estavam na coluna “Código”</li>
                  {plan.stats.noQuantity > 0 && <li>{plan.stats.noQuantity} linhas sem quantidade — assumida 1 unidade</li>}
                  <li>
                    Título, endereço, fabricante (Bosch, Marelli, Siemens…), família e tipo de módulo são calculados
                    para cada peça.
                  </li>
                  {plan.stats.withPrice < plan.stats.products && (
                    <li>
                      {plan.stats.products - plan.stats.withPrice} peças sem preço aparecem como “Sob consulta” com botão
                      “Pedir preço”.
                    </li>
                  )}
                  {plan.warnings.slice(0, 10).map((w) => (
                    <li key={w} className="text-warning">
                      {w}
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel title="Pré-visualização">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        {["Referência", "Código", "Marca(s)", "Qtd.", "Preço"].map((h) => (
                          <th key={h} className={th}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {plan.items.slice(0, 15).map((r) => (
                        <tr key={r.key}>
                          <td className={`${td} font-mono font-bold`}>
                            {r.reference}
                            {r.alt_refs.length > 0 && (
                              <span className="ml-1 font-normal text-muted-foreground">/ {r.alt_refs.join(", ")}</span>
                            )}
                          </td>
                          <td className={`${td} font-mono`}>{r.code || "—"}</td>
                          <td className={td}>{r.brands.map((b) => brandNames.get(b) ?? b).join(" · ") || "—"}</td>
                          <td className={`${td} font-mono tabular-nums`}>{r.quantity}</td>
                          <td className={`${td} text-muted-foreground`}>{r.price_eur ? `${r.price_eur} €` : "Sob consulta"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <Panel>
                <div className="space-y-3 p-5">
                  <label className="flex items-center justify-between gap-4">
                    <span>
                      <span className="block text-sm font-bold">Publicar logo as peças novas na loja</span>
                      <span className="block text-xs text-muted-foreground">Peças já existentes mantêm o estado atual</span>
                    </span>
                    <Switch checked={publish} onCheckedChange={setPublish} />
                  </label>
                  <label className="flex items-center justify-between gap-4 border-t border-border pt-3">
                    <span>
                      <span className="block text-sm font-bold">Sincronização total</span>
                      <span className="block text-xs text-muted-foreground">
                        Peças que já não constam neste ficheiro ficam com stock 0 (use com o Excel completo)
                      </span>
                    </span>
                    <Switch checked={zeroMissing} onCheckedChange={setZeroMissing} />
                  </label>
                  {progress && (
                    <div className="border-t border-border pt-3">
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-elevated">
                        <div
                          className="h-full bg-primary transition-[width]"
                          style={{ width: `${Math.round((progress.done / Math.max(progress.total, 1)) * 100)}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
                        {progress.done} / {progress.total}
                      </p>
                    </div>
                  )}
                  <Button
                    className="w-full font-bold"
                    disabled={running || undecided.length > 0 || plan.items.length === 0}
                    onClick={() => void run()}
                  >
                    {running ? <Loader2 className="animate-spin" /> : <Upload />}
                    {undecided.length > 0
                      ? `Escolha a marca de ${undecided.length} folha(s)`
                      : `Importar ${plan.stats.products} peças · ${plan.stats.units} unidades`}
                  </Button>
                </div>
              </Panel>
            </>
          )}

          {result && (
            <Panel
              title={
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-success" /> Importação concluída
                </span>
              }
            >
              <dl className="grid grid-cols-2 gap-px bg-border text-center sm:grid-cols-4">
                {[
                  { k: "Processadas", v: result.ok },
                  { k: "Novas", v: result.created },
                  { k: "Atualizadas", v: result.ok - result.created },
                  { k: "Com erro", v: result.failed },
                ].map((s) => (
                  <div key={s.k} className="bg-surface p-4">
                    <dt className="text-xs text-muted-foreground">{s.k}</dt>
                    <dd
                      className={cn(
                        "mt-1 font-mono text-xl font-bold tabular-nums",
                        s.k === "Com erro" && s.v > 0 && "text-destructive",
                      )}
                    >
                      {s.v}
                    </dd>
                  </div>
                ))}
              </dl>
              {result.zeroed > 0 && (
                <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
                  {result.zeroed} peças que não constavam no ficheiro ficaram com stock 0.
                </p>
              )}
              {result.errors.length > 0 && (
                <ul className="max-h-48 space-y-1 overflow-y-auto border-t border-border px-5 py-3 font-mono text-xs text-destructive">
                  {result.errors.slice(0, 200).map((e, i) => (
                    <li key={i}>{e.error}</li>
                  ))}
                </ul>
              )}
              <div className="border-t border-border px-5 py-3">
                <Link to="/admin/produtos" className="text-sm font-bold text-primary hover:underline">
                  Ver produtos →
                </Link>
              </div>
            </Panel>
          )}
        </div>

        <Panel title="Como funciona" className="h-fit">
          <ul className="space-y-3 p-5 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <FileSpreadsheet className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                <strong className="text-foreground">Use o vosso Excel.</strong> Cada folha é uma marca; colunas
                Quantidade, Referência e Código (opcional: Preço).
              </span>
            </li>
            <li>
              <strong className="text-foreground">Cria ou atualiza.</strong> Cada peça é identificada pela referência
              + código. Importar de novo atualiza as quantidades — não duplica.
            </li>
            <li>
              <strong className="text-foreground">Quantidade = stock atual.</strong> O valor do ficheiro passa a ser o
              stock; a diferença fica registada no histórico.
            </li>
            <li>
              <strong className="text-foreground">Preços</strong> definidos no backoffice não são apagados por um
              ficheiro sem preços.
            </li>
            <li>
              <strong className="text-foreground">Peças repetidas</strong> em várias folhas (ex.: Opel e Daewoo) são
              juntadas numa só, com as duas marcas.
            </li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
