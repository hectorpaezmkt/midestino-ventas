import { createClient } from '@supabase/supabase-js'

// Mi Destino Viajes - proyecto Supabase (gwptesyunzqigtmbiddy)
// Clave pública (anon/publishable) protegida por RLS. Es segura para exponer en el cliente:
// la base no tiene login propio (app de uso interno del equipo), así que las políticas
// de la base son las que controlan el acceso a los datos, no esta clave.
const SUPABASE_URL = 'https://gwptesyunzqigtmbiddy.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cHRlc3l1bnpxaWd0bWJpZGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NDIwNTEsImV4cCI6MjA5ODQxODA1MX0.j2-OP3WFMcCdNyinTk1fp6Ox97diy3ByoxqpPR0P6AM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: { eventsPerSecond: 5 },
  },
})
