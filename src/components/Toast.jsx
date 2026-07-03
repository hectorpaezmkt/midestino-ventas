import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 px-4 w-full max-w-sm">
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg animate-[fadeIn_0.15s_ease-out] ${
              toast.type === 'error' ? 'bg-red-600' : 'bg-teal-dark'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
