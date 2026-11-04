import { History, Home, ListChecks, PiggyBank, Settings } from 'lucide-react'

export type Tab = 'inicio' | 'periodicos' | 'ahorro' | 'historial' | 'ajustes'

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'periodicos', label: 'Periódicos', icon: ListChecks },
  { id: 'ahorro', label: 'Ahorro', icon: PiggyBank },
  { id: 'historial', label: 'Historial', icon: History },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
]

interface BottomNavProps {
  active: Tab
  onChange: (tab: Tab) => void
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="mx-auto flex max-w-md justify-between px-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const activo = id === active
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                activo ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-500'
              }`}
            >
              <Icon size={22} strokeWidth={activo ? 2.5 : 2} />
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
