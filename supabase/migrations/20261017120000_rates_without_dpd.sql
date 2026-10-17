-- Envios sem DPD: a DPD deixou de estar disponível na conta Packlink PRO (17/10/2026).
-- Novas tarifas com o serviço com recolha mais barato por país e escalão (cotações de hoje):
--   PT/ES: Correos Express Paq 24 · resto da UE e Reino Unido: UPS Standard.
-- Preço ao cliente = custo Packlink c/ IVA arredondado para cima a x,90 €.
-- As tarifas antigas ficam inativas (encomendas antigas continuam a referenciá-las).
-- Suíça e Noruega ficaram sem serviço Packlink: passam para a tarifa fixa fora da UE.

update public.shipping_rates r set is_active = false
  from public.shipping_zones z
 where z.id = r.zone_id and z.name like '% (Packlink)' and r.is_active;

update public.shipping_zones
   set country_codes = (select array_agg(distinct c) from unnest(country_codes || array['CH','NO']::char(2)[]) c)
 where name = 'Fora da UE sem serviço Packlink (fixo)';

insert into public.shipping_rates (zone_id, carrier, service_level, min_weight_g, max_weight_g, price_cents, est_days_min, est_days_max, packlink_service_id, is_active)
select z.id, v.carrier, 'standard'::public.service_level, v.min_g, v.max_g, v.price, v.d1, v.d2, v.sid, true
from (values
  ('PT', 'Correos Express', 0, 2000, 690, 1, 2, 20571),
  ('PT', 'Correos Express', 2000, 5000, 690, 1, 2, 20571),
  ('PT', 'Correos Express', 5000, 10000, 890, 1, 2, 20571),
  ('ES', 'Correos Express', 0, 2000, 690, 2, 3, 20571),
  ('ES', 'Correos Express', 2000, 5000, 690, 2, 3, 20571),
  ('ES', 'Correos Express', 5000, 10000, 890, 2, 3, 20571),
  ('AT', 'UPS', 0, 2000, 2690, 4, 5, 22101),
  ('AT', 'UPS', 2000, 5000, 2690, 4, 5, 22101),
  ('AT', 'UPS', 5000, 10000, 4790, 4, 5, 22101),
  ('BE', 'UPS', 0, 2000, 2290, 2, 3, 22101),
  ('BE', 'UPS', 2000, 5000, 2290, 2, 3, 22101),
  ('BE', 'UPS', 5000, 10000, 3790, 2, 3, 22101),
  ('BG', 'UPS', 0, 2000, 2690, 6, 7, 22101),
  ('BG', 'UPS', 2000, 5000, 2690, 6, 7, 22101),
  ('BG', 'UPS', 5000, 10000, 4790, 6, 7, 22101),
  ('HR', 'UPS', 0, 2000, 2690, 4, 5, 22101),
  ('HR', 'UPS', 2000, 5000, 2690, 4, 5, 22101),
  ('HR', 'UPS', 5000, 10000, 4790, 4, 5, 22101),
  ('CZ', 'UPS', 0, 2000, 2690, 3, 4, 22101),
  ('CZ', 'UPS', 2000, 5000, 2690, 3, 4, 22101),
  ('CZ', 'UPS', 5000, 10000, 4790, 3, 4, 22101),
  ('DK', 'UPS', 0, 2000, 2690, 3, 4, 22101),
  ('DK', 'UPS', 2000, 5000, 2690, 3, 4, 22101),
  ('DK', 'UPS', 5000, 10000, 4790, 3, 4, 22101),
  ('EE', 'UPS', 0, 2000, 2690, 6, 7, 22101),
  ('EE', 'UPS', 2000, 5000, 2690, 6, 7, 22101),
  ('EE', 'UPS', 5000, 10000, 4790, 6, 7, 22101),
  ('FI', 'UPS', 0, 2000, 2690, 5, 6, 22101),
  ('FI', 'UPS', 2000, 5000, 2690, 5, 6, 22101),
  ('FI', 'UPS', 5000, 10000, 4790, 5, 6, 22101),
  ('FR', 'UPS', 0, 2000, 2290, 2, 3, 22101),
  ('FR', 'UPS', 2000, 5000, 2290, 2, 3, 22101),
  ('FR', 'UPS', 5000, 10000, 3790, 2, 3, 22101),
  ('DE', 'UPS', 0, 2000, 2690, 3, 4, 22101),
  ('DE', 'UPS', 2000, 5000, 2690, 3, 4, 22101),
  ('DE', 'UPS', 5000, 10000, 4790, 3, 4, 22101),
  ('GR', 'UPS', 0, 2000, 2690, 5, 6, 22101),
  ('GR', 'UPS', 2000, 5000, 2690, 5, 6, 22101),
  ('GR', 'UPS', 5000, 10000, 4790, 5, 6, 22101),
  ('HU', 'UPS', 0, 2000, 2690, 4, 5, 22101),
  ('HU', 'UPS', 2000, 5000, 2690, 4, 5, 22101),
  ('HU', 'UPS', 5000, 10000, 4790, 4, 5, 22101),
  ('IE', 'UPS', 0, 2000, 2690, 4, 5, 22101),
  ('IE', 'UPS', 2000, 5000, 2690, 4, 5, 22101),
  ('IE', 'UPS', 5000, 10000, 4790, 4, 5, 22101),
  ('IT', 'UPS', 0, 2000, 2290, 3, 4, 22101),
  ('IT', 'UPS', 2000, 5000, 2290, 3, 4, 22101),
  ('IT', 'UPS', 5000, 10000, 3790, 3, 4, 22101),
  ('LV', 'UPS', 0, 2000, 2690, 5, 6, 22101),
  ('LV', 'UPS', 2000, 5000, 2690, 5, 6, 22101),
  ('LV', 'UPS', 5000, 10000, 4790, 5, 6, 22101),
  ('LT', 'UPS', 0, 2000, 2690, 5, 6, 22101),
  ('LT', 'UPS', 2000, 5000, 2690, 5, 6, 22101),
  ('LT', 'UPS', 5000, 10000, 4790, 5, 6, 22101),
  ('LU', 'UPS', 0, 2000, 2290, 3, 4, 22101),
  ('LU', 'UPS', 2000, 5000, 2290, 3, 4, 22101),
  ('LU', 'UPS', 5000, 10000, 3790, 3, 4, 22101),
  ('NL', 'UPS', 0, 2000, 2290, 3, 4, 22101),
  ('NL', 'UPS', 2000, 5000, 2290, 3, 4, 22101),
  ('NL', 'UPS', 5000, 10000, 3790, 3, 4, 22101),
  ('RO', 'UPS', 0, 2000, 2690, 5, 6, 22101),
  ('RO', 'UPS', 2000, 5000, 2690, 5, 6, 22101),
  ('RO', 'UPS', 5000, 10000, 4790, 5, 6, 22101),
  ('SK', 'UPS', 0, 2000, 2690, 4, 5, 22101),
  ('SK', 'UPS', 2000, 5000, 2690, 4, 5, 22101),
  ('SK', 'UPS', 5000, 10000, 4790, 4, 5, 22101),
  ('SI', 'UPS', 0, 2000, 2690, 3, 4, 22101),
  ('SI', 'UPS', 2000, 5000, 2690, 3, 4, 22101),
  ('SI', 'UPS', 5000, 10000, 4790, 3, 4, 22101),
  ('SE', 'UPS', 0, 2000, 2690, 4, 5, 22101),
  ('SE', 'UPS', 2000, 5000, 2690, 4, 5, 22101),
  ('SE', 'UPS', 5000, 10000, 4790, 4, 5, 22101),
  ('GB', 'UPS', 0, 2000, 2590, 3, 4, 22101),
  ('GB', 'UPS', 2000, 5000, 2590, 3, 4, 22101),
  ('GB', 'UPS', 5000, 10000, 3890, 3, 4, 22101)
) as v(cc, carrier, min_g, max_g, price, d1, d2, sid)
join public.shipping_zones z on z.name like '% (Packlink)' and z.country_codes = array[v.cc]::char(2)[];
