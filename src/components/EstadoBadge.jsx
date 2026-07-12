import { ESTADO_MAP } from '../constants'

export default function EstadoBadge({ estado, size = 'md', map = ESTADO_MAP }) {
  const e = map[estado] || { label: estado, color: '#64748b', bg: '#f1f5f9' }
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold whitespace-nowrap ${sizeClasses}`}
      style={{ color: e.color, backgroundColor: e.bg }}
    >
      {e.label}
    </span>
  )
}
