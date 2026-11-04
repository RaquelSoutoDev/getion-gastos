import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { GestionGastoDB } from '../schema'
import {
  actualizarPeriodicItem,
  crearPeriodicItem,
  eliminarPeriodicItem,
  listarPeriodicItems,
  pausarPeriodicItem,
  reactivarPeriodicItem,
} from './periodicItems'

function crearDbDeTest(): GestionGastoDB {
  return new GestionGastoDB(`test-${crypto.randomUUID()}`)
}

describe('periodicItems', () => {
  it('crea un item activo por defecto', async () => {
    const db = crearDbDeTest()
    const item = await crearPeriodicItem(db, {
      nombre: 'Gimnasio',
      tipo: 'fijo',
      importeMensual: 3000,
      fechaInicio: '2026-01-01',
      fechaFin: null,
    })
    expect(item.estado).toBe('activo')
    expect(await listarPeriodicItems(db)).toHaveLength(1)
  })

  it('pausar y reactivar cambian el estado sin borrar el item', async () => {
    const db = crearDbDeTest()
    const item = await crearPeriodicItem(db, {
      nombre: 'Gimnasio',
      tipo: 'fijo',
      importeMensual: 3000,
      fechaInicio: '2026-01-01',
      fechaFin: null,
    })

    await pausarPeriodicItem(db, item.id)
    expect((await listarPeriodicItems(db))[0].estado).toBe('pausado')

    await reactivarPeriodicItem(db, item.id)
    expect((await listarPeriodicItems(db))[0].estado).toBe('activo')
  })

  it('eliminar hace soft-delete: el item sigue existiendo con estado "eliminado"', async () => {
    const db = crearDbDeTest()
    const item = await crearPeriodicItem(db, {
      nombre: 'Gimnasio',
      tipo: 'fijo',
      importeMensual: 3000,
      fechaInicio: '2026-01-01',
      fechaFin: null,
    })

    await eliminarPeriodicItem(db, item.id)

    const items = await listarPeriodicItems(db)
    expect(items).toHaveLength(1)
    expect(items[0].estado).toBe('eliminado')
  })

  it('actualizarPeriodicItem cambia los campos indicados', async () => {
    const db = crearDbDeTest()
    const item = await crearPeriodicItem(db, {
      nombre: 'Gimnasio',
      tipo: 'fijo',
      importeMensual: 3000,
      fechaInicio: '2026-01-01',
      fechaFin: null,
    })

    await actualizarPeriodicItem(db, item.id, { importeMensual: 3500 })

    expect((await listarPeriodicItems(db))[0].importeMensual).toBe(3500)
  })
})
