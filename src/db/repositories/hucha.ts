import { calcularSaldoHucha } from '../../core/hucha'
import type { HuchaMovimiento } from '../../core/types'
import type { GestionGastoDB } from '../schema'

export async function listarMovimientosHucha(db: GestionGastoDB): Promise<HuchaMovimiento[]> {
  return db.huchaMovimientos.orderBy('fecha').reverse().toArray()
}

export async function obtenerSaldoHucha(db: GestionGastoDB): Promise<number> {
  const movimientos = await db.huchaMovimientos.toArray()
  return calcularSaldoHucha(movimientos)
}

export interface DatosMovimientoManual {
  importe: number
  concepto: string | null
  fecha: string
}

export async function anadirMovimientoManual(
  db: GestionGastoDB,
  datos: DatosMovimientoManual,
): Promise<HuchaMovimiento> {
  const movimiento: HuchaMovimiento = {
    id: crypto.randomUUID(),
    fecha: datos.fecha,
    importe: datos.importe,
    origen: 'manual',
    concepto: datos.concepto,
    cicloId: null,
  }
  await db.huchaMovimientos.add(movimiento)
  return movimiento
}
