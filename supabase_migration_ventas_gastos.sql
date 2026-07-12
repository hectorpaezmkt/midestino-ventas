-- Migración: Ventas, Pagos, Gastos y estado de sincronización con Meta
-- Ejecutar en Supabase → SQL Editor → New query → pegar todo → Run

-- ─────────────────────────────────────────────
-- VENTAS
-- ─────────────────────────────────────────────
create table if not exists ventas (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete set null,
  cliente_nombre text not null,
  telefono text,
  institucion text,
  destino text,
  cantidad_alumnos integer,
  monto_total numeric not null default 0,
  monto_senado numeric not null default 0,
  fecha_viaje date,
  estado_pago text not null default 'senado', -- senado | pagando | pagado | cancelado
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ventas_lead_id on ventas (lead_id);
create index if not exists idx_ventas_fecha_viaje on ventas (fecha_viaje);

-- ─────────────────────────────────────────────
-- PAGOS (cuotas/abonos además de la seña inicial)
-- ─────────────────────────────────────────────
create table if not exists pagos (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references ventas(id) on delete cascade,
  monto numeric not null,
  fecha date not null default current_date,
  nota text,
  created_at timestamptz not null default now()
);

create index if not exists idx_pagos_venta_id on pagos (venta_id);

-- ─────────────────────────────────────────────
-- GASTOS (generales del negocio o atados a una venta)
-- ─────────────────────────────────────────────
create table if not exists gastos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'general', -- general | venta
  venta_id uuid references ventas(id) on delete set null,
  categoria text not null default 'otro',
  descripcion text,
  monto numeric not null default 0,
  fecha date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_gastos_venta_id on gastos (venta_id);
create index if not exists idx_gastos_fecha on gastos (fecha);

-- ─────────────────────────────────────────────
-- LOG DE SINCRONIZACIÓN CON META (para mostrar el estado de conexión)
-- ─────────────────────────────────────────────
create table if not exists sync_log (
  id uuid primary key default gen_random_uuid(),
  fuente text not null default 'meta_ads',
  ran_at timestamptz not null default now(),
  creados integer default 0,
  omitidos integer default 0,
  errores jsonb,
  ok boolean default true
);

-- ─────────────────────────────────────────────
-- Permisos: réplica del mismo esquema abierto que ya usan "leads" y
-- "mensajes" (la app no tiene login propio, es de uso interno del equipo).
-- Si tus políticas de RLS son distintas, ajustá estas líneas.
-- ─────────────────────────────────────────────
alter table ventas enable row level security;
alter table pagos enable row level security;
alter table gastos enable row level security;
alter table sync_log enable row level security;

create policy "allow all ventas" on ventas for all using (true) with check (true);
create policy "allow all pagos" on pagos for all using (true) with check (true);
create policy "allow all gastos" on gastos for all using (true) with check (true);
create policy "allow read sync_log" on sync_log for select using (true);
