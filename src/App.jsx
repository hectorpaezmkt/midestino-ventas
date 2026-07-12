import { useState } from 'react'
import BottomNav from './components/BottomNav'
import LeadsView from './views/LeadsView'
import VentasView from './views/VentasView'
import GastosView from './views/GastosView'
import PublicidadView from './views/PublicidadView'
import MensajesView from './views/MensajesView'
import StatsView from './views/StatsView'
import { ToastProvider } from './components/Toast'

export default function App() {
  const [tab, setTab] = useState('leads')

  return (
    <ToastProvider>
      <div className="mx-auto min-h-screen max-w-md bg-slate-50">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal text-sm font-bold text-white">
            MD
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-slate-800">Mi Destino Ventas</p>
            <p className="text-[11px] leading-tight text-slate-400">Panel del equipo</p>
          </div>
        </header>

        <main>
          {tab === 'leads' && <LeadsView />}
          {tab === 'ventas' && <VentasView />}
          {tab === 'gastos' && <GastosView />}
          {tab === 'publicidad' && <PublicidadView />}
          {tab === 'mensajes' && <MensajesView />}
          {tab === 'stats' && <StatsView />}
        </main>

        <BottomNav active={tab} onChange={setTab} />
      </div>
    </ToastProvider>
  )
}
