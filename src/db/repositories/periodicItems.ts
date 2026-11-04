import type { PeriodicItem } from '../../core/types'
import type { GestionGastoDB } from '../schema'

export async function listarPeriodicItems(db: GestionGastoDB): Promise<PeriodicItem[]> {
  return db.periodicItems.toArray()
}

export async function crearPeriodicItem(
  db: GestionGastoDB,
  datos: Omit<PeriodicItem, 'id' | 'estado'>,
): Promise<PeriodicItem> {
  const item: PeriodicItem = { ...datos, id: crypto.randomUUID(), estado: 'activo' }
  await db.periodicItems.add(item)
  return item
}

export async function actualizarPeriodicItem(
  db: GestionGastoDB,
  id: string,
  cambios: Partial<Omit<PeriodicItem, 'id'>>,
): Promise<void> {
  await db.periodicItems.update(id, cambios)
}

export async function pausarPeriodicItem(db: GestionGastoDB, id: string): Promise<void> {
  await db.periodicItems.update(id, { estado: 'pausado' })
}

export async function reactivarPeriodicItem(db: GestionGastoDB, id: string): Promise<void> {
  await db.periodicItems.update(id, { estado: 'activo' })
}

/** Soft-delete: nunca se borra físicamente, para no romper los resúmenes de ciclos ya cerrados. */
export async function eliminarPeriodicItem(db: GestionGastoDB, id: string): Promise<void> {
  await db.periodicItems.update(id, { estado: 'eliminado' })
}
