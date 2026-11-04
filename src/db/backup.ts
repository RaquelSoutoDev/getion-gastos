import type { Cycle, Gasto, HuchaMovimiento, PeriodicItem, RegistroAproximado, Settings } from '../core/types'
import { type GestionGastoDB, SETTINGS_ID } from './schema'
import { DEFAULT_SETTINGS, obtenerSettings } from './repositories/settings'

const BACKUP_VERSION = 1

export interface BackupData {
  version: typeof BACKUP_VERSION
  exportadoEn: string
  settings: Settings
  periodicItems: PeriodicItem[]
  cycles: Cycle[]
  gastos: Gasto[]
  registrosAproximado: RegistroAproximado[]
  huchaMovimientos: HuchaMovimiento[]
}

export async function exportarDatos(db: GestionGastoDB): Promise<BackupData> {
  const [settings, periodicItems, cycles, gastos, registrosAproximado, huchaMovimientos] = await Promise.all([
    obtenerSettings(db),
    db.periodicItems.toArray(),
    db.cycles.toArray(),
    db.gastos.toArray(),
    db.registrosAproximado.toArray(),
    db.huchaMovimientos.toArray(),
  ])

  return {
    version: BACKUP_VERSION,
    exportadoEn: new Date().toISOString(),
    settings,
    periodicItems,
    cycles,
    gastos,
    registrosAproximado,
    huchaMovimientos,
  }
}

function esBackupValido(data: unknown): data is BackupData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    d.version === BACKUP_VERSION &&
    typeof d.settings === 'object' &&
    Array.isArray(d.periodicItems) &&
    Array.isArray(d.cycles) &&
    Array.isArray(d.gastos) &&
    Array.isArray(d.registrosAproximado) &&
    Array.isArray(d.huchaMovimientos)
  )
}

export function parsearBackup(texto: string): BackupData {
  let data: unknown
  try {
    data = JSON.parse(texto)
  } catch {
    throw new Error('El archivo no es un JSON válido')
  }
  if (!esBackupValido(data)) {
    throw new Error('El archivo no tiene el formato de backup esperado')
  }
  return data
}

/** Reemplaza TODOS los datos del dispositivo por los del backup. Operación atómica. */
export async function importarDatos(db: GestionGastoDB, data: BackupData): Promise<void> {
  await db.transaction(
    'rw',
    [db.settings, db.periodicItems, db.cycles, db.gastos, db.registrosAproximado, db.huchaMovimientos],
    async () => {
      await Promise.all([
        db.settings.clear(),
        db.periodicItems.clear(),
        db.cycles.clear(),
        db.gastos.clear(),
        db.registrosAproximado.clear(),
        db.huchaMovimientos.clear(),
      ])
      await Promise.all([
        db.settings.add({ id: SETTINGS_ID, ...data.settings }),
        db.periodicItems.bulkAdd(data.periodicItems),
        db.cycles.bulkAdd(data.cycles),
        db.gastos.bulkAdd(data.gastos),
        db.registrosAproximado.bulkAdd(data.registrosAproximado),
        db.huchaMovimientos.bulkAdd(data.huchaMovimientos),
      ])
    },
  )
}

/** Borra todos los datos del dispositivo, dejando los ajustes en sus valores por defecto. */
export async function borrarTodo(db: GestionGastoDB): Promise<void> {
  await db.transaction(
    'rw',
    [db.settings, db.periodicItems, db.cycles, db.gastos, db.registrosAproximado, db.huchaMovimientos],
    async () => {
      await Promise.all([
        db.settings.clear(),
        db.periodicItems.clear(),
        db.cycles.clear(),
        db.gastos.clear(),
        db.registrosAproximado.clear(),
        db.huchaMovimientos.clear(),
      ])
      await db.settings.add({ id: SETTINGS_ID, ...DEFAULT_SETTINGS })
    },
  )
}
