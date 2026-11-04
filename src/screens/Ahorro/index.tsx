import { Plus } from 'lucide-react'
import { useState } from 'react'
import { AhorroAcumuladoCard } from '../../components/AhorroAcumuladoCard'
import { Screen } from '../../components/layout/Screen'
import { Button } from '../../components/ui/Button'
import { formatearFechaEs } from '../../core/dates'
import { formatearEuros } from '../../core/money'
import type { OrigenHucha } from '../../core/types'
import { useHucha } from '../../hooks/useHucha'
import { MovimientoManualSheet } from './MovimientoManualSheet'

const ETIQUETAS_ORIGEN: Record<OrigenHucha, string> = {
  ahorro_programado: 'Ahorro programado',
  sobrante_ciclo: 'Sobrante de ciclo',
  manual: 'Movimiento manual',
}

export function Ahorro() {
  const hucha = useHucha()
  const [sheetAbierto, setSheetAbierto] = useState(false)

  return (
    <Screen
      title="Ahorro"
      action={
        <Button variante="ghost" onClick={() => setSheetAbierto(true)}>
          <Plus size={20} /> Movimiento
        </Button>
      }
    >
      <AhorroAcumuladoCard saldo={hucha?.saldo ?? 0} />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Historial de aportaciones</h2>
        {!hucha || hucha.movimientos.length === 0 ? (
          <p className="text-sm text-neutral-400">Todavía no hay movimientos.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {hucha.movimientos.map((m) => {
              const positivo = m.importe >= 0
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/5"
                >
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {m.concepto || ETIQUETAS_ORIGEN[m.origen]}
                    </span>
                    <span className="text-xs text-neutral-400">{formatearFechaEs(m.fecha)}</span>
                  </span>
                  <span
                    className={`font-semibold ${positivo ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {positivo ? '+' : ''}
                    {formatearEuros(m.importe)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <MovimientoManualSheet open={sheetAbierto} onClose={() => setSheetAbierto(false)} />
    </Screen>
  )
}
