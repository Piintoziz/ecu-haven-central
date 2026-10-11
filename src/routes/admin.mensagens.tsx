import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Mail, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AdminPageHeader, FilterTabs, Pager, Panel } from "@/components/admin/ui";
import { SelectInput } from "@/components/site/form-field";
import {
  ADMIN_PAGE_SIZE,
  listMessages,
  setMessageStatus,
  type ContactMessage,
  type ContactStatus,
} from "@/lib/admin";
import { cn } from "@/lib/utils";

const STATUSES = ["new", "in_progress", "answered", "spam"] as const;

export const Route = createFileRoute("/admin/mensagens")({
  validateSearch: (s: Record<string, unknown>) =>
    z
      .object({
        estado: z.enum(STATUSES).optional().catch(undefined),
        pagina: z.coerce.number().int().min(1).max(1000).optional().catch(undefined),
      })
      .parse(s),
  component: MessagesPage,
});

const LABEL: Record<ContactStatus, string> = {
  new: "Nova",
  in_progress: "Em curso",
  answered: "Respondida",
  spam: "Spam",
};

function MessagesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);

  const messages = useQuery({
    queryKey: ["admin", "messages", search],
    queryFn: () => listMessages({ status: search.estado, page: search.pagina }),
    placeholderData: keepPreviousData,
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContactStatus }) =>
      setMessageStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "messages"] });
      void qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <>
      <AdminPageHeader
        title="Mensagens"
        description="Pedidos de contacto, orçamentos e pesquisas de referência."
      />
      <Panel>
        <div className="border-b border-border p-3">
          <FilterTabs<ContactStatus>
            value={search.estado}
            options={[
              { value: undefined, label: "Todas" },
              ...STATUSES.map((s) => ({ value: s, label: LABEL[s] })),
            ]}
            onChange={(estado) => void navigate({ search: { estado, pagina: undefined } })}
          />
        </div>
        <ul className={cn("divide-y divide-border", messages.isPlaceholderData && "opacity-60")}>
          {messages.data?.rows.map((m) => (
            <MessageItem
              key={m.id}
              message={m}
              open={openId === m.id}
              onToggle={() => {
                setOpenId(openId === m.id ? null : m.id);
                if (m.status === "new") update.mutate({ id: m.id, status: "in_progress" });
              }}
              onStatus={(status) => update.mutate({ id: m.id, status })}
            />
          ))}
          {messages.isLoading && (
            <li className="px-5 py-10 text-center text-sm text-muted-foreground">A carregar…</li>
          )}
          {messages.data?.rows.length === 0 && (
            <li className="px-5 py-10 text-center text-sm text-muted-foreground">Sem mensagens.</li>
          )}
        </ul>
        <Pager
          page={search.pagina ?? 1}
          total={messages.data?.total ?? 0}
          pageSize={ADMIN_PAGE_SIZE}
          onPage={(pagina) => void navigate({ search: (prev) => ({ ...prev, pagina }) })}
        />
      </Panel>
    </>
  );
}

function MessageItem({
  message: m,
  open,
  onToggle,
  onStatus,
}: {
  message: ContactMessage;
  open: boolean;
  onToggle: () => void;
  onStatus: (s: ContactStatus) => void;
}) {
  return (
    <li className={cn(m.status === "new" && "bg-primary/[0.04]")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start gap-4 px-5 py-3.5 text-left hover:bg-accent/30"
      >
        <span
          className={cn(
            "mt-1.5 size-2 shrink-0 rounded-full",
            m.status === "new" ? "bg-primary" : "bg-transparent",
          )}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span
              className={cn("truncate text-sm", m.status === "new" ? "font-bold" : "font-semibold")}
            >
              {m.name}
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {new Date(m.created_at).toLocaleString("pt-PT", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            {m.product_reference && (
              <span className="mr-2 font-mono font-bold text-foreground">
                {m.product_reference}
              </span>
            )}
            {m.subject ?? m.message.slice(0, 120)}
          </span>
        </span>
      </button>
      {open && (
        <div className="space-y-4 px-5 pb-5 pl-11">
          <p className="whitespace-pre-wrap rounded-lg bg-surface-elevated p-4 text-sm">
            {m.message}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <a
              href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject ?? "o seu pedido"}`)}`}
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
            >
              <Mail className="size-4" /> {m.email}
            </a>
            {m.phone && (
              <a
                href={`tel:${m.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Phone className="size-4" /> {m.phone}
              </a>
            )}
            {m.vin && <span className="font-mono text-xs text-muted-foreground">VIN {m.vin}</span>}
            <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              Estado
              <SelectInput
                value={m.status}
                onChange={(e) => onStatus(e.target.value as ContactStatus)}
                className="h-8 w-36 py-1 text-xs"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {LABEL[s]}
                  </option>
                ))}
              </SelectInput>
            </label>
          </div>
        </div>
      )}
    </li>
  );
}
