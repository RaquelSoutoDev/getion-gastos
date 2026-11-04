import { PiggyBank } from 'lucide-react'
import { formatearEuros } from '../core/money'

export function AhorroAcumuladoCard({ saldo }: { saldo: number }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white shadow-sm dark:from-emerald-600 dark:to-emerald-800">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
        <PiggyBank size={24} strokeWidth={2.25} />
      </span>
      <div>
        <p className="text-sm font-medium text-emerald-50">Ahorro acumulado</p>
        <p className="text-2xl font-bold tracking-tight">{formatearEuros(saldo)}</p>
      </div>
    </div>
  )
}
