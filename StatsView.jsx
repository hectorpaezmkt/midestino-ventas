import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { ESTADOS, formatARS, formatFecha, whatsappLink } from '../constants'
import EstadoBadge from './EstadoBadge'
import { useToast } from './Toast'

export default function LeadDetailSheet({ lead, onClose }) {
  const [estado, setEstado] = useState(lead.estado)
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)
  const [historial, setHistorial] = useState([])
  const [loadingHist, setLoadingHist] = useState(true)
  const showToast = useToast()

  useEffect(() => {
    let active = true
    setLoadingHist(true)
    supabase
      .from('seguimientos')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (!error) setHistorial(data || [])
        setLoadingHist(false)
      })
    return () => {
      active = false
    }
  }, [lead.id])

  const mensajeWhatsapp = `¡Hola${lead.nombre_completo ? ` ${lead.nombre_completo.split(' ')[0]}` : ''}! Te escribo de Mi Destino Viajes 😊`
  const link = whatsappLink(lead.telefono, mensajeWhatsapp)

  async function guardarCambios() {
    const estadoCambio = estado !== lead.estado
    const hayNota = nota.trim().length > 0

    if (!estadoCambio && !hayNota) {
      onClose()
      return
    }

    setSaving(true)
    try {
      if (estadoCambio) {
        const { error: errLead } = await supabase
          .from('leads')
          .update({ estado, updated_at: new Date().toISOString() })
          .eq('id', lead.id)
        if (errLead) throw errLead
      }

      if (estadoCambio || hayNota) {
        const { error: errSeg } = await supabase.from('seguimientos').insert({
          lead_id: lead.id,
          nota: hayNota ? nota.trim() : estadoCambio ? `Cambio de estado a "${estado}"` : '',
          estado_anterior: estadoCambio ? lead.estado : null,
          estado_nuevo: estadoCambio ? estado : null,
        })
        if (errSeg) throw errSeg
      }

      showToast('Guardado ✓')
      onClose()
    } catch (err) {
      console.error(err)
      showToast('No se pudo guardar. Probá de nuevo.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />

        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{lead.nombre_completo || 'Sin nombre'}</h2>
            <p className="text-sm text-slate-500">
              {lead.institucion || 'Sin institución'}
              {lead.nivel ? ` · ${lead.nivel}` : ''}
            </p>
          </div>
          <EstadoBadge estado={lead.estado} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Info label="Teléfono" value={lead.telefono || '—'} />
          <Info label="Alumnos" value={lead.cantidad_alumnos ?? '—'} />
          <Info label="Destino interés" value={lead.destino_interes || '—'} />
          <Info label="Fecha tentativa" value={formatFecha(lead.fecha_tentativa)} />
          <Info label="Monto total" value={formatARS(lead.monto_total)} />
          <Info label="Señado" value={formatARS(lead.monto_senado)} />
        </div>

        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 font-semibold text-white shadow-sm active:scale-[0.99] transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.67c2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.55-3.7 8.25-8.24 8.25a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.37c0-4.55 3.7-8.26 8.25-8.26m-4.6 4.74c-.16 0-.43.06-.65.31s-.86.84-.86 2.05.88 2.38 1 2.54 1.74 2.78 4.28 3.79c2.12.84 2.55.67 3.01.63s1.49-.6 1.7-1.19.21-1.08.15-1.19-.23-.17-.48-.3-1.49-.74-1.72-.82-.4-.13-.57.13-.65.82-.8.98-.29.19-.55.06a6.9 6.9 0 0 1-2.03-1.25 7.6 7.6 0 0 1-1.41-1.75c-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44s.16-.25.24-.42.04-.31-.02-.44-.57-1.38-.79-1.88c-.2-.5-.41-.43-.57-.43z" />
            </svg>
            Abrir WhatsApp
          </a>
        )}

        <div className="mt-5">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Cambiar estado
          </label>
          <div className="flex flex-wrap gap-2">
            {ESTADOS.map((e) => (
              <button
                key={e.value}
                onClick={() => setEstado(e.value)}
                className="rounded-full px-3 py-1.5 text-xs font-semibold transition"
                style={{
                  color: estado === e.value ? '#fff' : e.color,
                  backgroundColor: estado === e.value ? e.color : e.bg,
                  outline: estado === e.value ? `2px solid ${e.color}` : 'none',
                  outlineOffset: '1px',
                }}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Dejar una nota
          </label>
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej: habló con la directora, vuelve a llamar el viernes…"
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
          />
        </div>

        <button
          onClick={guardarCambios}
          disabled={saving}
          className="mt-4 w-full rounded-xl bg-orange py-3 font-semibold text-white shadow-sm active:scale-[0.99] transition disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>

        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Historial</p>
          {loadingHist ? (
            <p className="text-sm text-slate-400">Cargando…</p>
          ) : historial.length === 0 ? (
            <p className="text-sm text-slate-400">Sin seguimientos todavía.</p>
          ) : (
            <ul className="space-y-2">
              {historial.map((h) => (
                <li key={h.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                  {h.estado_nuevo && (
                    <p className="mb-1 text-xs font-semibold text-teal-dark">
                      Estado → {h.estado_nuevo.replace('_', ' ')}
                    </p>
                  )}
                  {h.nota && <p className="text-slate-700">{h.nota}</p>}
                  <p className="mt-1 text-[11px] text-slate-400">
                    {new Date(h.created_at).toLocaleString('es-AR')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button onClick={onClose} className="mt-5 w-full py-2 text-sm font-medium text-slate-400">
          Cerrar
        </button>
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="truncate font-semibold text-slate-700">{value}</p>
    </div>
  )
}
