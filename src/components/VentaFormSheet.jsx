import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useToast } from './Toast'

export default function VentaFormSheet({ onClose, lead = null, onCreated }) {
  const [form, setForm] = useState({
    cliente_nombre: lead?.nombre_completo || '',
    telefono: lead?.telefono || '',
    institucion: lead?.institucion || '',
    destino: lead?.destino_interes || '',
    cantidad_alumnos: lead?.cantidad_alumnos || '',
    monto_total: lead?.monto_total || '',
    monto_senado: lead?.monto_senado || '',
    fecha_viaje: lead?.fecha_tentativa || '',
  })
  const [saving, setSaving] = useState(false)
  const showToast = useToast()

  async function crear() {
    if (!form.cliente_nombre.trim()) {
      showToast('Ingresá el nombre del cliente', 'error')
      return
    }
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('ventas')
        .insert({
          ...form,
          lead_id: lead?.id || null,
          cantidad_alumnos: form.cantidad_alumnos ? Number(form.cantidad_alumnos) : null,
          monto_total: Number(form.monto_total) || 0,
          monto_senado: Number(form.monto_senado) || 0,
          fecha_viaje: form.fecha_viaje || null,
          estado_pago: 'senado',
        })
        .select()
        .single()
      if (error) throw error

      if (lead?.id) {
        await supabase
          .from('leads')
          .update({ estado: 'senado', updated_at: new Date().toISOString() })
          .eq('id', lead.id)
        await supabase.from('seguimientos').insert({
          lead_id: lead.id,
          nota: 'Convertido a venta.',
          estado_anterior: lead.estado,
          estado_nuevo: 'senado',
        })
      }

      showToast('Venta creada ✓')
      onCreated?.(data)
      onClose()
    } catch (err) {
      console.error(err)
      showToast('No se pudo crear la venta', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
        <h2 className="text-lg font-bold text-slate-800">{lead ? 'Convertir a venta' : 'Nueva venta'}</h2>
        {lead && <p className="text-sm text-slate-500">Se va a vincular al lead de {lead.nombre_completo}.</p>}

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Field label="Cliente" value={form.cliente_nombre} onChange={(v) => setForm({ ...form, cliente_nombre: v })} />
          <Field label="Teléfono" value={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} />
          <Field label="Institución" value={form.institucion} onChange={(v) => setForm({ ...form, institucion: v })} />
          <Field label="Destino" value={form.destino} onChange={(v) => setForm({ ...form, destino: v })} />
          <Field
            label="Alumnos"
            type="number"
            value={form.cantidad_alumnos}
            onChange={(v) => setForm({ ...form, cantidad_alumnos: v })}
          />
          <Field
            label="Fecha de viaje"
            type="date"
            value={form.fecha_viaje}
            onChange={(v) => setForm({ ...form, fecha_viaje: v })}
          />
          <Field
            label="Monto total"
            type="number"
            value={form.monto_total}
            onChange={(v) => setForm({ ...form, monto_total: v })}
          />
          <Field
            label="Seña"
            type="number"
            value={form.monto_senado}
            onChange={(v) => setForm({ ...form, monto_senado: v })}
          />
        </div>

        <button
          onClick={crear}
          disabled={saving}
          className="mt-5 w-full rounded-xl bg-orange py-3 font-semibold text-white shadow-sm active:scale-[0.99] transition disabled:opacity-60"
        >
          {saving ? 'Creando…' : 'Crear venta'}
        </button>
        <button onClick={onClose} className="mt-2 w-full py-2 text-sm font-medium text-slate-400">
          Cancelar
        </button>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
      />
    </label>
  )
}
