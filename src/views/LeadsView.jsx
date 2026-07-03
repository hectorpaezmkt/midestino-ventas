import { useMemo, useState } from 'react'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { ESTADOS } from '../constants'
import LeadCard from '../components/LeadCard'
import LeadDetailSheet from '../components/LeadDetailSheet'
import { useToast } from '../components/Toast'

export default function LeadsView() {
  const { rows: leads, loading } = useRealtimeTable('leads', { order: 'created_at', ascending: false })
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [selected, setSelected] = useState(null)
  const [sincronizando, setSincronizando] = useState(false)
  const showToast = useToast()

  async function sincronizarMeta() {
    setSincronizando(true)
    try {
      const resp = await fetch('/.netlify/functions/sync-meta-leads', { method: 'POST' })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Error al sincronizar')
      showToast(`${data.creados} leads nuevos importados ✓`)
    } catch (err) {
      console.error(err)
      showToast('No se pudo sincronizar con Meta', 'error')
    } finally {
      setSincronizando(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leads.filter((l) => {
      const matchEstado = filtroEstado === 'todos' || l.estado === filtroEstado
      if (!matchEstado) return false
      if (!q) return true
      return (
        l.nombre_completo?.toLowerCase().includes(q) ||
        l.institucion?.toLowerCase().includes(q) ||
        l.telefono?.toLowerCase().includes(q) ||
        l.destino_interes?.toLowerCase().includes(q)
      )
    })
  }, [leads, search, filtroEstado])

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Leads</h1>
          <p className="text-sm text-slate-500">{leads.length} en total</p>
        </div>
        <button
          onClick={sincronizarMeta}
          disabled={sincronizando}
          className="shrink-0 rounded-xl bg-teal px-3 py-2 text-xs font-semibold text-white active:scale-[0.97] transition disabled:opacity-60"
        >
          {sincronizando ? 'Sincronizando…' : '↻ Sincronizar Meta'}
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre, escuela, teléfono…"
        className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
      />

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        <Chip active={filtroEstado === 'todos'} onClick={() => setFiltroEstado('todos')} label="Todos" />
        {ESTADOS.map((e) => (
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
          <p className="py-10 text-center text-sm text-slate-400">Cargando leads…</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No hay leads que coincidan.</p>
        ) : (
          filtered.map((lead) => <LeadCard key={lead.id} lead={lead} onOpen={setSelected} />)
        )}
      </div>

      {selected && <LeadDetailSheet lead={selected} onClose={() => setSelected(null)} />}
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
