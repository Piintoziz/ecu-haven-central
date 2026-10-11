-- Prazos de conservação prometidos na Política de Privacidade (/privacidade):
--   rate_limits (hash de IP)            -> 24 horas
--   email_outbox enviados/falhados      -> 90 dias
-- Limpeza oportunista (~2% das chamadas) dentro das funções que já correm no
-- servidor, sem depender de pg_cron.

create or replace function public.check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n integer;
begin
  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '24 hours';
  end if;
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, w, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into n;
  return n <= p_limit;
end;
$$;
revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

create or replace function public.claim_email_batch(p_limit integer)
returns setof public.email_outbox
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if random() < 0.02 then
    delete from public.email_outbox
    where status in ('sent', 'failed') and created_at < now() - interval '90 days';
  end if;
  return query
  update public.email_outbox o
     set status = 'sending', attempts = o.attempts + 1, claimed_at = now()
   where o.id in (
     select x.id from public.email_outbox x
     where x.status = 'pending'
        or (x.status = 'failed' and x.attempts < 5
            and x.claimed_at < now() - make_interval(mins => 5 * x.attempts))
        or (x.status = 'sending' and x.claimed_at < now() - interval '10 minutes')
     order by x.created_at
     limit least(greatest(coalesce(p_limit, 10), 1), 50)
     for update skip locked)
  returning o.*;
end;
$$;
revoke execute on function public.claim_email_batch(integer) from public, anon, authenticated;
grant execute on function public.claim_email_batch(integer) to service_role;
