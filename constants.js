import EstadoBadge from './EstadoBadge'
import { formatFecha } from '../constants'

export default function LeadCard({ lead, onOpen }) {
  return (
    <button
      onClick={() => onOpen(lead)}
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm active:scale-[0.99] transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-800">{lead.nombre_completo || 'Sin nombre'}</p>
          <p className="truncate text-sm text-slate-500">
            {lead.institucion || 'Sin institución'}
            {lead.nivel ? ` · ${lead.nivel}` : ''}
          </p>
        </div>
        <EstadoBadge estado={lead.estado} size="sm" />
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        {lead.cantidad_alumnos ? <span>👥 {lead.cantidad_alumnos} alumnos</span> : null}
        {lead.destino_interes ? <span>📍 {lead.destino_interes}</span> : null}
        {lead.fecha_tentativa ? <span>📅 {formatFecha(lead.fecha_tentativa)}</span> : null}
      </div>
    </button>
  )
}
