-- Migración: soporte para importar leads de Meta (Facebook/Instagram Lead Ads)
-- Ejecutar en Supabase → SQL Editor → New query → pegar todo → Run

-- 1. Columna para identificar de forma única cada lead de Meta y no duplicarlo
alter table leads
  add column if not exists meta_lead_id text unique;

-- 2. Columna para saber de qué anuncio/campaña vino el lead
alter table leads
  add column if not exists origen text;

-- 3. Índice para que la búsqueda de duplicados sea rápida
create index if not exists idx_leads_meta_lead_id on leads (meta_lead_id);
