import type { RegistroAproximado } from '../../core/types'
import type { GestionGastoDB } from '../schema'
import { asegurarCicloAbierto } from './_guards'

export async function listarRegistrosDeCiclo(db: GestionGastoDB, cicloId: string): Promise<RegistroAproximado[]> {
  return db.registrosAproximado.where('cicloId').equals(cicloId).toArray()
}

/** Crea o actualiza el importe real de un "aproximado" para un ciclo (upsert por cicloId+periodicItemId). */
export async function registrarImporteReal(
  db: GestionGastoDB,
  cicloId: string,
  periodicItemId: string,
  importeReal: number,
): Promise<void> {
  await asegurarCicloAbierto(db, cicloId)

  const existente = await db.registrosAproximado
    .where('[cicloId+periodicItemId]')
    .equals([cicloId, periodicItemId])
    .first()

  if (existente) {
    await db.registrosAproximado.update(existente.id, { importeReal })
  } else {
    const registro: RegistroAproximado = { id: crypto.randomUUID(), cicloId, periodicItemId, importeReal }
    await db.registrosAproximado.add(registro)
  }
}
