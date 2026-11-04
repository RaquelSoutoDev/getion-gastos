import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Screen } from '../../components/layout/Screen'
import { Button } from '../../components/ui/Button'
import { cuotasRestantes, totalAhorroProgramado, totalFijos, totalFraccionadosVigentes } from '../../core/periodicItems'
import { formatearEuros } from '../../core/money'
import type { PeriodicItem, TipoPeriodico } from '../../core/types'
import { useEstadoCicloActual } from '../../hooks/useEstadoCicloActual'
import { usePeriodicItems } from '../../hooks/usePeriodicItems'
import { hoyISO } from '../../lib/hoy'
import { ImporteRealSheet } from './ImporteRealSheet'
import { PeriodicItemFormSheet } from './PeriodicItemFormSheet'

const GRUPOS: { tipo: TipoPeriodico; etiqueta: string }[] = [
  { tipo: 'fijo', etiqueta: 'Fijos' },
  { tipo: 'fraccionado', etiqueta: 'Fraccionados' },
  { tipo: 'aproximado', etiqueta: 'Aproximados' },
  { tipo: 'ahorro', etiqueta: 'Ahorro' },
]

function textoCuotas(n: number | null): string | null {
  if (n === null) return null
  if (n <= 0) return 'Ha terminado'
  if (n === 1) return 'Última cuota (termina este mes)'
  return `Quedan ${n} cuotas`
}

export function GastosPeriodicos() {
  const items = usePeriodicItems()
  const estado = useEstadoCicloActual()
  const [formAbierto, setFormAbierto] = useState(false)
  const [itemEditando, setItemEditando] = useState<PeriodicItem | null>(null)
  const [tipoNuevo, setTipoNuevo] = useState<TipoPeriodico>('fijo')
  const [aproximadoAbierto, setAproximadoAbierto] = useState<PeriodicItem | null>(null)

  if (items === undefined) {
    return (
      <Screen title="Gastos periódicos">
        <p className="text-neutral-400">Cargando…</p>
      </Screen>
    )
  }

  const fechaReferencia = estado ? estado.cycle.fechaInicio : hoyISO()
  const hoy = hoyISO()

  const totales: Record<TipoPeriodico, number> = {
    fijo: totalFijos(items),
    fraccionado: totalFraccionadosVigentes(items, fechaReferencia),
    aproximado: estado
      ? estado.aproximados.reduce((suma, d) => suma + d.real, 0)
      : items.filter((i) => i.tipo === 'aproximado' && i.estado === 'activo').reduce((s, i) => s + i.importeMensual, 0),
    ahorro: totalAhorroProgramado(items),
  }

  return (
    <Screen
      title="Gastos periódicos"
      action={
        <Button
          variante="ghost"
          onClick={() => {
            setItemEditando(null)
            setTipoNuevo('fijo')
            setFormAbierto(true)
          }}
        >
          <Plus size={20} /> Nuevo
        </Button>
      }
    >
      {GRUPOS.map((grupo) => {
        const itemsGrupo = items.filter((i) => i.tipo === grupo.tipo && i.estado !== 'eliminado')
        return (
          <section key={grupo.tipo} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">{grupo.etiqueta}</h2>
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                {formatearEuros(totales[grupo.tipo])}
                {grupo.tipo === 'aproximado' && !estado ? ' (presupuesto)' : ''}
              </span>
            </div>

            {itemsGrupo.length === 0 ? (
              <p className="text-sm text-neutral-400">Nada todavía.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {itemsGrupo.map((item) => {
                  const detalleAproximado = estado?.aproximados.find((d) => d.periodicItemId === item.id)
                  const cuotas = grupo.tipo === 'fraccionado' ? textoCuotas(cuotasRestantes(item, hoy)) : null

                  return (
                    <li
                      key={item.id}
                      className="rounded-2xl bg-white p-3 dark:bg-neutral-900"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setItemEditando(item)
                          setFormAbierto(true)
                        }}
                        className="flex w-full items-center justify-between text-left"
                      >
                        <span className="flex flex-col">
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                            {item.nombre}
                            {item.estado === 'pausado' && (
                              <span className="ml-2 rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-normal text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                                Pausado
                              </span>
                            )}
                          </span>
                          {cuotas && <span className="text-xs text-neutral-400">{cuotas}</span>}
                          {grupo.tipo === 'aproximado' && (
                            <span className="text-xs text-neutral-400">
                              {detalleAproximado && detalleAproximado.diferencia !== 0
                                ? `Real: ${formatearEuros(detalleAproximado.real)} (presupuesto ${formatearEuros(detalleAproximado.presupuesto)})`
                                : 'Aún sin importe real registrado este ciclo'}
                            </span>
                          )}
                        </span>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                          {formatearEuros(item.importeMensual)}
                        </span>
                      </button>

                      {grupo.tipo === 'aproximado' && estado && item.estado === 'activo' && (
                        <button
                          type="button"
                          onClick={() => setAproximadoAbierto(item)}
                          className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400"
                        >
                          Registrar importe real
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}

      {formAbierto && (
        <PeriodicItemFormSheet
          key={itemEditando?.id ?? 'nuevo'}
          onClose={() => setFormAbierto(false)}
          item={itemEditando}
          tipoInicial={tipoNuevo}
        />
      )}

      {aproximadoAbierto && estado && (
        <ImporteRealSheet
          key={aproximadoAbierto.id}
          onClose={() => setAproximadoAbierto(null)}
          cicloId={estado.cycle.id}
          periodicItemId={aproximadoAbierto.id}
          nombre={aproximadoAbierto.nombre}
          presupuesto={aproximadoAbierto.importeMensual}
          realActual={
            estado.aproximados.find((d) => d.periodicItemId === aproximadoAbierto.id)?.real ??
            aproximadoAbierto.importeMensual
          }
        />
      )}
    </Screen>
  )
}
