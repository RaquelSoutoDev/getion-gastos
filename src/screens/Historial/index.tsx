import { useState } from 'react'
import { Screen } from '../../components/layout/Screen'
import { formatearFechaEs } from '../../core/dates'
import { formatearEuros } from '../../core/money'
import type { Cycle } from '../../core/types'
import { useCiclosCerrados } from '../../hooks/useCiclosCerrados'
import { CicloDetalleSheet } from './CicloDetalleSheet'

export function Historial() {
  const ciclos = useCiclosCerrados()
  const [cicloSeleccionado, setCicloSeleccionado] = useState<Cycle | null>(null)

  return (
    <Screen title="Historial">
      {!ciclos || ciclos.length === 0 ? (
        <p className="text-sm text-neutral-400">Todavía no hay ciclos cerrados.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ciclos.map((ciclo) => {
            const resumen = ciclo.resumenCierre
            return (
              <li key={ciclo.id}>
                <button
                  type="button"
                  onClick={() => setCicloSeleccionado(ciclo)}
                  className="flex w-full flex-col gap-1 rounded-2xl bg-white p-4 text-left dark:bg-neutral-900"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-50">Ciclo Nº {ciclo.numero}</span>
                    <span className="text-sm text-neutral-400">
                      {formatearFechaEs(ciclo.fechaInicio)} – {ciclo.fechaFin ? formatearFechaEs(ciclo.fechaFin) : '—'}
                    </span>
                  </div>
                  {resumen && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500 dark:text-neutral-400">Salario {formatearEuros(ciclo.salarioImporte)}</span>
                      <span
                        className={
                          resumen.deficitArrastrado > 0
                            ? 'font-medium text-red-600 dark:text-red-400'
                            : 'font-medium text-green-600 dark:text-green-400'
                        }
                      >
                        {resumen.deficitArrastrado > 0
                          ? `Déficit ${formatearEuros(resumen.deficitArrastrado)}`
                          : `A la hucha ${formatearEuros(resumen.aportacionHuchaSobrante)}`}
                      </span>
                    </div>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <CicloDetalleSheet ciclo={cicloSeleccionado} onClose={() => setCicloSeleccionado(null)} />
    </Screen>
  )
}
