import EstadoBadge from './EstadoBadge'
import { VENTA_ESTADO_MAP, formatARS, formatFecha } from '../constants'

export default function VentaCard({ venta, pagado, onOpen }) {
  const saldo = Number(venta.monto_total || 0) - pagado
  return (
    <button
      onClick={() => onOpen(venta)}
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm active:scale-[0.99] transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-800">{venta.cliente_nombre}</p>
          <p className="truncate text-sm text-slate-500">
            {venta.destino || 'Sin destino'}
            {venta.institucion ? ` · ${venta.institucion}` : ''}
          </p>
        </div>
        <EstadoBadge estado={venta.estado_pago} map={VENTA_ESTADO_MAP} size="sm" />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        {venta.fecha_viaje ? <span>🗓️ {formatFecha(venta.fecha_viaje)}</span> : null}
        {venta.cantidad_alumnos ? <span>👥 {venta.cantidad_alumnos}</span> : null}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-sm">
        <span className="text-slate-500">Total {formatARS(venta.monto_total)}</span>
        <span className={`font-semibold ${saldo > 0 ? 'text-orange-dark' : 'text-green-700'}`}>
          {saldo > 0 ? `Saldo ${formatARS(saldo)}` : 'Pagado ✓'}
        </span>
      </div>
    </button>
  )
}
