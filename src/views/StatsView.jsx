import { useMemo } from 'react'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { ESTADOS, formatARS, formatFecha, diasHasta, tiempoRelativo } from '../constants'

export default function StatsView() {
  const { rows: leads, loading: loadingLeads } = useRealtimeTable('leads')
  const { rows: gastoAds, loading: loadingGastoAds } = useRealtimeTable('gasto_ads')
  const { rows: ventas, loading: loadingVentas } = useRealtimeTable('ventas')
  const { rows: pagos, loading: loadingPagos } = useRealtimeTable('pagos')
  const { rows: gastos, loading: loadingGastos } = useRealtimeTable('gastos')
  const { rows: syncLog, loading: loadingSync } = useRealtimeTable('sync_log', { order: 'ran_at', ascending: false })

  const conteoPorEstado = useMemo(() => {
    const map = Object.fromEntries(ESTADOS.map((e) => [e.value, 0]))
    leads.forEach((l) => {
      if (map[l.estado] !== undefined) map[l.estado] += 1
    })
    return map
  }, [leads])

  const adsInfo = useMemo(() => {
    const gastoTotal = gastoAds.reduce((a, g) => a + Number(g.gasto || 0), 0)
    const leadsGenerados = gastoAds.reduce((a, g) => a + Number(g.leads_generados || 0), 0)
    return { gastoTotal, leadsGenerados, costoPorLead: leadsGenerados > 0 ? gastoTotal / leadsGenerados : null }
  }, [gastoAds])

  const pagosPorVenta = useMemo(() => {
    const map = {}
    pagos.forEach((p) => {
      map[p.venta_id] = (map[p.venta_id] || 0) + Number(p.monto || 0)
    })
    return map
  }, [pagos])

  const finanzas = useMemo(() => {
    const vendido = ventas.reduce((a, v) => a + Number(v.monto_total || 0), 0)
    const cobrado = ventas.reduce((a, v) => a + Number(v.monto_senado || 0) + (pagosPorVenta[v.id] || 0), 0)
    const gastosTotal = gastos.reduce((a, g) => a + Number(g.monto || 0), 0)
    return { vendido, cobrado, pendiente: vendido - cobrado, gastosTotal, margen: cobrado - gastosTotal }
  }, [ventas, pagosPorVenta, gastos])

  const proximosViajes = useMemo(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    return ventas
      .filter((v) => v.fecha_viaje && new Date(v.fecha_viaje + 'T00:00:00') >= hoy && v.estado_pago !== 'cancelado')
      .sort((a, b) => new Date(a.fecha_viaje) - new Date(b.fecha_viaje))
      .slice(0, 5)
  }, [ventas])

  const ultimoSync = syncLog[0]
  const loading = loadingLeads || loadingGastoAds || loadingVentas || loadingPagos || loadingGastos

  return (
    <div className="px-4 pt-4 pb-24">
      <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
      <p className="text-sm text-slate-500">Resumen en vivo del equipo</p>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conexión con Meta Ads</p>
          {!loadingSync && <span className={`h-2.5 w-2.5 rounded-full ${ultimoSync ? 'bg-green-500' : 'bg-slate-300'}`} />}
        </div>
        {loadingSync ? (
          <p className="mt-1 text-sm text-slate-400">Verificando…</p>
        ) : ultimoSync ? (
          <>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              Conectado · última sync {tiempoRelativo(ultimoSync.ran_at)}
            </p>
            <p className="text-xs text-slate-400">
              {ultimoSync.creados} nuevos · {ultimoSync.omitidos} ya existentes
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-slate-500">
            Todavía no se sincronizó ningún lead de Meta. Andá a "Leads" y tocá "Sincronizar Meta".
          </p>
        )}
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Cargando…</p>
      ) : (
        <>
          <p className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Finanzas</p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Vendido" value={formatARS(finanzas.vendido)} bg="#E0F8F8" color="#019A9D" />
            <StatCard label="Cobrado" value={formatARS(finanzas.cobrado)} bg="#dcfce7" color="#15803d" />
            <StatCard label="Pendiente de cobro" value={formatARS(finanzas.pendiente)} bg="#FFEDDC" color="#D45F00" />
            <StatCard label="Gastos" value={formatARS(finanzas.gastosTotal)} bg="#fee2e2" color="#b91c1c" />
          </div>
          <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Margen (cobrado − gastos)</p>
            <p className={`mt-1 text-2xl font-bold ${finanzas.margen >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {formatARS(finanzas.margen)}
            </p>
          </div>

          <p className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Publicidad</p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Leads totales" value={leads.length} bg="#E0F8F8" color="#019A9D" />
            <StatCard label="Gasto en ads" value={formatARS(adsInfo.gastoTotal)} bg="#FFEDDC" color="#D45F00" />
            <StatCard
              label="Costo por lead"
              value={adsInfo.costoPorLead ? formatARS(adsInfo.costoPorLead) : '—'}
              bg="#E0F8F8"
              color="#019A9D"
            />
            <StatCard label="Ventas totales" value={ventas.length} bg="#FFEDDC" color="#D45F00" />
          </div>

          {proximosViajes.length > 0 && (
            <>
              <p className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Próximos viajes</p>
              <div className="space-y-2">
                {proximosViajes.map((v) => {
                  const dias = diasHasta(v.fecha_viaje)
                  return (
                    <div key={v.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-700">{v.cliente_nombre}</p>
                        <p className="truncate text-xs text-slate-400">
                          {v.destino} · {formatFecha(v.fecha_viaje)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-teal-light px-2.5 py-1 text-xs font-semibold text-teal-dark">
                        {dias === 0 ? 'Hoy' : dias === 1 ? 'Mañana' : `${dias} días`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <p className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Leads por estado</p>
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
