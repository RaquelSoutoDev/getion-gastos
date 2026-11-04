import type { Centimos, Gasto } from './types'

export interface ComponentesColchonInicial {
  salarioImporte: Centimos
  totalFijos: Centimos
  totalFraccionados: Centimos
  /** Suma de los importes reales (o presupuesto si aún no hay real) de los "aproximados". */
  totalAproximado: Centimos
  totalAhorroProgramado: Centimos
  presupuestoComida: Centimos
  deficitArrastrado: Centimos
}

export function calcularColchonInicial(c: ComponentesColchonInicial): Centimos {
  return (
    c.salarioImporte -
    c.totalFijos -
    c.totalFraccionados -
    c.totalAproximado -
    c.totalAhorroProgramado -
    c.presupuestoComida -
    c.deficitArrastrado
  )
}

/**
 * Disponible de una bolsa (comida o colchón): su presupuesto/colchón inicial
 * menos los gastos registrados en ella. Puede salir negativo.
 */
export function calcularDisponibleBolsa(presupuestoInicial: Centimos, gastos: Pick<Gasto, 'importe'>[]): Centimos {
  return presupuestoInicial - gastos.reduce((suma, g) => suma + g.importe, 0)
}
