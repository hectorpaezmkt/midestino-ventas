-- Fix: agregar el estado 'no_sirve' (leads basura / spam) al constraint
-- Ejecutar en Supabase → SQL Editor → New query → pegar todo → Run

alter table leads drop constraint if exists leads_estado_check;

alter table leads add constraint leads_estado_check check (
  estado in (
    'nuevo',
    'contactado',
    'no_contesta',
    'quiere_viajar',
    'por_senar',
    'senado',
    'viajo',
    'perdido',
    'no_sirve',
    'personalizado'
  )
);
