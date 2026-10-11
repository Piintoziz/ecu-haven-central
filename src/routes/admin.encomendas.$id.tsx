import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Ban,
  CircleDollarSign,
  ExternalLink,
  Loader2,
  Plus,
  Truck,
  UserRound,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { AddressBlock } from "@/components/site/address-block";
import { FieldWrap, SelectInput, TextInput } from "@/components/site/form-field";
import { OrderStatusPill } from "@/components/site/order-status-pill";
import { Button } from "@/components/ui/button";
import {
  addShipmentEvent,
  createShipment,
  getOrder,
  updateOrderStatus,
  type AdminOrder,
  type AdminShipment,
  type PaymentStatus,
  type ShipmentStatus,
} from "@/lib/admin";
import { flushEmailQueue } from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth";
import { CARRIERS, buildTrackingUrl } from "@/lib/carriers";
import {
  conditionLabel,
  formatPrice,
  orderStatusLabel,
  serviceLevelLabel,
  shipmentStatusLabel,
} from "@/lib/format";
import type { OrderStatus, ServiceLevel } from "@/lib/types";

export const Route = createFileRoute("/admin/encomendas/$id")({
  component: AdminOrderPage,
});

const ORDER_STATUSES: OrderStatus[] = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "refunded",
  "cancelled",
];
const PAYMENT_STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: "pending", label: "Pendente" },
  { value: "authorized", label: "Autorizado" },
  { value: "captured", label: "Recebido" },
  { value: "failed", label: "Falhou" },
  { value: "refunded", label: "Reembolsado" },
];
const SHIPMENT_STATUSES: ShipmentStatus[] = [
  "label_created",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
  "returned",
];

function AdminOrderPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { session } = useAuth();
  const order = useQuery({ queryKey: ["admin", "order", id], queryFn: () => getOrder(id) });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "order", id] });
    void qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    void qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    // Os triggers enfileiraram o email ao cliente; envia já (o cron cobre falhas).
    if (session)
      void flushEmailQueue({ data: { access_token: session.access_token } }).catch(() => undefined);
  };

  if (order.isLoading) return <div className="skeleton h-96 rounded-xl" />;
  if (order.error)
    return <p className="text-sm text-destructive">{(order.error as Error).message}</p>;
  if (!order.data)
    return <p className="text-sm text-muted-foreground">Encomenda não encontrada.</p>;
  const o = order.data;

  return (
    <>
      <Link
        to="/admin/encomendas"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Encomendas
      </Link>
      <AdminPageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{o.order_code}</span>
            <OrderStatusPill status={o.status} className="text-xs" />
          </span>
        }
        description={`Criada a ${new Date(o.created_at).toLocaleString("pt-PT", { dateStyle: "long", timeStyle: "short" })}`}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <StatusPanel order={o} onChanged={refresh} />
          <ItemsPanel order={o} />
          <ShipmentsPanel order={o} onChanged={refresh} />
        </div>
        <CustomerPanel order={o} />
      </div>
    </>
  );
}

function StatusPanel({ order, onChanged }: { order: AdminOrder; onChanged: () => void }) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [payment, setPayment] = useState<PaymentStatus>(order.payment_status);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const cancelled = order.status === "cancelled";

  const save = useMutation({
    mutationFn: (patch: { status?: OrderStatus; payment_status?: PaymentStatus }) =>
      updateOrderStatus(order.id, patch),
    onSuccess: () => {
      toast.success("Encomenda atualizada · cliente notificado por email");
      setConfirmCancel(false);
      onChanged();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const dirty = status !== order.status || payment !== order.payment_status;

  return (
    <Panel title="Estado e pagamento">
      <div className="space-y-4 p-5">
        {order.status === "pending_payment" && order.payment_status !== "captured" && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
            <span>
              A aguardar transferência de{" "}
              <strong className="font-mono">{formatPrice(order.total_cents)}</strong> com a
              referência <strong className="font-mono">{order.order_code}</strong>.
            </span>
            <Button
              size="sm"
              className="font-bold"
              disabled={save.isPending}
              onClick={() => save.mutate({ payment_status: "captured" })}
            >
              <CircleDollarSign /> Confirmar pagamento
            </Button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <FieldWrap id="order-status" label="Estado da encomenda">
            <SelectInput
              id="order-status"
              value={status}
              disabled={cancelled}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
            >
              {ORDER_STATUSES.filter((s) => s !== "cancelled" || cancelled).map((s) => (
                <option key={s} value={s}>
                  {orderStatusLabel[s]}
                </option>
              ))}
            </SelectInput>
          </FieldWrap>
          <FieldWrap id="payment-status" label="Pagamento">
            <SelectInput
              id="payment-status"
              value={payment}
              disabled={cancelled}
              onChange={(e) => setPayment(e.target.value as PaymentStatus)}
            >
              {PAYMENT_STATUSES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </SelectInput>
          </FieldWrap>
          <Button
            className="font-bold"
            disabled={!dirty || save.isPending || cancelled}
            onClick={() =>
              save.mutate({
                ...(status !== order.status ? { status } : {}),
                ...(payment !== order.payment_status ? { payment_status: payment } : {}),
              })
            }
          >
            {save.isPending && <Loader2 className="animate-spin" />}
            Guardar
          </Button>
        </div>

        {!cancelled && (
          <div className="border-t border-border pt-4">
            {confirmCancel ? (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-destructive">
                  Cancelar repõe o stock dos artigos e avisa o cliente. Não pode ser revertido.
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  className="font-bold"
                  disabled={save.isPending}
                  onClick={() => save.mutate({ status: "cancelled" })}
                >
                  Confirmar cancelamento
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmCancel(false)}>
                  Voltar
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => setConfirmCancel(true)}
              >
                <Ban /> Cancelar encomenda
              </Button>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

function ItemsPanel({ order }: { order: AdminOrder }) {
  return (
    <Panel title={`Artigos (${order.order_items.reduce((n, i) => n + i.quantity, 0)})`}>
      <ul className="divide-y divide-border">
        {order.order_items.map((i) => (
          <li
            key={i.id}
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm"
          >
            <div className="min-w-0">
              <p className="font-mono font-bold">{i.reference_snapshot}</p>
              <p className="truncate text-muted-foreground">
                {i.title_snapshot} · {conditionLabel[i.condition_snapshot]}
              </p>
              {i.product && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Stock atual: <span className="tabular-nums">{i.product.stock_quantity}</span> ·{" "}
                  <Link
                    to="/admin/produtos/$id"
                    params={{ id: i.product_id! }}
                    className="text-primary hover:underline"
                  >
                    ficha
                  </Link>
                </p>
              )}
            </div>
            <p className="font-mono tabular-nums">
              {i.quantity} × {formatPrice(i.unit_price_cents)}
            </p>
          </li>
        ))}
      </ul>
      <dl className="space-y-1.5 border-t border-border px-5 py-4 text-sm">
        <Row label="Subtotal" value={formatPrice(order.subtotal_cents)} />
        <Row
          label={`Envio${order.shipping_rate ? ` · ${order.shipping_rate.carrier}` : ""}${order.service_level ? ` ${serviceLevelLabel[order.service_level]}` : ""}`}
          value={formatPrice(order.shipping_cents)}
        />
        <Row label="Total" value={formatPrice(order.total_cents)} strong />
        <Row
          label={`IVA incluído (${Number(order.vat_rate)}%)`}
          value={formatPrice(order.vat_cents)}
          muted
        />
      </dl>
    </Panel>
  );
}

function Row({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 ${strong ? "border-t border-border pt-2 font-bold" : ""} ${muted ? "text-xs text-muted-foreground" : ""}`}
    >
      <dt className={strong || muted ? "" : "text-muted-foreground"}>{label}</dt>
      <dd className="font-mono tabular-nums">{value}</dd>
    </div>
  );
}

function ShipmentsPanel({ order, onChanged }: { order: AdminOrder; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const canShip = !["cancelled", "refunded", "pending_payment"].includes(order.status);

  return (
    <Panel
      title="Expedição"
      actions={
        canShip && !adding ? (
          <Button size="sm" variant="outline" className="font-bold" onClick={() => setAdding(true)}>
            <Plus /> Novo envio
          </Button>
        ) : undefined
      }
    >
      {order.status === "pending_payment" && (
        <p className="px-5 py-4 text-sm text-muted-foreground">
          Confirme o pagamento antes de expedir.
        </p>
      )}
      {adding && (
        <NewShipmentForm
          order={order}
          onDone={() => {
            setAdding(false);
            onChanged();
          }}
          onCancel={() => setAdding(false)}
        />
      )}
      {order.shipments.length === 0 && !adding && order.status !== "pending_payment" && (
        <p className="px-5 py-4 text-sm text-muted-foreground">Ainda sem envios registados.</p>
      )}
      <div className="divide-y divide-border">
        {order.shipments.map((s) => (
          <ShipmentCard key={s.id} shipment={s} onChanged={onChanged} />
        ))}
      </div>
    </Panel>
  );
}

function NewShipmentForm({
  order,
  onDone,
  onCancel,
}: {
  order: AdminOrder;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [carrier, setCarrier] = useState(order.shipping_rate?.carrier ?? CARRIERS[0]!.name);
  const [level, setLevel] = useState<ServiceLevel>(order.service_level ?? "standard");
  const [tracking, setTracking] = useState("");
  const [url, setUrl] = useState("");
  const [urlTouched, setUrlTouched] = useState(false);
  const autoUrl = buildTrackingUrl(carrier, tracking);

  const create = useMutation({
    mutationFn: () =>
      createShipment({
        order_id: order.id,
        carrier: carrier.trim(),
        service_level: level,
        tracking_number: tracking.trim(),
        tracking_url: (urlTouched ? url : autoUrl).trim(),
      }),
    onSuccess: () => {
      toast.success("Envio registado · encomenda marcada como enviada · cliente notificado");
      onDone();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate();
      }}
      className="grid gap-4 border-b border-border bg-surface-elevated/40 p-5 sm:grid-cols-2"
    >
      <FieldWrap id="carrier" label="Transportadora">
        <TextInput
          id="carrier"
          list="carrier-list"
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          maxLength={60}
          required
        />
        <datalist id="carrier-list">
          {CARRIERS.map((c) => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>
      </FieldWrap>
      <FieldWrap id="level" label="Serviço">
        <SelectInput
          id="level"
          value={level}
          onChange={(e) => setLevel(e.target.value as ServiceLevel)}
        >
          <option value="standard">{serviceLevelLabel.standard}</option>
          <option value="express">{serviceLevelLabel.express}</option>
        </SelectInput>
      </FieldWrap>
      <FieldWrap id="tracking" label="Nº de tracking" optional>
        <TextInput
          id="tracking"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          maxLength={80}
          className="font-mono"
        />
      </FieldWrap>
      <FieldWrap
        id="tracking-url"
        label="Link de tracking"
        optional
        hint={!urlTouched && autoUrl ? "Gerado automaticamente" : "https://…"}
      >
        <TextInput
          id="tracking-url"
          type="url"
          value={urlTouched ? url : autoUrl}
          onChange={(e) => {
            setUrlTouched(true);
            setUrl(e.target.value);
          }}
          maxLength={500}
        />
      </FieldWrap>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" className="font-bold" disabled={create.isPending || !carrier.trim()}>
          {create.isPending ? <Loader2 className="animate-spin" /> : <Truck />}
          Registar envio
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function nowLocalInput(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function ShipmentCard({
  shipment: s,
  onChanged,
}: {
  shipment: AdminShipment;
  onChanged: () => void;
}) {
  const [status, setStatus] = useState<ShipmentStatus>(
    s.status === "label_created" ? "in_transit" : s.status,
  );
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [when, setWhen] = useState(nowLocalInput);

  const add = useMutation({
    mutationFn: () =>
      addShipmentEvent({
        shipment_id: s.id,
        status,
        description: description.trim(),
        location: location.trim(),
        occurred_at: new Date(when).toISOString(),
      }),
    onSuccess: () => {
      toast.success("Evento registado");
      setDescription("");
      setLocation("");
      onChanged();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold">
            {s.carrier} · {serviceLevelLabel[s.service_level]}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {s.tracking_number ?? "sem nº de tracking"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-bold text-sky-400">
            {shipmentStatusLabel[s.status]}
          </span>
          {s.tracking_url && (
            <a
              href={s.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary"
              aria-label="Abrir tracking"
            >
              <ExternalLink className="size-4" />
            </a>
          )}
        </div>
      </div>

      {s.shipment_events.length > 0 && (
        <ol className="mt-4 space-y-2.5 border-l border-border pl-4 text-sm">
          {s.shipment_events.map((e) => (
            <li key={e.id} className="relative">
              <span
                className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary"
                aria-hidden
              />
              <span className="font-semibold">
                {e.description ?? shipmentStatusLabel[e.status]}
              </span>
              <span className="block text-xs text-muted-foreground">
                {new Date(e.occurred_at).toLocaleString("pt-PT")}
                {e.location ? ` · ${e.location}` : ""} · {shipmentStatusLabel[e.status]}
              </span>
            </li>
          ))}
        </ol>
      )}

      {s.status !== "delivered" && s.status !== "returned" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate();
          }}
          className="mt-4 grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[150px_1fr_1fr_170px_auto] sm:items-end"
        >
          <FieldWrap id={`st-${s.id}`} label="Estado">
            <SelectInput
              id={`st-${s.id}`}
              value={status}
              onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
            >
              {SHIPMENT_STATUSES.map((x) => (
                <option key={x} value={x}>
                  {shipmentStatusLabel[x]}
                </option>
              ))}
            </SelectInput>
          </FieldWrap>
          <FieldWrap id={`ds-${s.id}`} label="Descrição" optional>
            <TextInput
              id={`ds-${s.id}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
            />
          </FieldWrap>
          <FieldWrap id={`lc-${s.id}`} label="Local" optional>
            <TextInput
              id={`lc-${s.id}`}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={120}
            />
          </FieldWrap>
          <FieldWrap id={`wh-${s.id}`} label="Data">
            <TextInput
              id={`wh-${s.id}`}
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              required
            />
          </FieldWrap>
          <Button type="submit" size="sm" className="h-9 font-bold" disabled={add.isPending}>
            {add.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
            Evento
          </Button>
        </form>
      )}
    </div>
  );
}

function CustomerPanel({ order }: { order: AdminOrder }) {
  return (
    <Panel title="Cliente" className="h-fit">
      <div className="space-y-5 p-5 text-sm">
        <div className="space-y-1">
          <p className="flex items-center gap-2 font-semibold">
            <UserRound className="size-4 text-muted-foreground" aria-hidden />
            {order.user_id ? "Cliente com conta" : "Convidado"}
          </p>
          <Info label="Email">
            <a href={`mailto:${order.email}`} className="break-all text-primary hover:underline">
              {order.email}
            </a>
          </Info>
          {order.phone && <Info label="Telefone">{order.phone}</Info>}
          {order.vat_number && <Info label="NIF / VAT">{order.vat_number}</Info>}
          {order.company_name && <Info label="Empresa">{order.company_name}</Info>}
        </div>
        <AddressBlock title="Entrega" address={order.shipping_address} />
        <AddressBlock title="Faturação" address={order.billing_address} />
        {order.customer_notes && (
          <div>
            <h3 className="mono-label mb-2">Notas do cliente</h3>
            <p className="whitespace-pre-wrap rounded-md bg-surface-elevated p-3">
              {order.customer_notes}
            </p>
          </div>
        )}
      </div>
    </Panel>
  );
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </p>
  );
}
