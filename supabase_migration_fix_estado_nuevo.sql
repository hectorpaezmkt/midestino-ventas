-- Fix: el constraint de "leads.estado" no incluía el valor 'nuevo'
-- (el estado que usan los leads importados automáticamente de Meta).
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
    'personalizado'
  )
);
