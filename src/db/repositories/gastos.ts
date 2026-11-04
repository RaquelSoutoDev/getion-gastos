import type { Bolsa, Gasto } from '../../core/types'
import type { GestionGastoDB } from '../schema'
import { asegurarCicloAbierto } from './_guards'

export async function listarGastosDeCiclo(db: GestionGastoDB, cicloId: string): Promise<Gasto[]> {
  return db.gastos.where('cicloId').equals(cicloId).toArray()
}

export interface DatosNuevoGasto {
  cicloId: string
  bolsa: Bolsa
  importe: number
  concepto: string | null
  fecha: string
}

export async function anadirGasto(db: GestionGastoDB, datos: DatosNuevoGasto): Promise<Gasto> {
  await asegurarCicloAbierto(db, datos.cicloId)
  const gasto: Gasto = { ...datos, id: crypto.randomUUID() }
  await db.gastos.add(gasto)
  return gasto
}

export async function actualizarGasto(
  db: GestionGastoDB,
  id: string,
  cambios: Partial<Pick<Gasto, 'bolsa' | 'importe' | 'concepto' | 'fecha'>>,
): Promise<void> {
  const gasto = await db.gastos.get(id)
  if (!gasto) return
  await asegurarCicloAbierto(db, gasto.cicloId)
  await db.gastos.update(id, cambios)
}

export async function eliminarGasto(db: GestionGastoDB, id: string): Promise<void> {
  const gasto = await db.gastos.get(id)
  if (!gasto) return
  await asegurarCicloAbierto(db, gasto.cicloId)
  await db.gastos.delete(id)
}
