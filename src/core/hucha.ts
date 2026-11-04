import type { Centimos, HuchaMovimiento } from './types'

/** El saldo de la hucha nunca se guarda: siempre es la suma de sus movimientos. */
export function calcularSaldoHucha(movimientos: Pick<HuchaMovimiento, 'importe'>[]): Centimos {
  return movimientos.reduce((suma, m) => suma + m.importe, 0)
}
