import { createClient } from '@supabase/supabase-js'
import Papa from 'papaparse'

// ─────────────────────────────────────────────────────────────
// Variables de entorno (configurar en Netlify → Site settings →
// Environment variables). Nunca van hardcodeadas acá.
// ─────────────────────────────────────────────────────────────
const SHEET_ID = process.env.META_SHEET_ID
const SHEET_GID = process.env.META_SHEET_GID
const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const MESES = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
  agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
}

function quitarAcentos(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Intenta sacar un número de alumnos de una respuesta libre. Si no hay
// dígitos (ej: "familiar"), devuelve null y el texto crudo queda en la nota.
function parseAlumnos(raw) {
  if (!raw) return null
  const m = raw.match(/\d+/)
  return m ? parseInt(m[0], 10) : null
}

// Intenta interpretar fechas tipo "10/06/2026" o "20 de agosto". Si la
// respuesta es algo como "sí" / "no" / "familiar", devuelve null.
function parseFecha(raw) {
  if (!raw) return null
  const t = raw.trim().toLowerCase()

  let m = t.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (m) {
    const [, d, mo, y] = m
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  m = t.match(/(\d{1,2})\s*de\s*([a-záéíóúñ]+)/)
  if (m) {
    const dia = m[1].padStart(2, '0')
    const mes = MESES[quitarAcentos(m[2])]
    if (mes) {
      const now = new Date()
      let year = now.getFullYear()
      const candidato = new Date(`${year}-${String(mes).padStart(2, '0')}-${dia}`)
      if (candidato < now) year += 1
      return `${year}-${String(mes).padStart(2, '0')}-${dia}`
    }
  }

  return null
}

function limpiarTelefono(raw) {
  if (!raw) return null
  return raw.replace(/^p:/i, '').trim()
}

export const handler = async () => {
  if (!SHEET_ID || !SHEET_GID || !SUPABASE_URL || !SERVICE_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          'Faltan variables de entorno (META_SHEET_ID, META_SHEET_GID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).',
      }),
    }
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`

  let csvText
  try {
    const resp = await fetch(csvUrl)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    csvText = await resp.text()
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({
        error:
          'No se pudo leer el Google Sheet. Confirmá que esté compartido como "Cualquiera con el enlace - Lector".',
        detalle: err.message,
      }),
    }
  }

  const { data: rows } = Papa.parse(csvText, { header: true, skipEmptyLines: true })

  let creados = 0
  let omitidos = 0
  const errores = []

  for (const row of rows) {
    const metaId = row['id']?.trim()
    if (!metaId) continue

    const { data: existentes, error: errCheck } = await supabase
      .from('leads')
      .select('id')
      .eq('meta_lead_id', metaId)
      .limit(1)

    if (errCheck) {
      errores.push(`${metaId}: ${errCheck.message}`)
      continue
    }
    if (existentes && existentes.length > 0) {
      omitidos++
      continue
    }

    const alumnosRaw = row['¿cuántos_alumnos_son_aproximadamente?'] || ''
    const fechaRaw = row['¿tienen_una_fecha_tentativa_para_viajar?'] || ''
    const institucionRaw = row['¿cuál_es_el_nombre_y_localidad_de_la_institución?'] || ''
    const nombre = row['nombre_completo']?.trim() || 'Sin nombre'
    const telefono = limpiarTelefono(row['phone_number'])
    const origen = [row['ad_name'], row['campaign_name']].filter(Boolean).join(' · ')

    const nuevoLead = {
      nombre_completo: nombre,
      telefono,
      institucion: institucionRaw.trim() || null,
      cantidad_alumnos: parseAlumnos(alumnosRaw),
      fecha_tentativa: parseFecha(fechaRaw),
      destino_interes: row['ad_name'] || null,
      estado: 'nuevo',
      meta_lead_id: metaId,
      origen: origen || null,
    }

    const { data: inserted, error: errInsert } = await supabase
      .from('leads')
      .insert(nuevoLead)
      .select('id')
      .single()

    if (errInsert) {
      errores.push(`${metaId}: ${errInsert.message}`)
      continue
    }

    const notaPartes = [`Lead importado automáticamente de Meta (${row['platform'] || 'fb'}).`]
    if (alumnosRaw) notaPartes.push(`Alumnos (respuesta original): "${alumnosRaw}"`)
    if (fechaRaw) notaPartes.push(`Fecha tentativa (respuesta original): "${fechaRaw}"`)
    if (institucionRaw) notaPartes.push(`Institución/localidad (respuesta original): "${institucionRaw}"`)
    if (row['inbox_url']) notaPartes.push(`Chat de Meta: ${row['inbox_url']}`)

    await supabase.from('seguimientos').insert({
      lead_id: inserted.id,
      nota: notaPartes.join('\n'),
      estado_anterior: null,
      estado_nuevo: 'nuevo',
    })

    creados++
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creados, omitidos, errores, total_filas: rows.length }),
  }
}
