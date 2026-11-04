import { ChevronDown, ChevronUp, Plus, Wallet } from 'lucide-react'
import { useState } from 'react'
import { CalculoColchonView } from '../../components/CalculoColchonView'
import { Screen } from '../../components/layout/Screen'
import { Button } from '../../components/ui/Button'
import { StatTile } from '../../components/ui/StatTile'
import { formatearFechaEs } from '../../core/dates'
import { formatearEuros } from '../../core/money'
import type { Gasto } from '../../core/types'
import { useEstadoCicloActual } from '../../hooks/useEstadoCicloActual'
import { useRecordatorioBackup } from '../../hooks/useRecordatorioBackup'
import { GastoFormSheet } from './GastoFormSheet'
import { RegistrarSalarioFlow } from './RegistrarSalarioFlow'

interface InicioProps {
  onIrAAjustes: () => void
}

export function Inicio({ onIrAAjustes }: InicioProps) {
  const estado = useEstadoCicloActual()
  const avisarBackup = useRecordatorioBackup()
  const [sheetGastoAbierto, setSheetGastoAbierto] = useState(false)
  const [gastoEditando, setGastoEditando] = useState<Gasto | null>(null)
  const [salarioAbierto, setSalarioAbierto] = useState(false)
  const [verCalculo, setVerCalculo] = useState(false)

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

      <StatTile
        label="Colchón disponible"
        valor={formatearEuros(estado.colchonDisponible)}
        tono="grande"
        negativo={estado.colchonDisponible < 0}
      />

      <button
        type="button"
        onClick={() => setVerCalculo((v) => !v)}
        className="flex items-center justify-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400"
      >
        {verCalculo ? 'Ocultar cálculo' : 'Ver cálculo'}
        {verCalculo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {verCalculo && (
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
      )}

      <StatTile
        label="Comida disponible"
        valor={formatearEuros(estado.comidaDisponible)}
        negativo={estado.comidaDisponible < 0}
      />
      <StatTile
        label="Próximo salario estimado"
        valor={
          estado.diasHastaProximoCobro >= 0
            ? `${estado.diasHastaProximoCobro} días (${formatearFechaEs(estado.fechaProximoCobro)})`
            : `Estimado el ${formatearFechaEs(estado.fechaProximoCobro)}`
        }
      />

      <Button
        className="w-full"
        onClick={() => {
          setGastoEditando(null)
          setSheetGastoAbierto(true)
        }}
      >
        <Plus size={20} /> Añadir gasto
      </Button>

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
            {ultimosMovimientos.map((gasto) => (
              <li key={gasto.id}>
                <button
                  type="button"
                  onClick={() => {
                    setGastoEditando(gasto)
                    setSheetGastoAbierto(true)
                  }}
                  className="flex w-full items-center justify-between rounded-2xl bg-white p-3 text-left dark:bg-neutral-900"
                >
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {gasto.concepto || (gasto.bolsa === 'comida' ? 'Comida' : 'Colchón')}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {formatearFechaEs(gasto.fecha)} · {gasto.bolsa === 'comida' ? 'Comida' : 'Colchón'}
                    </span>
                  </span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                    {formatearEuros(gasto.importe)}
                  </span>
                </button>
              </li>
            ))}
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
