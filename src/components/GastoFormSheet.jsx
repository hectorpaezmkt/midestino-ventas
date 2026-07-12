import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { GASTO_CATEGORIAS } from '../constants'
import { useToast } from './Toast'

export default function GastoFormSheet({ onClose, ventas = [] }) {
  const [tipo, setTipo] = useState('general')
  const [ventaId, setVentaId] = useState('')
  const [categoria, setCategoria] = useState('otro')
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const showToast = useToast()

  async function crear() {
    if (!monto || Number(monto) <= 0) {
      showToast('Ingresá un monto válido', 'error')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('gastos').insert({
        tipo,
        venta_id: tipo === 'venta' ? ventaId || null : null,
        categoria,
        descripcion: descripcion.trim() || null,
        monto: Number(monto),
        fecha,
      })
      if (error) throw error
      showToast('Gasto registrado ✓')
      onClose()
    } catch (err) {
      console.error(err)
      showToast('No se pudo guardar el gasto', 'error')
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
        <h2 className="text-lg font-bold text-slate-800">Nuevo gasto</h2>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo</label>
          <div className="flex gap-2">
            <button
              onClick={() => setTipo('general')}
              className="flex-1 rounded-xl py-2 text-sm font-semibold transition"
              style={{
                backgroundColor: tipo === 'general' ? '#FE7203' : '#FFEDDC',
                color: tipo === 'general' ? '#fff' : '#D45F00',
              }}
            >
              General
            </button>
            <button
              onClick={() => setTipo('venta')}
              className="flex-1 rounded-xl py-2 text-sm font-semibold transition"
              style={{
                backgroundColor: tipo === 'venta' ? '#FE7203' : '#FFEDDC',
                color: tipo === 'venta' ? '#fff' : '#D45F00',
              }}
            >
              Por venta
            </button>
          </div>
        </div>

        {tipo === 'venta' && (
          <label className="mt-4 block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Venta asociada
            </span>
            <select
              value={ventaId}
              onChange={(e) => setVentaId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Seleccionar…</option>
              {ventas.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.cliente_nombre} · {v.destino}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="mt-4 block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">Categoría</span>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            {GASTO_CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Descripción
          </span>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: nafta viaje Termas 28/06"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal focus:outline-none"
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">Monto</span>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">Fecha</span>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal focus:outline-none"
            />
          </label>
        </div>

        <button
          onClick={crear}
          disabled={saving}
          className="mt-5 w-full rounded-xl bg-orange py-3 font-semibold text-white shadow-sm active:scale-[0.99] transition disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar gasto'}
        </button>
        <button onClick={onClose} className="mt-2 w-full py-2 text-sm font-medium text-slate-400">
          Cancelar
        </button>
      </div>
    </div>
  )
}
