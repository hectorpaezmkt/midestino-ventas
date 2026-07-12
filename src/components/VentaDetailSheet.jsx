import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { VENTA_ESTADOS, VENTA_ESTADO_MAP, formatARS, formatFecha, whatsappLink } from '../constants'
import EstadoBadge from './EstadoBadge'
import { useToast } from './Toast'

export default function VentaDetailSheet({ venta, onClose }) {
  const [form, setForm] = useState({
    cliente_nombre: venta.cliente_nombre || '',
    telefono: venta.telefono || '',
    institucion: venta.institucion || '',
    destino: venta.destino || '',
    cantidad_alumnos: venta.cantidad_alumnos || '',
    monto_total: venta.monto_total || 0,
    monto_senado: venta.monto_senado || 0,
    fecha_viaje: venta.fecha_viaje || '',
    estado_pago: venta.estado_pago || 'senado',
  })
  const [pagos, setPagos] = useState([])
  const [loadingPagos, setLoadingPagos] = useState(true)
  const [montoPago, setMontoPago] = useState('')
  const [notaPago, setNotaPago] = useState('')
  const [saving, setSaving] = useState(false)
  const showToast = useToast()

  useEffect(() => {
    let activo = true
    setLoadingPagos(true)
    supabase
      .from('pagos')
      .select('*')
      .eq('venta_id', venta.id)
      .order('fecha', { ascending: false })
      .then(({ data, error }) => {
        if (!activo) return
        if (!error) setPagos(data || [])
        setLoadingPagos(false)
      })
    return () => {
      activo = false
    }
  }, [venta.id])

  const totalPagos = pagos.reduce((a, p) => a + Number(p.monto || 0), 0)
  const totalCobrado = Number(form.monto_senado || 0) + totalPagos
  const saldo = Number(form.monto_total || 0) - totalCobrado

  const link = whatsappLink(form.telefono, `¡Hola${form.cliente_nombre ? ` ${form.cliente_nombre.split(' ')[0]}` : ''}! Te escribo de Mi Destino Viajes 😊`)

  async function guardar() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('ventas')
        .update({
          ...form,
          cantidad_alumnos: form.cantidad_alumnos ? Number(form.cantidad_alumnos) : null,
          monto_total: Number(form.monto_total) || 0,
          monto_senado: Number(form.monto_senado) || 0,
          fecha_viaje: form.fecha_viaje || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', venta.id)
      if (error) throw error
      showToast('Venta actualizada ✓')
      onClose()
    } catch (err) {
      console.error(err)
      showToast('No se pudo guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function agregarPago() {
    const monto = Number(montoPago)
    if (!monto || monto <= 0) {
      showToast('Ingresá un monto válido', 'error')
      return
    }
    const { data, error } = await supabase
      .from('pagos')
      .insert({ venta_id: venta.id, monto, nota: notaPago.trim() || null })
      .select()
      .single()
    if (error) {
      showToast('No se pudo registrar el pago', 'error')
      return
    }
    setPagos((p) => [data, ...p])
    setMontoPago('')
    setNotaPago('')
    showToast('Pago registrado ✓')
  }

  async function eliminarVenta() {
    if (!confirm('¿Eliminar esta venta? Esta acción no se puede deshacer.')) return
    const { error } = await supabase.from('ventas').delete().eq('id', venta.id)
    if (error) {
      showToast('No se pudo eliminar', 'error')
      return
    }
    showToast('Venta eliminada')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />

        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-800">{form.cliente_nombre || 'Venta'}</h2>
          <EstadoBadge estado={form.estado_pago} map={VENTA_ESTADO_MAP} />
        </div>

        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-semibold text-white active:scale-[0.99] transition"
          >
            Abrir WhatsApp
          </a>
        )}

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

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Estado de pago
          </label>
          <div className="flex flex-wrap gap-2">
            {VENTA_ESTADOS.map((e) => (
              <button
                key={e.value}
                onClick={() => setForm({ ...form, estado_pago: e.value })}
                className="rounded-full px-3 py-1.5 text-xs font-semibold transition"
                style={{
                  color: form.estado_pago === e.value ? '#fff' : e.color,
                  backgroundColor: form.estado_pago === e.value ? e.color : e.bg,
                }}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={guardar}
          disabled={saving}
          className="mt-4 w-full rounded-xl bg-orange py-3 font-semibold text-white shadow-sm active:scale-[0.99] transition disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Total cobrado</span>
            <span className="font-semibold text-green-700">{formatARS(totalCobrado)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-slate-500">Saldo pendiente</span>
            <span className={`font-semibold ${saldo > 0 ? 'text-orange-dark' : 'text-green-700'}`}>
              {formatARS(Math.max(saldo, 0))}
            </span>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Registrar pago / cuota</p>
          <div className="flex gap-2">
            <input
              value={montoPago}
              onChange={(e) => setMontoPago(e.target.value)}
              type="number"
              placeholder="Monto"
              className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal focus:outline-none"
            />
            <input
              value={notaPago}
              onChange={(e) => setNotaPago(e.target.value)}
              placeholder="Nota (opcional)"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal focus:outline-none"
            />
          </div>
          <button
            onClick={agregarPago}
            className="mt-2 w-full rounded-xl bg-teal py-2.5 text-sm font-semibold text-white active:scale-[0.99] transition"
          >
            + Agregar pago
          </button>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Historial de pagos</p>
          {loadingPagos ? (
            <p className="text-sm text-slate-400">Cargando…</p>
          ) : pagos.length === 0 ? (
            <p className="text-sm text-slate-400">Solo la seña por ahora.</p>
          ) : (
            <ul className="space-y-2">
              {pagos.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-700">{formatARS(p.monto)}</p>
                    {p.nota && <p className="text-xs text-slate-400">{p.nota}</p>}
                  </div>
                  <span className="text-xs text-slate-400">{formatFecha(p.fecha)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button onClick={eliminarVenta} className="mt-6 w-full py-2 text-sm font-medium text-red-500">
          Eliminar venta
        </button>
        <button onClick={onClose} className="mt-1 w-full py-2 text-sm font-medium text-slate-400">
          Cerrar
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
