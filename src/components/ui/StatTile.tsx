import type { LucideIcon } from 'lucide-react'

type Acento = 'blue' | 'amber' | 'neutral'

interface StatTileProps {
  label: string
  valor: string
  icon?: LucideIcon
  acento?: Acento
  tono?: 'default' | 'grande'
  negativo?: boolean
}

const ACENTOS: Record<Acento, string> = {
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  neutral: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
}

export function StatTile({ label, valor, icon: Icon, acento = 'neutral', tono = 'default', negativo }: StatTileProps) {
  const tamano = tono === 'grande' ? 'text-4xl' : 'text-2xl'
  const colorValor = negativo ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-neutral-50'

  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/5">
      {Icon && (
        <span className={`flex h-9 w-9 items-center justify-center rounded-full ${ACENTOS[acento]}`}>
          <Icon size={18} strokeWidth={2.25} />
        </span>
      )}
      <div>
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
        <p className={`mt-0.5 font-bold tracking-tight ${tamano} ${colorValor}`}>{valor}</p>
      </div>
    </div>
  )
}
