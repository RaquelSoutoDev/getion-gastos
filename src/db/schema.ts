import Dexie, { type EntityTable } from 'dexie'
import type { Cycle, Gasto, HuchaMovimiento, PeriodicItem, RegistroAproximado, Settings } from '../core/types'

export const SETTINGS_ID = 'settings'

/** Fila de ajustes en IndexedDB: los `Settings` del dominio más un id fijo de singleton. */
export type SettingsRow = Settings & { id: typeof SETTINGS_ID }

export class GestionGastoDB extends Dexie {
  settings!: EntityTable<SettingsRow, 'id'>
  periodicItems!: EntityTable<PeriodicItem, 'id'>
  cycles!: EntityTable<Cycle, 'id'>
  gastos!: EntityTable<Gasto, 'id'>
  registrosAproximado!: EntityTable<RegistroAproximado, 'id'>
  huchaMovimientos!: EntityTable<HuchaMovimiento, 'id'>

  constructor(name = 'gestion-gasto') {
    super(name)
    this.version(1).stores({
      settings: 'id',
      periodicItems: 'id, tipo, estado',
      cycles: 'id, numero, estado',
      gastos: 'id, cicloId, bolsa, fecha',
      registrosAproximado: 'id, cicloId, periodicItemId, &[cicloId+periodicItemId]',
      huchaMovimientos: 'id, fecha, cicloId, origen',
    })
  }
}

export const db = new GestionGastoDB()
