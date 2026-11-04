import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { GestionGastoDB } from '../schema'
import { DEFAULT_SETTINGS, actualizarSettings, obtenerSettings } from './settings'

function crearDbDeTest(): GestionGastoDB {
  return new GestionGastoDB(`test-${crypto.randomUUID()}`)
}

describe('settings', () => {
  it('devuelve los valores por defecto si no se han guardado ajustes', async () => {
    const db = crearDbDeTest()
    expect(await obtenerSettings(db)).toEqual(DEFAULT_SETTINGS)
  })

  it('actualizarSettings fusiona cambios parciales sobre lo existente', async () => {
    const db = crearDbDeTest()
    await actualizarSettings(db, { presupuestoComidaMensual: 30000 })
    const resultado = await actualizarSettings(db, { diaCobroHabitual: 5 })

    expect(resultado).toEqual({ presupuestoComidaMensual: 30000, diaCobroHabitual: 5, ultimaExportacion: null })
  })
})
