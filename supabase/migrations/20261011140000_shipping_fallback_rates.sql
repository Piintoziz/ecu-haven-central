-- Tarifas para todos os países de entrega (nenhum destino fica sem portes no checkout).
-- 1) Países fora da UE onde a Packlink tem serviço com recolha: preço Packlink c/ IVA
--    arredondado para cima a x,90 €.
-- 2) Sem serviço Packlink: preço fixo definido pela loja (envio tratado à mão):
--    UE 14,90 € · UE mais afastada (Chipre, Malta) 17,90 € · fora da UE 43,00 €.
-- 3) Portugal 5–10 kg: a DPD não cota este escalão; usa UPS (Packlink).

insert into public.shipping_zones (name, country_codes) values
  ('Reino Unido (Packlink)', array['GB']::char(2)[]),
  ('Suíça (Packlink)', array['CH']::char(2)[]),
  ('Noruega (Packlink)', array['NO']::char(2)[]),
  ('UE sem serviço Packlink (fixo)', array['PL']::char(2)[]),
  ('UE afastada sem serviço Packlink (fixo)', array['CY','MT']::char(2)[]),
  ('Fora da UE sem serviço Packlink (fixo)', array[
    'IS','AD','MC','LI','SM','AL','BA','RS','ME','MK','MD','UA','TR',
    'AO','MZ','CV','ST','GW','BR','US','CA','MX','AR','CL','CO',
    'MA','TN','ZA','AE','SA','IL','AU','NZ']::char(2)[]);

insert into public.shipping_rates (zone_id, carrier, service_level, min_weight_g, max_weight_g, price_cents, est_days_min, est_days_max, packlink_service_id, is_active)
select z.id, v.carrier, 'standard'::public.service_level, v.min_g, v.max_g, v.price, v.d1, v.d2, v.sid, true
from (values
  ('Reino Unido (Packlink)', 'UPS', 0, 2000, 2590, 3, 4, 22101),
  ('Reino Unido (Packlink)', 'UPS', 2000, 5000, 2590, 3, 4, 22101),
  ('Reino Unido (Packlink)', 'UPS', 5000, 10000, 3890, 3, 4, 22101),
  ('Suíça (Packlink)', 'DPD', 0, 2000, 4890, 4, 5, 22401),
  ('Suíça (Packlink)', 'DPD', 2000, 5000, 5990, 4, 5, 22401),
  ('Suíça (Packlink)', 'DPD', 5000, 10000, 6490, 4, 5, 22401),
  ('Noruega (Packlink)', 'DPD', 0, 2000, 6790, 5, 6, 22401),
  ('Noruega (Packlink)', 'DPD', 2000, 5000, 8590, 5, 6, 22401),
  ('Noruega (Packlink)', 'DPD', 5000, 10000, 9690, 5, 6, 22401),
  ('Portugal (Packlink)', 'UPS', 5000, 10000, 2290, 1, 2, 22099),
  ('UE sem serviço Packlink (fixo)', 'Envio internacional', 0, 30000, 1490, 3, 6, null),
  ('UE afastada sem serviço Packlink (fixo)', 'Envio internacional', 0, 30000, 1790, 4, 8, null),
  ('Fora da UE sem serviço Packlink (fixo)', 'Envio internacional', 0, 30000, 4300, 5, 12, null)
) as v(zone, carrier, min_g, max_g, price, d1, d2, sid)
join public.shipping_zones z on z.name = v.zone;
