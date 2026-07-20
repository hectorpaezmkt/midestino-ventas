import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────
// Variables de entorno necesarias (Netlify → Environment variables):
// META_AD_ACCOUNT_ID  → el ID de la cuenta publicitaria SIN el prefijo "act_"
// META_ACCESS_TOKEN   → token de acceso con permiso ads_read / read_insights
//                        (idealmente un token de Usuario del Sistema, que no expira)
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY → los mismos que ya usa sync-meta-leads
// ─────────────────────────────────────────────────────────────
function fechaEnArgentina(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, partValue]))
  return `${value.year}-${value.month}-${value.day}`
}

function restarDias(fecha, dias) {
  const date = new Date(`${fecha}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() - dias)
  return date.toISOString().slice(0, 10)
}

export default async () => {
  const AD_ACCOUNT_ID = Netlify.env.get('META_AD_ACCOUNT_ID')
  const ACCESS_TOKEN = Netlify.env.get('META_ACCESS_TOKEN')
  const SUPABASE_URL = Netlify.env.get('SUPABASE_URL')
  const SERVICE_KEY = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!AD_ACCOUNT_ID || !ACCESS_TOKEN || !SUPABASE_URL || !SERVICE_KEY) {
    return Response.json(
      {
        error:
          'Faltan variables de entorno de Meta Ads (META_AD_ACCOUNT_ID, META_ACCESS_TOKEN).',
      },
      { status: 500 },
    )
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  // `date_preset=last_30d` termina en el último día completo y deja afuera hoy.
  // Una fecha explícita mantiene actualizado "Hoy" y evita que los lunes la
  // vista "Esta semana" muestre gasto $0.
  const hasta = fechaEnArgentina()
  const desde = restarDias(hasta, 30)
  const timeRange = encodeURIComponent(JSON.stringify({ since: desde, until: hasta }))
  const fields = 'campaign_id,campaign_name,spend,impressions,clicks,date_start'
  const url = `https://graph.facebook.com/v20.0/act_${AD_ACCOUNT_ID}/insights?level=campaign&time_increment=1&time_range=${timeRange}&fields=${fields}&access_token=${ACCESS_TOKEN}`

  let filas = []
  let nextUrl = url

  try {
    while (nextUrl) {
      const resp = await fetch(nextUrl)
      const json = await resp.json()
      if (json.error) throw new Error(json.error.message)

      const pagina = (json.data || []).map((d) => ({
        fecha: d.date_start,
        campaign_id: d.campaign_id,
        campaign_name: d.campaign_name,
        gasto: Number(d.spend || 0),
        impresiones: d.impressions ? Number(d.impressions) : null,
        clics: d.clicks ? Number(d.clicks) : null,
        fuente: 'meta_api',
      }))
      filas = filas.concat(pagina)

      nextUrl = json.paging?.next || null
    }
  } catch (err) {
    return Response.json(
      { error: 'No se pudo consultar la API de Meta Ads.', detalle: err.message },
      { status: 502 },
    )
  }

  if (filas.length === 0) {
    return Response.json({ actualizados: 0, desde, hasta })
  }

  const { error } = await supabase.from('gasto_ads').upsert(filas, { onConflict: 'fecha,campaign_id' })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ actualizados: filas.length, desde, hasta })
}

// Mantiene el gasto actualizado aunque nadie abra el panel.
export const config = {
  schedule: '0 * * * *',
}
