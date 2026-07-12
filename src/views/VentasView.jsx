import { useMemo, useState } from 'react'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { VENTA_ESTADOS, formatARS } from '../constants'
import VentaCard from '../components/VentaCard'
import VentaDetailSheet from '../components/VentaDetailSheet'
import VentaFormSheet from '../components/VentaFormSheet'

export default function VentasView() {
  const { rows: ventas, loading } = useRealtimeTable('ventas', { order: 'created_at', ascending: false })
  const { rows: pagos } = useRealtimeTable('pagos')
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [orden, setOrden] = useState('recientes')
  const [selected, setSelected] = useState(null)
  const [creando, setCreando] = useState(false)

  const pagosPorVenta = useMemo(() => {
    const map = {}
    pagos.forEach((p) => {
      map[p.venta_id] = (map[p.venta_id] || 0) + Number(p.monto || 0)
    })
    return map
  }, [pagos])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = ventas.filter((v) => {
      const matchEstado = filtroEstado === 'todos' || v.estado_pago === filtroEstado
      if (!matchEstado) return false
      if (!q) return true
      return (
        v.cliente_nombre?.toLowerCase().includes(q) ||
        v.destino?.toLowerCase().includes(q) ||
        v.institucion?.toLowerCase().includes(q)
      )
    })
    list = [...list].sort((a, b) => {
      if (orden === 'recientes') return new Date(b.created_at) - new Date(a.created_at)
      if (orden === 'nombre') return (a.cliente_nombre || '').localeCompare(b.cliente_nombre || '')
      if (orden === 'monto') return Number(b.monto_total || 0) - Number(a.monto_total || 0)
      if (orden === 'viaje') {
        if (!a.fecha_viaje) return 1
        if (!b.fecha_viaje) return -1
        return new Date(a.fecha_viaje) - new Date(b.fecha_viaje)
      }
      return 0
    })
    return list
  }, [ventas, search, filtroEstado, orden])

  const totales = useMemo(() => {
    const vendido = ventas.reduce((a, v) => a + Number(v.monto_total || 0), 0)
    const cobrado = ventas.reduce((a, v) => a + Number(v.monto_senado || 0) + (pagosPorVenta[v.id] || 0), 0)
    return { vendido, cobrado, pendiente: vendido - cobrado }
  }, [ventas, pagosPorVenta])

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Ventas</h1>
          <p className="text-sm text-slate-500">{ventas.length} en total</p>
        </div>
        <button
          onClick={() => setCreando(true)}
          className="shrink-0 rounded-xl bg-orange px-3 py-2 text-xs font-semibold text-white active:scale-[0.97] transition"
        >
          + Nueva venta
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniStat label="Vendido" value={formatARS(totales.vendido)} />
        <MiniStat label="Cobrado" value={formatARS(totales.cobrado)} />
        <MiniStat label="Pendiente" value={formatARS(totales.pendiente)} />
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por cliente, destino, institución…"
        className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
      />

      <div className="mt-3">
        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 focus:border-teal focus:outline-none"
        >
          <option value="recientes">Más recientes</option>
          <option value="nombre">Nombre A-Z</option>
          <option value="monto">Monto mayor</option>
          <option value="viaje">Fecha de viaje</option>
        </select>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        <Chip active={filtroEstado === 'todos'} onClick={() => setFiltroEstado('todos')} label="Todos" />
        {VENTA_ESTADOS.map((e) => (
          <Chip
            key={e.value}
            active={filtroEstado === e.value}
            onClick={() => setFiltroEstado(e.value)}
            label={e.label}
            color={e.color}
            bg={e.bg}
          />
        ))}
      </div>

      <div className="mt-4 space-y-3 pb-24">
        {loading ? (
          <p className="py-10 text-center text-sm text-slate-400">Cargando ventas…</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No hay ventas que coincidan.</p>
        ) : (
          filtered.map((v) => (
            <VentaCard key={v.id} venta={v} pagado={Number(v.monto_senado || 0) + (pagosPorVenta[v.id] || 0)} onOpen={setSelected} />
          ))
        )}
      </div>

      {selected && <VentaDetailSheet venta={selected} onClose={() => setSelected(null)} />}
      {creando && <VentaFormSheet onClose={() => setCreando(false)} />}
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

function Chip({ active, onClick, label, color, bg }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition"
      style={
        active
          ? { backgroundColor: color || '#01BDC1', color: '#fff' }
          : { backgroundColor: bg || '#f1f5f9', color: color || '#64748b' }
      }
    >
      {label}
    </button>
  )
}
