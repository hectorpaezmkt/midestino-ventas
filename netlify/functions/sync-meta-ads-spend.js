import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────
// Variables de entorno necesarias (Netlify → Environment variables):
// META_AD_ACCOUNT_ID  → el ID de la cuenta publicitaria SIN el prefijo "act_"
// META_ACCESS_TOKEN   → token de acceso con permiso ads_read / read_insights
//                        (idealmente un token de Usuario del Sistema, que no expira)
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY → los mismos que ya usa sync-meta-leads
// ─────────────────────────────────────────────────────────────
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN
const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export const handler = async () => {
  if (!AD_ACCOUNT_ID || !ACCESS_TOKEN || !SUPABASE_URL || !SERVICE_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          'Faltan variables de entorno de Meta Ads (META_AD_ACCOUNT_ID, META_ACCESS_TOKEN).',
      }),
    }
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  const fields = 'campaign_id,campaign_name,spend,impressions,clicks,date_start'
  const url = `https://graph.facebook.com/v20.0/act_${AD_ACCOUNT_ID}/insights?level=campaign&time_increment=1&date_preset=last_30d&fields=${fields}&access_token=${ACCESS_TOKEN}`

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
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'No se pudo consultar la API de Meta Ads.', detalle: err.message }),
    }
  }

  if (filas.length === 0) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actualizados: 0 }),
    }
  }

  const { error } = await supabase.from('gasto_ads').upsert(filas, { onConflict: 'fecha,campaign_id' })

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actualizados: filas.length }),
  }
}
