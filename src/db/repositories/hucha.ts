import { calcularSaldoHucha } from '../../core/hucha'
import type { HuchaMovimiento } from '../../core/types'
import type { GestionGastoDB } from '../schema'
import { asegurarCicloAbierto } from './_guards'

export async function listarMovimientosHucha(db: GestionGastoDB): Promise<HuchaMovimiento[]> {
  return db.huchaMovimientos.orderBy('fecha').reverse().toArray()
}

export async function obtenerSaldoHucha(db: GestionGastoDB): Promise<number> {
  const movimientos = await db.huchaMovimientos.toArray()
  return calcularSaldoHucha(movimientos)
}

export interface DatosMovimientoManual {
  /** Positivo = aportación, negativo = retiro. */
  importe: number
  concepto: string | null
  fecha: string
  /**
   * Si se indica (normalmente en un retiro), el mismo importe se refleja
   * también como un gasto en negativo en la bolsa colchón de ese ciclo, de
   * modo que el dinero retirado de la hucha quede disponible para gastar.
   */
  cicloDestinoId?: string
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
    concepto: datos.concepto ?? (datos.cicloDestinoId ? 'Retiro hacia el colchón' : null),
    cicloId: null,
  }

  if (!datos.cicloDestinoId) {
    await db.huchaMovimientos.add(movimiento)
    return movimiento
  }

  await db.transaction('rw', [db.huchaMovimientos, db.gastos, db.cycles], async () => {
    await asegurarCicloAbierto(db, datos.cicloDestinoId as string)
    await db.huchaMovimientos.add(movimiento)
    await db.gastos.add({
      id: crypto.randomUUID(),
      cicloId: datos.cicloDestinoId as string,
      bolsa: 'colchon',
      // Mismo signo que el movimiento de hucha: al restar un importe negativo, el colchón disponible sube.
      importe: datos.importe,
      concepto: datos.concepto ?? 'Desde la hucha',
      fecha: datos.fecha,
    })
  })

  return movimiento
}
