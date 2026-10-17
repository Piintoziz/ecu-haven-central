# Centralinas.com

Loja online de centralinas (ECU de motor, ABS, airbag, caixa automática, BCM) — pesquisa por referência, stock em tempo real, checkout com pagamento online e envio pela Packlink.

## Stack

- **TanStack Start** (React 19, SSR) + **Tailwind CSS v4**
- **Supabase** — base de dados, autenticação, storage das fotografias
- **Stripe Checkout** — cartão, Apple Pay, Google Pay, MB WAY, Multibanco, PayPal
- **Packlink PRO** — tarifas e envios (Correos Express em PT/ES, UPS no resto da Europa)
- **Resend** — emails transacionais (fila em `email_outbox`)
- Deploy: **Cloudflare Workers** (build com Nitro, preset `cloudflare-module`)

## Desenvolvimento

```sh
npm install
npm run dev        # http://localhost:8080
npm run build
```

As variáveis de ambiente ficam em `.env` (nunca no git). Só as `VITE_*` chegam ao browser; as restantes são segredos de servidor:

| Variável | Para quê |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | cliente Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | operações de servidor |
| `VITE_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | anti-bot nos formulários |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | pagamentos online |
| `PACKLINK_API_KEY` | tarifas e envios |
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` | emails |
| `CRON_SECRET` | `POST /api/emails/process` (fila de emails + tracking) |

### Pagamentos em teste

Com o Stripe CLI a reencaminhar os eventos para o servidor local:

```sh
stripe listen --forward-to localhost:8080/api/stripe/webhook
```

Em produção, o webhook é criado no Dashboard do Stripe para `https://centralinas.com/api/stripe/webhook` com os eventos `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` e `checkout.session.expired`.

## Estrutura

- `src/routes/` — páginas e endpoints (`api.*`)
- `src/lib/server/` — código só de servidor (Stripe, Packlink, emails, segurança)
- `supabase/migrations/` — esquema e funções SQL
