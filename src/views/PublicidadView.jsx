import { useMemo, useState } from 'react'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { formatARS } from '../constants'
import { supabase } from '../supabaseClient'
import { useToast } from '../components/Toast'

const RANGOS = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mes' },
  { value: 'todo', label: 'Histórico' },
]

function inicioDeRango(rango) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  if (rango === 'hoy') return hoy
  if (rango === 'semana') {
    const diaSemana = (hoy.getDay() + 6) % 7 // lunes = 0
    const inicio = new Date(hoy)
    inicio.setDate(hoy.getDate() - diaSemana)
    return inicio
  }
  if (rango === 'mes') return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  return null // todo
}

export default function PublicidadView() {
  const { rows: gastoAds, loading: loadingGasto } = useRealtimeTable('gasto_ads', { order: 'fecha', ascending: false })
  const { rows: leads, loading: loadingLeads } = useRealtimeTable('leads')
  const [rango, setRango] = useState('mes')
  const [sincronizando, setSincronizando] = useState(false)
  const [mostrarManual, setMostrarManual] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState(null)
  const showToast = useToast()

  async function sincronizarMeta() {
    setSincronizando(true)
    setErrorDetalle(null)
    try {
      const resp = await fetch('/.netlify/functions/sync-meta-ads-spend', { method: 'POST' })
      const data = await resp.json()
      if (!resp.ok) {
        throw new Error(data.detalle ? `${data.error} ${data.detalle}` : data.error || 'Error al sincronizar')
      }
      showToast(`${data.actualizados ?? 0} filas de gasto actualizadas ✓`)
    } catch (err) {
      console.error(err)
      setErrorDetalle(err.message)
      showToast('No se pudo sincronizar con Meta', 'error')
    } finally {
      setSincronizando(false)
    }
  }

  const gastoFiltrado = useMemo(() => {
    const desde = inicioDeRango(rango)
    if (!desde) return gastoAds
    return gastoAds.filter((g) => g.fecha && new Date(g.fecha + 'T00:00:00') >= desde)
  }, [gastoAds, rango])

  const leadsFiltrados = useMemo(() => {
    const desde = inicioDeRango(rango)
    if (!desde) return leads
    return leads.filter((l) => l.created_at && new Date(l.created_at) >= desde)
  }, [leads, rango])

  const porCampana = useMemo(() => {
    const map = {}
    gastoFiltrado.forEach((g) => {
      const key = g.campaign_name || 'Sin campaña'
      if (!map[key]) map[key] = { nombre: key, gasto: 0, leads: 0 }
      map[key].gasto += Number(g.gasto || 0)
    })
    leadsFiltrados.forEach((l) => {
      const key = l.campaign_name || 'Sin campaña'
      if (!map[key]) map[key] = { nombre: key, gasto: 0, leads: 0 }
      map[key].leads += 1
    })
    return Object.values(map).sort((a, b) => b.gasto - a.gasto)
  }, [gastoFiltrado, leadsFiltrados])

  const totales = useMemo(() => {
    const gasto = porCampana.reduce((a, c) => a + c.gasto, 0)
    const leadsCount = porCampana.reduce((a, c) => a + c.leads, 0)
    return { gasto, leadsCount, costoPorLead: leadsCount > 0 ? gasto / leadsCount : null }
  }, [porCampana])

  const loading = loadingGasto || loadingLeads

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Publicidad</h1>
          <p className="text-sm text-slate-500">Rendimiento por campaña</p>
        </div>
        <button
          onClick={sincronizarMeta}
          disabled={sincronizando}
          className="shrink-0 rounded-xl bg-teal px-3 py-2 text-xs font-semibold text-white active:scale-[0.97] transition disabled:opacity-60"
        >
          {sincronizando ? 'Sincronizando…' : '↻ Sincronizar Meta'}
        </button>
      </div>

      {errorDetalle && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 break-words">
          <p className="font-semibold">Detalle del error:</p>
          <p className="mt-1">{errorDetalle}</p>
        </div>
      )}

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {RANGOS.map((r) => (
          <button
            key={r.value}
            onClick={() => setRango(r.value)}
            className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition"
            style={
              rango === r.value
                ? { backgroundColor: '#01BDC1', color: '#fff' }
                : { backgroundColor: '#f1f5f9', color: '#64748b' }
            }
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniStat label="Gasto" value={formatARS(totales.gasto)} />
        <MiniStat label="Leads" value={totales.leadsCount} />
        <MiniStat label="Costo/lead" value={totales.costoPorLead ? formatARS(totales.costoPorLead) : '—'} />
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Cargando…</p>
      ) : porCampana.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">
          Sin datos todavía. Tocá "Sincronizar Meta" para traer el gasto real, o cargá uno manual abajo.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {porCampana.map((c) => (
            <div key={c.nombre} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="truncate font-semibold text-slate-800">{c.nombre}</p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-500">{c.leads} leads</span>
                <span className="font-semibold text-orange-dark">{formatARS(c.gasto)}</span>
              </div>
              {c.leads > 0 && (
                <p className="mt-1 text-xs text-slate-400">Costo por lead: {formatARS(c.gasto / c.leads)}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setMostrarManual((v) => !v)}
        className="mt-6 w-full rounded-xl border-2 border-dashed border-slate-300 py-2.5 text-sm font-semibold text-slate-500"
      >
        {mostrarManual ? 'Ocultar carga manual' : '+ Cargar gasto manual'}
      </button>

      {mostrarManual && <GastoManualForm onDone={() => setMostrarManual(false)} />}
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

function GastoManualForm({ onDone }) {
  const [campaign, setCampaign] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const showToast = useToast()

  async function guardar() {
    if (!monto || Number(monto) <= 0) {
      showToast('Ingresá un monto válido', 'error')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('gasto_ads').insert({
        fecha,
        campaign_name: campaign.trim() || 'Sin campaña',
        gasto: Number(monto),
        fuente: 'manual',
      })
      if (error) throw error
      showToast('Gasto cargado ✓')
      setCampaign('')
      setMonto('')
      onDone()
    } catch (err) {
      console.error(err)
      showToast('No se pudo guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
      <label className="block">
        <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">Campaña</span>
        <input
          value={campaign}
          onChange={(e) => setCampaign(e.target.value)}
          placeholder="Ej: Termas Julio"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal focus:outline-none"
        />
      </label>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
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
        onClick={guardar}
        disabled={saving}
        className="mt-3 w-full rounded-xl bg-orange py-2.5 text-sm font-semibold text-white active:scale-[0.99] transition disabled:opacity-60"
      >
        {saving ? 'Guardando…' : 'Guardar gasto'}
      </button>
    </div>
  )
}
