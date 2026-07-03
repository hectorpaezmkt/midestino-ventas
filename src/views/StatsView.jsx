import { useMemo } from 'react'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { ESTADOS, formatARS } from '../constants'

export default function StatsView() {
  const { rows: leads, loading: loadingLeads } = useRealtimeTable('leads')
  const { rows: gastos, loading: loadingGastos } = useRealtimeTable('gasto_ads')

  const conteoPorEstado = useMemo(() => {
    const map = Object.fromEntries(ESTADOS.map((e) => [e.value, 0]))
    leads.forEach((l) => {
      if (map[l.estado] !== undefined) map[l.estado] += 1
    })
    return map
  }, [leads])

  const totales = useMemo(() => {
    const gastoTotal = gastos.reduce((acc, g) => acc + Number(g.gasto || 0), 0)
    const leadsGenerados = gastos.reduce((acc, g) => acc + Number(g.leads_generados || 0), 0)
    const costoPorLead = leadsGenerados > 0 ? gastoTotal / leadsGenerados : null
    return { gastoTotal, leadsGenerados, costoPorLead }
  }, [gastos])

  const montoSenado = useMemo(
    () => leads.reduce((acc, l) => acc + Number(l.monto_senado || 0), 0),
    [leads],
  )

  const loading = loadingLeads || loadingGastos

  return (
    <div className="px-4 pt-4 pb-24">
      <h1 className="text-xl font-bold text-slate-800">Estadísticas</h1>
      <p className="text-sm text-slate-500">Resumen en vivo del equipo</p>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Cargando…</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatCard label="Leads totales" value={leads.length} bg="#E0F8F8" color="#019A9D" />
            <StatCard label="Gasto en ads" value={formatARS(totales.gastoTotal)} bg="#FFEDDC" color="#D45F00" />
            <StatCard
              label="Costo por lead"
              value={totales.costoPorLead ? formatARS(totales.costoPorLead) : '—'}
              bg="#E0F8F8"
              color="#019A9D"
            />
            <StatCard label="Total señado" value={formatARS(montoSenado)} bg="#FFEDDC" color="#D45F00" />
          </div>

          <p className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Leads por estado
          </p>
          <div className="space-y-2">
            {ESTADOS.map((e) => {
              const cantidad = conteoPorEstado[e.value] || 0
              const pct = leads.length > 0 ? Math.round((cantidad / leads.length) * 100) : 0
              return (
                <div key={e.value} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium" style={{ color: e.color }}>
                      {e.label}
                    </span>
                    <span className="font-semibold text-slate-600">{cantidad}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: e.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, bg, color }) {
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: bg }}>
      <p className="text-xs font-medium" style={{ color }}>
        {label}
      </p>
      <p className="mt-1 text-xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  )
}
