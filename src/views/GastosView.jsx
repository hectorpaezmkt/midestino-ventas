import { useMemo, useState } from 'react'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { GASTO_CATEGORIAS, GASTO_CATEGORIA_MAP, formatARS, formatFecha } from '../constants'
import GastoFormSheet from '../components/GastoFormSheet'
import { supabase } from '../supabaseClient'
import { useToast } from '../components/Toast'

export default function GastosView() {
  const { rows: gastos, loading } = useRealtimeTable('gastos', { order: 'fecha', ascending: false })
  const { rows: ventas } = useRealtimeTable('ventas')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [creando, setCreando] = useState(false)
  const showToast = useToast()

  const ventaPorId = useMemo(() => Object.fromEntries(ventas.map((v) => [v.id, v])), [ventas])

  const filtered = useMemo(() => {
    return gastos.filter((g) => {
      if (filtroTipo !== 'todos' && g.tipo !== filtroTipo) return false
      if (filtroCategoria !== 'todas' && g.categoria !== filtroCategoria) return false
      return true
    })
  }, [gastos, filtroTipo, filtroCategoria])

  const totalMes = useMemo(() => {
    const now = new Date()
    return gastos
      .filter((g) => {
        const f = new Date(g.fecha + 'T00:00:00')
        return f.getMonth() === now.getMonth() && f.getFullYear() === now.getFullYear()
      })
      .reduce((a, g) => a + Number(g.monto || 0), 0)
  }, [gastos])

  const totalGeneral = gastos.reduce((a, g) => a + Number(g.monto || 0), 0)

  async function eliminar(id) {
    if (!confirm('¿Eliminar este gasto?')) return
    const { error } = await supabase.from('gastos').delete().eq('id', id)
    if (error) showToast('No se pudo eliminar', 'error')
    else showToast('Gasto eliminado')
  }

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Gastos</h1>
          <p className="text-sm text-slate-500">{gastos.length} registrados</p>
        </div>
        <button
          onClick={() => setCreando(true)}
          className="shrink-0 rounded-xl bg-orange px-3 py-2 text-xs font-semibold text-white active:scale-[0.97] transition"
        >
          + Nuevo gasto
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniStat label="Este mes" value={formatARS(totalMes)} />
        <MiniStat label="Histórico" value={formatARS(totalGeneral)} />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        <Chip active={filtroTipo === 'todos'} onClick={() => setFiltroTipo('todos')} label="Todos" />
        <Chip active={filtroTipo === 'general'} onClick={() => setFiltroTipo('general')} label="Generales" />
        <Chip active={filtroTipo === 'venta'} onClick={() => setFiltroTipo('venta')} label="Por venta" />
      </div>

      <select
        value={filtroCategoria}
        onChange={(e) => setFiltroCategoria(e.target.value)}
        className="mt-3 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 focus:border-teal focus:outline-none"
      >
        <option value="todas">Todas las categorías</option>
        {GASTO_CATEGORIAS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      <div className="mt-4 space-y-3 pb-24">
        {loading ? (
          <p className="py-10 text-center text-sm text-slate-400">Cargando gastos…</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No hay gastos que coincidan.</p>
        ) : (
          filtered.map((g) => (
            <div key={g.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">
                    {g.descripcion || GASTO_CATEGORIA_MAP[g.categoria]?.label}
                  </p>
                  <p className="text-xs text-slate-400">
                    {GASTO_CATEGORIA_MAP[g.categoria]?.label || g.categoria}
                    {g.tipo === 'venta' && ventaPorId[g.venta_id] ? ` · ${ventaPorId[g.venta_id].cliente_nombre}` : ''}
                  </p>
                </div>
                <span className="font-bold text-orange-dark">{formatARS(g.monto)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>{formatFecha(g.fecha)}</span>
                <button onClick={() => eliminar(g.id)} className="font-medium text-red-500">
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {creando && <GastoFormSheet onClose={() => setCreando(false)} ventas={ventas} />}
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2.5 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-slate-700">{value}</p>
    </div>
  )
}

function Chip({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition"
      style={active ? { backgroundColor: '#FE7203', color: '#fff' } : { backgroundColor: '#FFEDDC', color: '#D45F00' }}
    >
      {label}
    </button>
  )
}
