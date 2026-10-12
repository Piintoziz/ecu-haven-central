-- Tarifas de envio (Packlink PRO): DPD com recolha no armazém para PT/ES;
-- DPD e UPS para o resto da UE (o cliente escolhe). Preço = custo Packlink c/ IVA
-- arredondado para cima a x,90 €. Escalões por peso total: <2 kg, 2–5 kg, 5–10 kg.
-- Destinos fora destas zonas (fora da UE, Chipre, Malta, Polónia, >10 kg) ficam
-- sem tarifa automática: o checkout mostra "peça um orçamento de envio".

alter table public.shipping_rates
  add column if not exists packlink_service_id integer;

-- Tarifas antigas ficam inativas (as encomendas antigas continuam a referenciá-las).
update public.shipping_rates set is_active = false where is_active;

-- Peso de envio por omissão: 1,5 kg por centralina embalada.
update public.products set weight_grams = 1500 where weight_grams = 500;
alter table public.products alter column weight_grams set default 1500;

insert into public.shipping_zones (name, country_codes) values ('Portugal (Packlink)', array['PT']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Espanha (Packlink)', array['ES']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Áustria (Packlink)', array['AT']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Bélgica (Packlink)', array['BE']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Bulgária (Packlink)', array['BG']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Croácia (Packlink)', array['HR']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Chéquia (Packlink)', array['CZ']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Dinamarca (Packlink)', array['DK']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Estónia (Packlink)', array['EE']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Finlândia (Packlink)', array['FI']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('França (Packlink)', array['FR']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Alemanha (Packlink)', array['DE']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Grécia (Packlink)', array['GR']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Hungria (Packlink)', array['HU']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Irlanda (Packlink)', array['IE']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Itália (Packlink)', array['IT']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Letónia (Packlink)', array['LV']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Lituânia (Packlink)', array['LT']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Luxemburgo (Packlink)', array['LU']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Países Baixos (Packlink)', array['NL']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Roménia (Packlink)', array['RO']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Eslováquia (Packlink)', array['SK']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Eslovénia (Packlink)', array['SI']::char(2)[]);
insert into public.shipping_zones (name, country_codes) values ('Suécia (Packlink)', array['SE']::char(2)[]);

insert into public.shipping_rates (zone_id, carrier, service_level, min_weight_g, max_weight_g, price_cents, est_days_min, est_days_max, packlink_service_id, is_active)
select z.id, v.carrier, 'standard'::public.service_level, v.min_g, v.max_g, v.price, v.d1, v.d2, v.sid, true
from (values
  ('PT', 'DPD', 0, 2000, 1290, 1, 2, 22383),
  ('PT', 'DPD', 2000, 5000, 1290, 1, 2, 22383),
  ('ES', 'DPD', 0, 2000, 1290, 2, 3, 22403),
  ('ES', 'DPD', 2000, 5000, 1590, 2, 3, 22403),
  ('ES', 'DPD', 5000, 10000, 3590, 2, 3, 22403),
  ('AT', 'DPD', 0, 2000, 3090, 4, 5, 22401),
  ('AT', 'DPD', 2000, 5000, 4290, 4, 5, 22401),
  ('AT', 'DPD', 5000, 10000, 4990, 4, 5, 22401),
  ('AT', 'UPS', 0, 2000, 2690, 4, 5, 22101),
  ('AT', 'UPS', 2000, 5000, 2690, 4, 5, 22101),
  ('AT', 'UPS', 5000, 10000, 4790, 4, 5, 22101),
  ('BE', 'DPD', 0, 2000, 3090, 3, 4, 22401),
  ('BE', 'DPD', 2000, 5000, 4290, 3, 4, 22401),
  ('BE', 'DPD', 5000, 10000, 4890, 3, 4, 22401),
  ('BE', 'UPS', 0, 2000, 2290, 2, 3, 22101),
  ('BE', 'UPS', 2000, 5000, 2290, 2, 3, 22101),
  ('BE', 'UPS', 5000, 10000, 3790, 2, 3, 22101),
  ('BG', 'DPD', 0, 2000, 5190, 5, 6, 22401),
  ('BG', 'DPD', 2000, 5000, 7490, 5, 6, 22401),
  ('BG', 'DPD', 5000, 10000, 8790, 5, 6, 22401),
  ('BG', 'UPS', 0, 2000, 2690, 6, 7, 22101),
  ('BG', 'UPS', 2000, 5000, 2690, 6, 7, 22101),
  ('BG', 'UPS', 5000, 10000, 4790, 6, 7, 22101),
  ('HR', 'UPS', 0, 2000, 2690, 4, 5, 22101),
  ('HR', 'UPS', 2000, 5000, 2690, 4, 5, 22101),
  ('HR', 'UPS', 5000, 10000, 4790, 4, 5, 22101),
  ('CZ', 'DPD', 0, 2000, 2690, 4, 5, 22401),
  ('CZ', 'DPD', 2000, 5000, 3990, 4, 5, 22401),
  ('CZ', 'DPD', 5000, 10000, 4590, 4, 5, 22401),
  ('CZ', 'UPS', 0, 2000, 2690, 3, 4, 22101),
  ('CZ', 'UPS', 2000, 5000, 2690, 3, 4, 22101),
  ('CZ', 'UPS', 5000, 10000, 4790, 3, 4, 22101),
  ('DK', 'DPD', 0, 2000, 3290, 4, 5, 22401),
  ('DK', 'DPD', 2000, 5000, 4690, 4, 5, 22401),
  ('DK', 'DPD', 5000, 10000, 5390, 4, 5, 22401),
  ('DK', 'UPS', 0, 2000, 2690, 3, 4, 22101),
  ('DK', 'UPS', 2000, 5000, 2690, 3, 4, 22101),
  ('DK', 'UPS', 5000, 10000, 4790, 3, 4, 22101),
  ('EE', 'DPD', 0, 2000, 3890, 6, 7, 22401),
  ('EE', 'DPD', 2000, 5000, 5590, 6, 7, 22401),
  ('EE', 'DPD', 5000, 10000, 6390, 6, 7, 22401),
  ('EE', 'UPS', 0, 2000, 2690, 6, 7, 22101),
  ('EE', 'UPS', 2000, 5000, 2690, 6, 7, 22101),
  ('EE', 'UPS', 5000, 10000, 4790, 6, 7, 22101),
  ('FI', 'DPD', 0, 2000, 5190, 5, 6, 22401),
  ('FI', 'DPD', 2000, 5000, 7490, 5, 6, 22401),
  ('FI', 'DPD', 5000, 10000, 8790, 5, 6, 22401),
  ('FI', 'UPS', 0, 2000, 2690, 5, 6, 22101),
  ('FI', 'UPS', 2000, 5000, 2690, 5, 6, 22101),
  ('FI', 'UPS', 5000, 10000, 4790, 5, 6, 22101),
  ('FR', 'DPD', 0, 2000, 2990, 2, 3, 22401),
  ('FR', 'DPD', 2000, 5000, 4290, 2, 3, 22401),
  ('FR', 'DPD', 5000, 10000, 4690, 2, 3, 22401),
  ('FR', 'UPS', 0, 2000, 2290, 2, 3, 22101),
  ('FR', 'UPS', 2000, 5000, 2290, 2, 3, 22101),
  ('FR', 'UPS', 5000, 10000, 3790, 2, 3, 22101),
  ('DE', 'DPD', 0, 2000, 2590, 3, 4, 22401),
  ('DE', 'DPD', 2000, 5000, 3690, 3, 4, 22401),
  ('DE', 'DPD', 5000, 10000, 4190, 3, 4, 22401),
  ('DE', 'UPS', 0, 2000, 2690, 3, 4, 22101),
  ('DE', 'UPS', 2000, 5000, 2690, 3, 4, 22101),
  ('DE', 'UPS', 5000, 10000, 4790, 3, 4, 22101),
  ('GR', 'DPD', 0, 2000, 5890, 8, 9, 22401),
  ('GR', 'DPD', 2000, 5000, 8390, 8, 9, 22401),
  ('GR', 'DPD', 5000, 10000, 10190, 8, 9, 22401),
  ('GR', 'UPS', 0, 2000, 2690, 5, 6, 22101),
  ('GR', 'UPS', 2000, 5000, 2690, 5, 6, 22101),
  ('GR', 'UPS', 5000, 10000, 4790, 5, 6, 22101),
  ('HU', 'DPD', 0, 2000, 3190, 4, 5, 22401),
  ('HU', 'DPD', 2000, 5000, 4690, 4, 5, 22401),
  ('HU', 'DPD', 5000, 10000, 5290, 4, 5, 22401),
  ('HU', 'UPS', 0, 2000, 2690, 4, 5, 22101),
  ('HU', 'UPS', 2000, 5000, 2690, 4, 5, 22101),
  ('HU', 'UPS', 5000, 10000, 4790, 4, 5, 22101),
  ('IE', 'DPD', 0, 2000, 3890, 4, 5, 22401),
  ('IE', 'DPD', 2000, 5000, 5590, 4, 5, 22401),
  ('IE', 'DPD', 5000, 10000, 6390, 4, 5, 22401),
  ('IE', 'UPS', 0, 2000, 2690, 4, 5, 22101),
  ('IE', 'UPS', 2000, 5000, 2690, 4, 5, 22101),
  ('IE', 'UPS', 5000, 10000, 4790, 4, 5, 22101),
  ('IT', 'DPD', 0, 2000, 3890, 3, 4, 22401),
  ('IT', 'DPD', 2000, 5000, 5590, 3, 4, 22401),
  ('IT', 'DPD', 5000, 10000, 6390, 3, 4, 22401),
  ('IT', 'UPS', 0, 2000, 2290, 3, 4, 22101),
  ('IT', 'UPS', 2000, 5000, 2290, 3, 4, 22101),
  ('IT', 'UPS', 5000, 10000, 3790, 3, 4, 22101),
  ('LV', 'DPD', 0, 2000, 3690, 5, 6, 22401),
  ('LV', 'DPD', 2000, 5000, 5290, 5, 6, 22401),
  ('LV', 'DPD', 5000, 10000, 5990, 5, 6, 22401),
  ('LV', 'UPS', 0, 2000, 2690, 5, 6, 22101),
  ('LV', 'UPS', 2000, 5000, 2690, 5, 6, 22101),
  ('LV', 'UPS', 5000, 10000, 4790, 5, 6, 22101),
  ('LT', 'DPD', 0, 2000, 3290, 5, 6, 22401),
  ('LT', 'DPD', 2000, 5000, 4690, 5, 6, 22401),
  ('LT', 'DPD', 5000, 10000, 5490, 5, 6, 22401),
  ('LT', 'UPS', 0, 2000, 2690, 5, 6, 22101),
  ('LT', 'UPS', 2000, 5000, 2690, 5, 6, 22101),
  ('LT', 'UPS', 5000, 10000, 4790, 5, 6, 22101),
  ('LU', 'DPD', 0, 2000, 3090, 3, 4, 22401),
  ('LU', 'DPD', 2000, 5000, 4290, 3, 4, 22401),
  ('LU', 'DPD', 5000, 10000, 4990, 3, 4, 22401),
  ('LU', 'UPS', 0, 2000, 2290, 3, 4, 22101),
  ('LU', 'UPS', 2000, 5000, 2290, 3, 4, 22101),
  ('LU', 'UPS', 5000, 10000, 3790, 3, 4, 22101),
  ('NL', 'DPD', 0, 2000, 3090, 3, 4, 22401),
  ('NL', 'DPD', 2000, 5000, 4290, 3, 4, 22401),
  ('NL', 'DPD', 5000, 10000, 4890, 3, 4, 22401),
  ('NL', 'UPS', 0, 2000, 2290, 3, 4, 22101),
  ('NL', 'UPS', 2000, 5000, 2290, 3, 4, 22101),
  ('NL', 'UPS', 5000, 10000, 3790, 3, 4, 22101),
  ('RO', 'DPD', 0, 2000, 5190, 4, 5, 22401),
  ('RO', 'DPD', 2000, 5000, 7490, 4, 5, 22401),
  ('RO', 'DPD', 5000, 10000, 8790, 4, 5, 22401),
  ('RO', 'UPS', 0, 2000, 2690, 5, 6, 22101),
  ('RO', 'UPS', 2000, 5000, 2690, 5, 6, 22101),
  ('RO', 'UPS', 5000, 10000, 4790, 5, 6, 22101),
  ('SK', 'DPD', 0, 2000, 3290, 4, 5, 22401),
  ('SK', 'DPD', 2000, 5000, 4690, 4, 5, 22401),
  ('SK', 'DPD', 5000, 10000, 5490, 4, 5, 22401),
  ('SK', 'UPS', 0, 2000, 2690, 4, 5, 22101),
  ('SK', 'UPS', 2000, 5000, 2690, 4, 5, 22101),
  ('SK', 'UPS', 5000, 10000, 4790, 4, 5, 22101),
  ('SI', 'DPD', 0, 2000, 3290, 3, 4, 22401),
  ('SI', 'DPD', 2000, 5000, 4690, 3, 4, 22401),
  ('SI', 'DPD', 5000, 10000, 5490, 3, 4, 22401),
  ('SI', 'UPS', 0, 2000, 2690, 3, 4, 22101),
  ('SI', 'UPS', 2000, 5000, 2690, 3, 4, 22101),
  ('SI', 'UPS', 5000, 10000, 4790, 3, 4, 22101),
  ('SE', 'DPD', 0, 2000, 3890, 4, 5, 22401),
  ('SE', 'DPD', 2000, 5000, 5590, 4, 5, 22401),
  ('SE', 'DPD', 5000, 10000, 6390, 4, 5, 22401),
  ('SE', 'UPS', 0, 2000, 2690, 4, 5, 22101),
  ('SE', 'UPS', 2000, 5000, 2690, 4, 5, 22101),
  ('SE', 'UPS', 5000, 10000, 4790, 4, 5, 22101)
) as v(cc, carrier, min_g, max_g, price, d1, d2, sid)
join public.shipping_zones z on z.name like '% (Packlink)' and z.country_codes = array[v.cc]::char(2)[];
