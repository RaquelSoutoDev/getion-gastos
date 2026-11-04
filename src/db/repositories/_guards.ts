import type { GestionGastoDB } from '../schema'

/** Un ciclo cerrado es histórico de solo lectura: nunca se editan sus gastos ni registros. */
export async function asegurarCicloAbierto(db: GestionGastoDB, cicloId: string): Promise<void> {
  const ciclo = await db.cycles.get(cicloId)
  if (ciclo && ciclo.estado === 'cerrado') {
    throw new Error('No se puede modificar un ciclo cerrado: es histórico de solo lectura')
  }
}
