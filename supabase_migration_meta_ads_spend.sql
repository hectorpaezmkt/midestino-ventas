-- Migración: gasto real de Meta Ads discriminado por día y campaña
-- Ejecutar en Supabase → SQL Editor → New query → pegar todo → Run

-- Aseguramos que la tabla exista con la estructura completa
-- (si ya existía con "gasto" y "leads_generados", esto solo agrega lo que falta)
create table if not exists gasto_ads (
  id uuid primary key default gen_random_uuid(),
  gasto numeric not null default 0,
  leads_generados integer default 0,
  created_at timestamptz not null default now()
);

alter table gasto_ads add column if not exists fecha date;
alter table gasto_ads add column if not exists campaign_id text;
alter table gasto_ads add column if not exists campaign_name text;
alter table gasto_ads add column if not exists impresiones integer;
alter table gasto_ads add column if not exists clics integer;
alter table gasto_ads add column if not exists fuente text default 'manual'; -- 'manual' | 'meta_api'

-- Evita duplicar el mismo día+campaña cuando se vuelve a sincronizar
-- (las filas manuales con campaign_id null nunca chocan entre sí)
create unique index if not exists idx_gasto_ads_fecha_campaign on gasto_ads (fecha, campaign_id);

alter table gasto_ads enable row level security;
drop policy if exists "allow all gasto_ads" on gasto_ads;
create policy "allow all gasto_ads" on gasto_ads for all using (true) with check (true);

-- Guardamos campaña/anuncio de origen en cada lead como columnas propias
-- (antes solo estaba combinado como texto libre en "origen")
alter table leads add column if not exists campaign_name text;
alter table leads add column if not exists ad_name text;
