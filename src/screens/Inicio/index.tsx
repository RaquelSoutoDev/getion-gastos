import { Plus, UtensilsCrossed, Wallet } from 'lucide-react'
import { useState } from 'react'
import { AhorroAcumuladoCard } from '../../components/AhorroAcumuladoCard'
import { CalculoColchonView } from '../../components/CalculoColchonView'
import { Screen } from '../../components/layout/Screen'
import { Button } from '../../components/ui/Button'
import { Disclosure } from '../../components/ui/Disclosure'
import { StatTile } from '../../components/ui/StatTile'
import { formatearFechaEs } from '../../core/dates'
import { formatearEuros } from '../../core/money'
import type { Gasto } from '../../core/types'
import { useEstadoCicloActual } from '../../hooks/useEstadoCicloActual'
import { useHucha } from '../../hooks/useHucha'
import { useRecordatorioBackup } from '../../hooks/useRecordatorioBackup'
import { GastoFormSheet } from './GastoFormSheet'
import { RegistrarSalarioFlow } from './RegistrarSalarioFlow'

interface InicioProps {
  onIrAAjustes: () => void
}

export function Inicio({ onIrAAjustes }: InicioProps) {
  const estado = useEstadoCicloActual()
  const hucha = useHucha()
  const avisarBackup = useRecordatorioBackup()
  const [sheetGastoAbierto, setSheetGastoAbierto] = useState(false)
  const [gastoEditando, setGastoEditando] = useState<Gasto | null>(null)
  const [salarioAbierto, setSalarioAbierto] = useState(false)

  if (estado === undefined) {
    return (
      <Screen title="Inicio">
        <p className="text-neutral-400">Cargando…</p>
      </Screen>
    )
  }

  if (estado === null) {
    return (
      <Screen title="Inicio">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-6 text-center dark:bg-neutral-900">
          <Wallet className="text-blue-500" size={40} />
          <p className="text-neutral-600 dark:text-neutral-300">
            Todavía no has registrado ningún salario. Regístralo para empezar tu primer ciclo.
          </p>
          <Button onClick={() => setSalarioAbierto(true)}>Registrar primer salario</Button>
        </div>
        <RegistrarSalarioFlow open={salarioAbierto} onClose={() => setSalarioAbierto(false)} />
      </Screen>
    )
  }

  const ultimosMovimientos = [...estado.gastos].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, 5)

  return (
    <Screen title="Inicio">
      {avisarBackup && (
        <button
          type="button"
          onClick={onIrAAjustes}
          className="rounded-2xl bg-amber-100 p-3 text-left text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          Hace más de 30 días que no exportas una copia de seguridad. Toca para ir a Ajustes.
        </button>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Colchón disponible"
          valor={formatearEuros(estado.colchonDisponible)}
          icon={Wallet}
          acento="blue"
          negativo={estado.colchonDisponible < 0}
        />
        <StatTile
          label="Comida disponible"
          valor={formatearEuros(estado.comidaDisponible)}
          icon={UtensilsCrossed}
          acento="amber"
          negativo={estado.comidaDisponible < 0}
        />
      </div>

      <AhorroAcumuladoCard saldo={hucha?.saldo ?? 0} />

      <Button
        className="w-full"
        onClick={() => {
          setGastoEditando(null)
          setSheetGastoAbierto(true)
        }}
      >
        <Plus size={20} /> Añadir gasto
      </Button>

      <Disclosure label="Ver desglose del cálculo" labelAbierto="Ocultar desglose">
        <div className="flex flex-col gap-3">
          <CalculoColchonView
            salarioImporte={estado.cycle.salarioImporte}
            totalFijos={estado.totalFijos}
            totalFraccionados={estado.totalFraccionados}
            totalAproximado={estado.totalAproximado}
            totalAhorroProgramado={estado.totalAhorroProgramado}
            presupuestoComida={estado.comidaInicial}
            deficitArrastrado={estado.cycle.deficitArrastrado}
            colchonInicial={estado.colchonInicial}
            gastosRegistrados={estado.colchonInicial - estado.colchonDisponible}
            disponible={estado.colchonDisponible}
          />
          <div className="flex items-center justify-between rounded-2xl bg-neutral-100 px-4 py-3 text-sm dark:bg-neutral-800">
            <span className="text-neutral-500 dark:text-neutral-400">Próximo salario estimado</span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-50">
              {estado.diasHastaProximoCobro >= 0
                ? `${estado.diasHastaProximoCobro} días (${formatearFechaEs(estado.fechaProximoCobro)})`
                : `Estimado el ${formatearFechaEs(estado.fechaProximoCobro)}`}
            </span>
          </div>
        </div>
      </Disclosure>

      <button
        type="button"
        onClick={() => setSalarioAbierto(true)}
        className="text-center text-sm font-medium text-blue-600 dark:text-blue-400"
      >
        Ciclo Nº {estado.cycle.numero} · desde {formatearFechaEs(estado.cycle.fechaInicio)} · Registrar nuevo salario
      </button>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Últimos movimientos</h2>
        {ultimosMovimientos.length === 0 ? (
          <p className="text-sm text-neutral-400">Todavía no hay gastos en este ciclo.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {ultimosMovimientos.map((gasto) => {
              const esComida = gasto.bolsa === 'comida'
              const esIngreso = gasto.importe < 0
              return (
                <li key={gasto.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setGastoEditando(gasto)
                      setSheetGastoAbierto(true)
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/5"
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${esComida ? 'bg-amber-500' : 'bg-blue-500'}`}
                      aria-hidden
                    />
                    <span className="flex flex-1 flex-col">
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                        {gasto.concepto || (esComida ? 'Comida' : 'Colchón')}
                      </span>
                      <span className="text-xs text-neutral-400">{formatearFechaEs(gasto.fecha)}</span>
                    </span>
                    <span
                      className={`font-semibold ${esIngreso ? 'text-green-600 dark:text-green-400' : 'text-neutral-900 dark:text-neutral-50'}`}
                    >
                      {esIngreso ? '+' : ''}
                      {formatearEuros(Math.abs(gasto.importe))}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {sheetGastoAbierto && (
        <GastoFormSheet
          key={gastoEditando?.id ?? 'nuevo'}
          onClose={() => setSheetGastoAbierto(false)}
          cicloId={estado.cycle.id}
          gasto={gastoEditando}
        />
      )}
      <RegistrarSalarioFlow open={salarioAbierto} onClose={() => setSalarioAbierto(false)} />
    </Screen>
  )
}
