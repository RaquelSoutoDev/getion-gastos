import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { anadirMovimientoManual } from './repositories/hucha'
import { crearPeriodicItem } from './repositories/periodicItems'
import { registrarSalario } from './repositories/cycles'
import { DEFAULT_SETTINGS, actualizarSettings, obtenerSettings } from './repositories/settings'
import { borrarTodo, exportarDatos, importarDatos, parsearBackup } from './backup'
import { GestionGastoDB } from './schema'

function crearDbDeTest(): GestionGastoDB {
  return new GestionGastoDB(`test-${crypto.randomUUID()}`)
}

describe('exportarDatos / importarDatos', () => {
  let origen: GestionGastoDB
  let destino: GestionGastoDB

  beforeEach(() => {
    origen = crearDbDeTest()
    destino = crearDbDeTest()
  })

  it('reproduce exactamente los mismos datos en otra base de datos', async () => {
    await actualizarSettings(origen, { presupuestoComidaMensual: 30000, diaCobroHabitual: 5 })
    await crearPeriodicItem(origen, {
      nombre: 'Alquiler',
      tipo: 'fijo',
      importeMensual: 50000,
      fechaInicio: '2026-01-01',
      fechaFin: null,
    })
    await registrarSalario(origen, 150000, '2026-10-04')
    await anadirMovimientoManual(origen, { importe: 5000, concepto: 'Ingreso extra', fecha: '2026-10-05' })

    const backup = exportarDatosComoTexto(await exportarDatos(origen))
    await importarDatos(destino, parsearBackup(backup))

    expect(await obtenerSettings(destino)).toEqual(await obtenerSettings(origen))
    expect(await destino.periodicItems.toArray()).toEqual(await origen.periodicItems.toArray())
    expect(await destino.cycles.toArray()).toEqual(await origen.cycles.toArray())
    expect(await destino.huchaMovimientos.toArray()).toEqual(await origen.huchaMovimientos.toArray())
  })

  it('al importar, reemplaza todo lo que hubiera antes en el destino', async () => {
    await crearPeriodicItem(destino, {
      nombre: 'Dato antiguo que debe desaparecer',
      tipo: 'fijo',
      importeMensual: 1,
      fechaInicio: '2020-01-01',
      fechaFin: null,
    })

    const backupVacio = await exportarDatos(origen)
    await importarDatos(destino, backupVacio)

    expect(await destino.periodicItems.toArray()).toHaveLength(0)
  })
})

describe('parsearBackup', () => {
  it('rechaza un JSON que no tiene forma de backup', () => {
    expect(() => parsearBackup('{"foo":"bar"}')).toThrow()
  })

  it('rechaza texto que no es JSON', () => {
    expect(() => parsearBackup('esto no es json')).toThrow()
  })
})

describe('borrarTodo', () => {
  it('deja la base de datos vacía y los ajustes en sus valores por defecto', async () => {
    const db = crearDbDeTest()
    await actualizarSettings(db, { presupuestoComidaMensual: 99999 })
    await crearPeriodicItem(db, {
      nombre: 'Algo',
      tipo: 'fijo',
      importeMensual: 1000,
      fechaInicio: '2026-01-01',
      fechaFin: null,
    })
    await registrarSalario(db, 150000, '2026-10-04')

    await borrarTodo(db)

    expect(await db.periodicItems.toArray()).toHaveLength(0)
    expect(await db.cycles.toArray()).toHaveLength(0)
    expect(await obtenerSettings(db)).toEqual(DEFAULT_SETTINGS)
  })
})

function exportarDatosComoTexto(data: unknown): string {
  return JSON.stringify(data)
}
