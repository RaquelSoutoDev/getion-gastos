import type { Settings } from '../../core/types'
import { type GestionGastoDB, SETTINGS_ID } from '../schema'

export const DEFAULT_SETTINGS: Settings = {
  presupuestoComidaMensual: 0,
  diaCobroHabitual: 1,
  ultimaExportacion: null,
}

export async function obtenerSettings(db: GestionGastoDB): Promise<Settings> {
  const fila = await db.settings.get(SETTINGS_ID)
  if (!fila) return DEFAULT_SETTINGS
  const { id: _id, ...settings } = fila
  return settings
}

export async function guardarSettings(db: GestionGastoDB, settings: Settings): Promise<void> {
  await db.settings.put({ id: SETTINGS_ID, ...settings })
}

export async function actualizarSettings(db: GestionGastoDB, cambios: Partial<Settings>): Promise<Settings> {
  const actual = await obtenerSettings(db)
  const nuevo = { ...actual, ...cambios }
  await guardarSettings(db, nuevo)
  return nuevo
}
