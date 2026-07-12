export const ESTADOS = [
  { value: 'nuevo', label: 'Nuevo', color: '#2563eb', bg: '#dbeafe' },
  { value: 'contactado', label: 'Contactado', color: '#64748b', bg: '#f1f5f9' },
  { value: 'no_contesta', label: 'No contesta', color: '#b91c1c', bg: '#fee2e2' },
  { value: 'quiere_viajar', label: 'Quiere viajar', color: '#01BDC1', bg: '#E0F8F8' },
  { value: 'por_senar', label: 'Por señar', color: '#D45F00', bg: '#FFEDDC' },
  { value: 'senado', label: 'Señado', color: '#FE7203', bg: '#FFEDDC' },
  { value: 'viajo', label: 'Ya Viajó', color: '#15803d', bg: '#dcfce7' },
  { value: 'perdido', label: 'Perdido', color: '#525252', bg: '#e5e5e5' },
  { value: 'personalizado', label: 'Personalizado', color: '#7c3aed', bg: '#ede9fe' },
]

export const ESTADO_MAP = Object.fromEntries(ESTADOS.map((e) => [e.value, e]))

export const CATEGORIA_LABELS = {
  saludo: 'Saludo',
  seguimiento: 'Seguimiento',
  objecion_precio: 'Objeción: precio',
  objecion_seguridad: 'Objeción: seguridad',
  objecion_aprobacion: 'Objeción: aprobación',
  objecion_plata: 'Objeción: plata',
  cierre: 'Cierre',
  destino: 'Destino',
  agradecimiento: 'Agradecimiento',
}

export const VENTA_ESTADOS = [
  { value: 'senado', label: 'Señado', color: '#FE7203', bg: '#FFEDDC' },
  { value: 'pagando', label: 'Pagando cuotas', color: '#2563eb', bg: '#dbeafe' },
  { value: 'pagado', label: 'Pagado completo', color: '#15803d', bg: '#dcfce7' },
  { value: 'cancelado', label: 'Cancelado', color: '#b91c1c', bg: '#fee2e2' },
]
export const VENTA_ESTADO_MAP = Object.fromEntries(VENTA_ESTADOS.map((e) => [e.value, e]))

export const GASTO_CATEGORIAS = [
  { value: 'combustible', label: 'Combustible' },
  { value: 'sueldos', label: 'Sueldos' },
  { value: 'publicidad', label: 'Publicidad' },
  { value: 'guia', label: 'Guía / coordinación' },
  { value: 'hotel', label: 'Hotel / alojamiento' },
  { value: 'seguro', label: 'Seguro' },
  { value: 'comision', label: 'Comisión' },
  { value: 'otro', label: 'Otro' },
]
export const GASTO_CATEGORIA_MAP = Object.fromEntries(GASTO_CATEGORIAS.map((c) => [c.value, c]))

export function diasHasta(fecha) {
  if (!fecha) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const d = new Date(fecha + 'T00:00:00')
  return Math.round((d - hoy) / 86400000)
}

export function tiempoRelativo(fechaISO) {
  if (!fechaISO) return null
  const diff = Date.now() - new Date(fechaISO).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'hace instantes'
  if (min < 60) return `hace ${min} min`
  const hs = Math.floor(min / 60)
  if (hs < 24) return `hace ${hs} h`
  const dias = Math.floor(hs / 24)
  return `hace ${dias} d`
}

export function normalizarTelefono(telefono) {
  if (!telefono) return null
  let digits = telefono.replace(/\D/g, '')
  // Si ya viene con código de país 54, lo dejamos. Si no, asumimos Argentina.
  if (!digits.startsWith('54')) {
    // Saca el 0 inicial de cód. de área si está, y el 15 de celular si está
    digits = digits.replace(/^0/, '')
    digits = `54${digits}`
  }
  // WhatsApp en AR necesita el 9 luego del 54 para celulares
  if (digits.startsWith('54') && !digits.startsWith('549')) {
    digits = `549${digits.slice(2)}`
  }
  return digits
}

export function whatsappLink(telefono, mensaje) {
  const numero = normalizarTelefono(telefono)
  if (!numero) return null
  const texto = encodeURIComponent(mensaje || '')
  return `https://wa.me/${numero}${texto ? `?text=${texto}` : ''}`
}

export function formatARS(monto) {
  if (monto === null || monto === undefined) return '$0'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(monto)
}

export function formatFecha(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
