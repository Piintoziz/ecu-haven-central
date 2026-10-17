import { useMutation } from "@tanstack/react-query";
import { ExternalLink, Loader2, Printer, RefreshCw, Trash2, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FieldWrap, TextInput } from "@/components/site/form-field";
import { Button } from "@/components/ui/button";
import type { AdminOrder } from "@/lib/admin";
import { useAuth } from "@/lib/auth";
import { WAREHOUSE } from "@/lib/content";
import {
  packlinkCancelDraft,
  packlinkCreateShipment,
  packlinkLabel,
  packlinkSyncShipment,
} from "@/lib/shipping.functions";

const PACKLINK_PANEL_URL = "https://pro.packlink.pt/private/shipments";

/** Estados Packlink em linguagem da equipa. */
const STATE_LABEL: Record<string, { label: string; hint?: string }> = {
  AWAITING_COMPLETION: { label: "Rascunho incompleto", hint: "Abra na Packlink e complete os dados em falta." },
  READY_TO_PURCHASE: { label: "Pronto a pagar", hint: "Pague o envio no painel Packlink para gerar a etiqueta." },
  READY_TO_PRINT: { label: "Pago · etiqueta pronta", hint: "Imprima a etiqueta e cole na caixa." },
  READY_FOR_COLLECTION: { label: "A aguardar recolha" },
  IN_TRANSIT: { label: "Em trânsito" },
  OUT_FOR_DELIVERY: { label: "Em distribuição" },
  DELIVERED: { label: "Entregue" },
  INCIDENT: { label: "Incidência", hint: "Veja o detalhe no painel Packlink." },
  RETURNED_TO_SENDER: { label: "Devolvido ao remetente" },
  CANCELED: { label: "Cancelado" },
};

export function PacklinkPanel({ order, onChanged }: { order: AdminOrder; onChanged: () => void }) {
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const defaultWeight = Math.max(
    WAREHOUSE.default_parcel.weight_g,
    order.order_items.reduce((g, i) => g + (i.product?.weight_grams ?? WAREHOUSE.default_parcel.weight_g) * i.quantity, 0),
  );
  const [weight, setWeight] = useState(String(defaultWeight / 1000));
  const [dims, setDims] = useState({
    length: String(WAREHOUSE.default_parcel.length_cm),
    width: String(WAREHOUSE.default_parcel.width_cm),
    height: String(WAREHOUSE.default_parcel.height_cm),
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await packlinkCreateShipment({
        data: {
          access_token: token,
          order_id: order.id,
          weight_g: Math.round(Number(weight.replace(",", ".")) * 1000),
          length_cm: Math.round(Number(dims.length)),
          width_cm: Math.round(Number(dims.width)),
          height_cm: Math.round(Number(dims.height)),
        },
      });
      if (!res.ok) throw new Error(res.error);
      return res;
    },
    onSuccess: (r) => {
      if (r.substituted_from) {
        toast.warning(
          `${r.substituted_from} não está disponível na Packlink para este destino. Envio criado com ${r.service} (${r.reference}). Confirme o serviço no painel Packlink antes de pagar.`,
          { duration: 12000 },
        );
      } else {
        toast.success(`Envio criado na Packlink (${r.reference}) · ${r.service}. Falta pagar no painel Packlink.`);
      }
      onChanged();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const sync = useMutation({
    mutationFn: async () => {
      const res = await packlinkSyncShipment({ data: { access_token: token, order_id: order.id } });
      if (!res.ok) throw new Error(res.error);
      return res;
    },
    onSuccess: (r) => {
      toast.success(r.tracking ? `Tracking ${r.tracking} · cliente notificado` : `Estado: ${STATE_LABEL[r.state]?.label ?? r.state}`);
      onChanged();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const label = useMutation({
    mutationFn: async () => {
      const res = await packlinkLabel({ data: { access_token: token, order_id: order.id } });
      if (!res.ok) throw new Error(res.error);
      return res.urls;
    },
    onSuccess: (urls) => {
      for (const u of urls) window.open(u, "_blank", "noopener");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const cancel = useMutation({
    mutationFn: async () => {
      const res = await packlinkCancelDraft({ data: { access_token: token, order_id: order.id } });
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success("Rascunho apagado na Packlink.");
      onChanged();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const canCreate = ["paid", "processing"].includes(order.status);

  if (!order.packlink_reference) {
    if (!canCreate) return null;
    // Tarifa fixa (país sem serviço Packlink): o envio é tratado fora da Packlink.
    if (order.shipping_rate?.carrier === "Envio internacional") {
      return (
        <p className="border-b border-border px-5 py-4 text-sm text-muted-foreground">
          Destino sem serviço Packlink (portes fixos cobrados ao cliente). Envie por outra transportadora
          (ex.: CTT, DHL, FedEx) e use <b className="text-foreground">Registar envio manual</b> com o nº de
          tracking — o cliente é notificado.
        </p>
      );
    }
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="space-y-4 border-b border-border p-5"
      >
        <div>
          <p className="text-sm font-bold">Criar envio na Packlink</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {order.shipping_rate?.carrier ?? "Transportadora do checkout"} · recolha no armazém ({WAREHOUSE.city}),
            janela da manhã, preferência {WAREHOUSE.pickup_time}.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <FieldWrap id="pl-weight" label="Peso (kg)">
            <TextInput id="pl-weight" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </FieldWrap>
          {(["length", "width", "height"] as const).map((k) => (
            <FieldWrap key={k} id={`pl-${k}`} label={{ length: "Comp. (cm)", width: "Larg. (cm)", height: "Alt. (cm)" }[k]}>
              <TextInput
                id={`pl-${k}`}
                inputMode="numeric"
                value={dims[k]}
                onChange={(e) => setDims((d) => ({ ...d, [k]: e.target.value }))}
              />
            </FieldWrap>
          ))}
        </div>
        <Button type="submit" className="font-bold" disabled={create.isPending || !token}>
          {create.isPending ? <Loader2 className="animate-spin" /> : <Truck />}
          Criar envio na Packlink
        </Button>
      </form>
    );
  }

  const state = order.packlink_state ?? "";
  const info = STATE_LABEL[state];
  const paid = !["AWAITING_COMPLETION", "READY_TO_PURCHASE", ""].includes(state);
  return (
    <div className="space-y-3 border-b border-border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold">
            Packlink · <span className="font-mono">{order.packlink_reference}</span>
          </p>
          <p className="mt-0.5 text-sm">
            {info?.label ?? state}
            {order.packlink_collection_date &&
              ` · recolha ${new Date(order.packlink_collection_date).toLocaleDateString("pt-PT")} (${WAREHOUSE.pickup_time})`}
          </p>
          {info?.hint && <p className="mt-0.5 text-xs text-muted-foreground">{info.hint}</p>}
        </div>
        <a
          href={PACKLINK_PANEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          Abrir painel Packlink <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="font-bold" disabled={sync.isPending} onClick={() => sync.mutate()}>
          {sync.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />} Atualizar estado
        </Button>
        <Button size="sm" className="font-bold" disabled={!paid || label.isPending} onClick={() => label.mutate()}>
          {label.isPending ? <Loader2 className="animate-spin" /> : <Printer />} Imprimir etiqueta
        </Button>
        {!paid && (
          <Button
            size="sm"
            variant="ghost"
            className="font-bold text-destructive hover:text-destructive"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate()}
          >
            <Trash2 /> Apagar rascunho
          </Button>
        )}
      </div>
    </div>
  );
}
