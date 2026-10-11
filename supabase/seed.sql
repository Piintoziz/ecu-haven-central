-- Dados de referência + produtos DEMO (sku 'DEMO-%'). Remover os DEMO antes do lançamento:
--   delete from public.products where sku like 'DEMO-%';
insert into public.categories (slug, short_code, name, description, position) values
  ('motor', 'ECU', 'Centralinas de motor', 'Gestão de motor diesel e gasolina: EDC16, EDC17, MED17, SID, Simos, DCM.', 1),
  ('abs', 'ABS', 'Módulos ABS / ESP', 'Unidades de controlo e grupos hidráulicos de travagem e estabilidade.', 2),
  ('airbag', 'SRS', 'Módulos airbag', 'Unidades SRS com crash data apagada e testada.', 3),
  ('transmissao', 'TCU', 'Caixa de velocidades', 'TCU para caixas automáticas, DSG, PDK e CVT.', 4),
  ('conforto', 'BCM', 'Conforto e BCM', 'Body control, SAM, luzes, vidros e climatização.', 5),
  ('imobilizador', 'IMO', 'Imobilizador e chaves', 'Kessy, ELV, transponders e módulos de arranque.', 6)
on conflict (slug) do nothing;
insert into public.ecu_manufacturers (slug, name) values
  ('bosch', 'Bosch'),
  ('siemens-vdo', 'Siemens VDO'),
  ('continental', 'Continental'),
  ('delphi', 'Delphi'),
  ('magneti-marelli', 'Magneti Marelli'),
  ('denso', 'Denso'),
  ('aisin', 'Aisin'),
  ('hella', 'Hella'),
  ('trw', 'TRW'),
  ('valeo', 'Valeo')
on conflict (slug) do nothing;
insert into public.vehicle_brands (slug, name) values
  ('volkswagen', 'Volkswagen'),
  ('audi', 'Audi'),
  ('bmw', 'BMW'),
  ('mercedes-benz', 'Mercedes-Benz'),
  ('peugeot', 'Peugeot'),
  ('citroen', 'Citroën'),
  ('renault', 'Renault'),
  ('ford', 'Ford'),
  ('opel', 'Opel'),
  ('fiat', 'Fiat'),
  ('toyota', 'Toyota'),
  ('nissan', 'Nissan'),
  ('seat', 'Seat'),
  ('skoda', 'Skoda'),
  ('volvo', 'Volvo'),
  ('mini', 'Mini')
on conflict (slug) do nothing;
insert into public.vehicle_models (brand_id, slug, name, engine_description, engine_code, year_from, year_to, fuel)
select id, 'golf-vi-2-0-tdi', 'Golf VI', '2.0 TDI', 'CFFB', 2010, 2015, 'diesel' from public.vehicle_brands where slug = 'volkswagen'
union all select id, 'passat-b7-2-0-tdi', 'Passat B7', '2.0 TDI', 'CFF', 2011, 2015, 'diesel' from public.vehicle_brands where slug = 'volkswagen'
union all select id, 'a4-b6-1-8-t', 'A4 B6', '1.8 T', 'AVJ', 2001, 2005, 'petrol' from public.vehicle_brands where slug = 'audi'
union all select id, '308-1-6-hdi', '308', '1.6 HDi', 'DV6C', 2010, 2016, 'diesel' from public.vehicle_brands where slug = 'peugeot'
union all select id, '3008-1-6-hdi', '3008', '1.6 HDi', 'DV6C', 2010, 2016, 'diesel' from public.vehicle_brands where slug = 'peugeot'
union all select id, 'focus-1-6-tdci', 'Focus', '1.6 TDCi', 'T1DA', 2010, 2016, 'diesel' from public.vehicle_brands where slug = 'ford'
union all select id, 'classe-c-w204-c220-cdi', 'Classe C W204', 'C220 CDI', 'OM651', 2009, 2014, 'diesel' from public.vehicle_brands where slug = 'mercedes-benz'
union all select id, 'classe-e-w212-e220-cdi', 'Classe E W212', 'E220 CDI', 'OM651', 2009, 2014, 'diesel' from public.vehicle_brands where slug = 'mercedes-benz'
union all select id, 'golf-v', 'Golf V', null, null, 2004, 2010, null from public.vehicle_brands where slug = 'volkswagen'
union all select id, 'touran', 'Touran', null, null, 2004, 2010, null from public.vehicle_brands where slug = 'volkswagen'
union all select id, 'ibiza-6l', 'Ibiza 6L', null, null, 2002, 2008, null from public.vehicle_brands where slug = 'seat'
union all select id, 'fabia-i', 'Fabia I', null, null, 2002, 2008, null from public.vehicle_brands where slug = 'skoda'
union all select id, 'a3-8p-2-0-tdi', 'A3 8P', '2.0 TDI', null, 2005, 2012, 'diesel' from public.vehicle_brands where slug = 'audi'
union all select id, 'passat-b6', 'Passat B6', null, null, 2005, 2010, null from public.vehicle_brands where slug = 'volkswagen'
union all select id, 'a6-c6', 'A6 C6', null, null, 2004, 2011, null from public.vehicle_brands where slug = 'audi'
union all select id, 'tiguan-2-0-tdi', 'Tiguan', '2.0 TDI', 'CFF', 2011, 2015, 'diesel' from public.vehicle_brands where slug = 'volkswagen'
union all select id, 'serie-3-e90-320d', 'Série 3 E90', '320d', 'N47', 2007, 2012, 'diesel' from public.vehicle_brands where slug = 'bmw'
union all select id, 'serie-5-e60-520d', 'Série 5 E60', '520d', 'N47', 2007, 2010, 'diesel' from public.vehicle_brands where slug = 'bmw'
union all select id, 'classe-c-w204', 'Classe C W204', null, null, 2007, 2014, null from public.vehicle_brands where slug = 'mercedes-benz'
on conflict (brand_id, slug) do nothing;
-- produtos DEMO
with src(slug, sku, man, cat, title, fam, descr, cond, war, price, weight, ref, stock) as (values
 ('bosch-0281016000','DEMO-0001','bosch','motor','Bosch EDC17C46 · 0281016000','EDC17C46','Centralina de motor Bosch EDC17C46 recondicionada em laboratório. Testada em bancada e pronta a instalar.','reconditioned',12,42500,450,'0281016000',3),
 ('siemens-8e0909561','DEMO-0002','siemens-vdo','motor','Siemens Simos 3.3 · 8E0909561','Simos 3.3','Centralina Simos 3.3 usada, testada e com garantia. Compatibilidade validada por número OEM.','used_tested',6,28900,450,'8E0909561',2),
 ('continental-9678385480','DEMO-0003','continental','motor','Siemens SID807EVO · 9678385480','SID807EVO','SID807EVO reprogramável, com virginização disponível a pedido.','reconditioned',12,38000,450,'9678385480',0),
 ('delphi-28414561','DEMO-0004','delphi','motor','Delphi DCM6.2 · 28414561','DCM6.2','Delphi DCM6.2 para motores OM651. Reprogramação sob consulta.','reconditioned',12,55000,450,'28414561',2),
 ('bosch-0265231234','DEMO-0005','bosch','abs','Bosch ABS 8.0 · 0265231234','ABS 8.0','Módulo ABS 8.0 com bloco hidráulico testado em bancada.','used_tested',6,21000,800,'0265231234',4),
 ('siemens-6q0909605','DEMO-0006','siemens-vdo','airbag','Módulo airbag Siemens 5WK4 · 6Q0909605','5WK4','Módulo airbag com crash data apagada, pronto a instalar.','reconditioned',12,9500,450,'6Q0909605',6),
 ('aisin-09g927750','DEMO-0007','aisin','transmissao','TCU Aisin TF-60SN · 09G927750','TF-60SN','TCU para caixa automática TF-60SN. Requer adaptação no veículo.','reconditioned',12,64500,450,'09G927750',0),
 ('continental-3c0937049','DEMO-0008','continental','conforto','BCM Volkswagen Passat B6 · 3C0937049','BCM PQ46','Body Control Module testado com VCDS.','used_tested',6,17500,450,'3C0937049',2),
 ('continental-5wy7000b','DEMO-0009','continental','imobilizador','Imobilizador Kessy Audi A6 C6 · 5WY7000B','Kessy','Módulo Kessy virgem, pronto a codificar ao veículo.','reconditioned',12,32000,450,'5WY7000B',1),
 ('bosch-03l906023','DEMO-0010','bosch','motor','Bosch EDC17CP14 · 03L906023','EDC17CP14','Recondicionada e testada em bancada. Atualização de software sob pedido.','reconditioned',12,46000,450,'03L906023',3),
 ('bosch-0281017946','DEMO-0011','bosch','motor','Bosch EDC17C64 · 0281017946','EDC17C64','EDC17C64 testada em bancada. Reprogramação sob consulta.','reconditioned',12,49500,450,'0281017946',2),
 ('hella-a0009003802','DEMO-0012','hella','conforto','Módulo SAM Mercedes W204 · A0009003802','SAM W204','SAM traseiro para W204. Codificação sob consulta.','used_tested',6,28000,450,'A0009003802',0)
), ins as (
  insert into public.products (slug, sku, manufacturer_id, category_id, title, ecu_family, description, condition, warranty_months, price_cents, weight_grams, is_active)
  select s.slug, s.sku, m.id, c.id, s.title, s.fam, s.descr, s.cond::public.product_condition, s.war, s.price, s.weight, true
  from src s join public.ecu_manufacturers m on m.slug = s.man join public.categories c on c.slug = s.cat
  on conflict (slug) do nothing
  returning id, slug
), refs as (
  insert into public.product_references (product_id, type, value, is_primary)
  select ins.id, 'hardware', s.ref, true from ins join src s on s.slug = ins.slug
  returning product_id
)
insert into public.inventory_movements (product_id, delta, reason, note)
select ins.id, s.stock, 'import', 'seed demo' from ins join src s on s.slug = ins.slug where s.stock > 0;

with comp(pslug, bslug, mslug) as (values
 ('bosch-0281016000','volkswagen','golf-vi-2-0-tdi'), ('bosch-0281016000','volkswagen','passat-b7-2-0-tdi'),
 ('siemens-8e0909561','audi','a4-b6-1-8-t'),
 ('continental-9678385480','peugeot','308-1-6-hdi'), ('continental-9678385480','peugeot','3008-1-6-hdi'), ('continental-9678385480','ford','focus-1-6-tdci'),
 ('delphi-28414561','mercedes-benz','classe-c-w204-c220-cdi'), ('delphi-28414561','mercedes-benz','classe-e-w212-e220-cdi'),
 ('bosch-0265231234','volkswagen','golf-v'), ('bosch-0265231234','volkswagen','touran'),
 ('siemens-6q0909605','seat','ibiza-6l'), ('siemens-6q0909605','skoda','fabia-i'),
 ('aisin-09g927750','audi','a3-8p-2-0-tdi'),
 ('continental-3c0937049','volkswagen','passat-b6'),
 ('continental-5wy7000b','audi','a6-c6'),
 ('bosch-03l906023','volkswagen','passat-b7-2-0-tdi'), ('bosch-03l906023','volkswagen','tiguan-2-0-tdi'),
 ('bosch-0281017946','bmw','serie-3-e90-320d'), ('bosch-0281017946','bmw','serie-5-e60-520d'),
 ('hella-a0009003802','mercedes-benz','classe-c-w204')
)
insert into public.product_compatibility (product_id, vehicle_model_id)
select p.id, vm.id from comp
join public.products p on p.slug = comp.pslug
join public.vehicle_brands vb on vb.slug = comp.bslug
join public.vehicle_models vm on vm.brand_id = vb.id and vm.slug = comp.mslug
on conflict do nothing;

-- Tarifas de envio INDICATIVAS — ajustar aos preços reais das transportadoras.
do $$
declare z uuid;
begin
  if exists (select 1 from public.shipping_zones) then return; end if;
  insert into public.shipping_zones (name, country_codes) values ('Portugal', array['PT']::char(2)[]) returning id into z;
  insert into public.shipping_rates (zone_id, carrier, service_level, min_weight_g, max_weight_g, price_cents, est_days_min, est_days_max) values (z, 'CTT Expresso', 'standard', 0, 30000, 690, 2, 3);
  insert into public.shipping_rates (zone_id, carrier, service_level, min_weight_g, max_weight_g, price_cents, est_days_min, est_days_max) values (z, 'CTT Expresso 13h', 'express', 0, 30000, 1190, 1, 1);
  insert into public.shipping_zones (name, country_codes) values ('Espanha', array['ES']::char(2)[]) returning id into z;
  insert into public.shipping_rates (zone_id, carrier, service_level, min_weight_g, max_weight_g, price_cents, est_days_min, est_days_max) values (z, 'DPD Classic', 'standard', 0, 30000, 1290, 2, 4);
  insert into public.shipping_rates (zone_id, carrier, service_level, min_weight_g, max_weight_g, price_cents, est_days_min, est_days_max) values (z, 'DHL Express', 'express', 0, 30000, 1990, 1, 2);
  insert into public.shipping_zones (name, country_codes) values ('União Europeia', array['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','RO','SK','SI','SE']::char(2)[]) returning id into z;
  insert into public.shipping_rates (zone_id, carrier, service_level, min_weight_g, max_weight_g, price_cents, est_days_min, est_days_max) values (z, 'DPD Classic', 'standard', 0, 30000, 1990, 3, 6);
  insert into public.shipping_rates (zone_id, carrier, service_level, min_weight_g, max_weight_g, price_cents, est_days_min, est_days_max) values (z, 'DHL Express', 'express', 0, 30000, 3490, 1, 3);
  insert into public.shipping_zones (name, country_codes) values ('Europa (fora da UE)', array['GB','CH','NO','IS','AL','BA','RS','ME','MK','TR','UA','MD','LI','AD','MC','SM']::char(2)[]) returning id into z;
  insert into public.shipping_rates (zone_id, carrier, service_level, min_weight_g, max_weight_g, price_cents, est_days_min, est_days_max) values (z, 'DHL Express', 'express', 0, 30000, 4990, 2, 5);
  insert into public.shipping_zones (name, country_codes) values ('Resto do mundo', array['US','CA','BR','AO','MZ','CV','ST','GW','MA','TN','AE','SA','IL','AU','NZ','ZA','MX','AR','CL','CO']::char(2)[]) returning id into z;
  insert into public.shipping_rates (zone_id, carrier, service_level, min_weight_g, max_weight_g, price_cents, est_days_min, est_days_max) values (z, 'DHL Express Worldwide', 'express', 0, 30000, 7990, 3, 8);
end $$;
