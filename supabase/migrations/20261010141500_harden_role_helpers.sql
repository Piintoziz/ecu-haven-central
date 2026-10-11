-- Move os helpers de papéis para um schema NÃO exposto pela Data API.
-- As políticas continuam a funcionar (referenciam a função por OID), mas deixa
-- de ser possível sondar papéis de outros utilizadores via /rest/v1/rpc/*.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

alter function public.has_role(uuid, public.app_role) set schema private;
alter function public.is_staff(uuid) set schema private;

comment on table public.email_outbox is 'Fila de emails transacionais. Sem políticas RLS de propósito: acesso exclusivo via service_role.';
comment on table public.rate_limits is 'Contadores de rate limiting. Sem políticas RLS de propósito: acesso exclusivo via service_role.';
