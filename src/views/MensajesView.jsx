import { useMemo, useState } from 'react'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { CATEGORIA_LABELS } from '../constants'
import { useToast } from '../components/Toast'

export default function MensajesView() {
  const { rows: mensajes, loading } = useRealtimeTable('mensajes', { order: 'orden', ascending: true })
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState('todas')
  const showToast = useToast()

  const categorias = useMemo(() => {
    const set = new Set(mensajes.map((m) => m.categoria))
    return Array.from(set)
  }, [mensajes])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return mensajes.filter((m) => {
      const matchCat = categoria === 'todas' || m.categoria === categoria
      if (!matchCat) return false
      if (!q) return true
      return m.titulo?.toLowerCase().includes(q) || m.contenido?.toLowerCase().includes(q)
    })
  }, [mensajes, search, categoria])

  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto)
      showToast('Mensaje copiado ✓')
    } catch {
      showToast('No se pudo copiar', 'error')
    }
  }

  return (
    <div className="px-4 pt-4">
      <h1 className="text-xl font-bold text-slate-800">Mensajes</h1>
      <p className="text-sm text-slate-500">Buscá y copiá respuestas listas</p>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar mensaje…"
        className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
      />

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        <Chip active={categoria === 'todas'} onClick={() => setCategoria('todas')} label="Todas" />
        {categorias.map((c) => (
          <Chip
            key={c}
            active={categoria === c}
            onClick={() => setCategoria(c)}
            label={CATEGORIA_LABELS[c] || c}
          />
        ))}
      </div>

      <div className="mt-4 space-y-3 pb-24">
        {loading ? (
          <p className="py-10 text-center text-sm text-slate-400">Cargando mensajes…</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No hay mensajes que coincidan.</p>
        ) : (
          filtered.map((m) => (
            <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">{m.titulo}</p>
                  <span className="mt-1 inline-block rounded-full bg-teal-light px-2 py-0.5 text-[11px] font-semibold text-teal-dark">
                    {CATEGORIA_LABELS[m.categoria] || m.categoria}
                  </span>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{m.contenido}</p>
              <button
                onClick={() => copiar(m.contenido)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-teal py-2.5 text-sm font-semibold text-white active:scale-[0.99] transition"
              >
                Copiar mensaje
              </button>
            </div>
          ))
        )}
      </div>
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
