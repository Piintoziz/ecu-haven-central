-- Chaves de definições editáveis no backoffice (/admin/definicoes).
-- A RLS só permite UPDATE a administradores; as linhas têm de existir.
insert into public.store_settings (key, value) values
  ('admin_email', '""'::jsonb),
  ('bank_transfer', '{}'::jsonb)
on conflict (key) do nothing;
