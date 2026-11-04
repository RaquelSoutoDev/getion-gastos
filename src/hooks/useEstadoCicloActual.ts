import { useLiveQuery } from 'dexie-react-hooks'
import { calcularColchonInicial, calcularDisponibleBolsa } from '../core/colchon'
import { diasHasta, fechaProximoCobro } from '../core/dates'
import {
  type DetalleAproximado,
  resolverAproximados,
  totalAhorroProgramado,
  totalAproximadoEnVivo,
  totalFijos,
  totalFraccionadosVigentes,
} from '../core/periodicItems'
import type { Cycle, Gasto, Settings } from '../core/types'
import { hoyISO } from '../lib/hoy'
import { db } from '../db/schema'
import { obtenerSettings } from '../db/repositories/settings'

export interface EstadoCicloActual {
  cycle: Cycle
  settings: Settings
  gastos: Gasto[]
  colchonInicial: number
  colchonDisponible: number
  comidaInicial: number
  comidaDisponible: number
  totalFijos: number
  totalFraccionados: number
  totalAhorroProgramado: number
  totalAproximado: number
  aproximados: DetalleAproximado[]
  fechaProximoCobro: string
  diasHastaProximoCobro: number
}

/**
 * `undefined` mientras carga, `null` si no hay ciclo abierto (antes del primer
 * salario registrado), o el estado calculado en vivo del ciclo abierto.
 */
export function useEstadoCicloActual(): EstadoCicloActual | null | undefined {
  return useLiveQuery(async () => {
    const cycle = await db.cycles.where('estado').equals('abierto').first()
    if (!cycle) return null

    const [periodicItems, gastos, registrosAproximado, settings] = await Promise.all([
      db.periodicItems.toArray(),
      db.gastos.where('cicloId').equals(cycle.id).toArray(),
      db.registrosAproximado.where('cicloId').equals(cycle.id).toArray(),
      obtenerSettings(db),
    ])

    const fijos = totalFijos(periodicItems)
    const fraccionados = totalFraccionadosVigentes(periodicItems, cycle.fechaInicio)
    const ahorro = totalAhorroProgramado(periodicItems)
    const aproximados = resolverAproximados(periodicItems, registrosAproximado, cycle.id)
    const aproximadoEnVivo = totalAproximadoEnVivo(aproximados)

    const colchonInicial = calcularColchonInicial({
      salarioImporte: cycle.salarioImporte,
      totalFijos: fijos,
      totalFraccionados: fraccionados,
      totalAproximado: aproximadoEnVivo,
      totalAhorroProgramado: ahorro,
      presupuestoComida: settings.presupuestoComidaMensual,
      deficitArrastrado: cycle.deficitArrastrado,
    })

    const gastosComida = gastos.filter((g) => g.bolsa === 'comida')
    const gastosColchon = gastos.filter((g) => g.bolsa === 'colchon')

    const fechaCobro = fechaProximoCobro(cycle.fechaInicio, settings.diaCobroHabitual)

    return {
      cycle,
      settings,
      gastos,
      colchonInicial,
      colchonDisponible: calcularDisponibleBolsa(colchonInicial, gastosColchon),
      comidaInicial: settings.presupuestoComidaMensual,
      comidaDisponible: calcularDisponibleBolsa(settings.presupuestoComidaMensual, gastosComida),
      totalFijos: fijos,
      totalFraccionados: fraccionados,
      totalAhorroProgramado: ahorro,
      totalAproximado: aproximadoEnVivo,
      aproximados,
      fechaProximoCobro: fechaCobro,
      diasHastaProximoCobro: diasHasta(fechaCobro, hoyISO()),
    }
  }, [])
}
