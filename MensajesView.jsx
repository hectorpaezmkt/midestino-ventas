import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'

/**
 * Carga una tabla completa y se re-suscribe a cambios realtime de Supabase
 * para que todo el equipo vea las actualizaciones de los demás sin recargar.
 */
export function useRealtimeTable(table, { select = '*', order, ascending = false } = {}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mounted = useRef(true)

  const fetchAll = useCallback(async () => {
    let query = supabase.from(table).select(select)
    if (order) query = query.order(order, { ascending })
    const { data, error } = await query
    if (!mounted.current) return
    if (error) setError(error)
    else setRows(data || [])
    setLoading(false)
  }, [table, select, order, ascending])

  useEffect(() => {
    mounted.current = true
    fetchAll()

    const channel = supabase
      .channel(`realtime:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        fetchAll()
      })
      .subscribe()

    return () => {
      mounted.current = false
      supabase.removeChannel(channel)
    }
  }, [fetchAll, table])

  return { rows, loading, error, refetch: fetchAll }
}
