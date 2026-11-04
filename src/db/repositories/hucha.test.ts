import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { GestionGastoDB } from '../schema'
import { anadirMovimientoManual, listarMovimientosHucha, obtenerSaldoHucha } from './hucha'

function crearDbDeTest(): GestionGastoDB {
  return new GestionGastoDB(`test-${crypto.randomUUID()}`)
}

describe('hucha', () => {
  it('el saldo empieza en 0 sin movimientos', async () => {
    const db = crearDbDeTest()
    expect(await obtenerSaldoHucha(db)).toBe(0)
  })

  it('un movimiento manual se refleja en el saldo y en el listado', async () => {
    const db = crearDbDeTest()
    await anadirMovimientoManual(db, { importe: 5000, concepto: 'Ingreso extra', fecha: '2026-10-05' })

    expect(await obtenerSaldoHucha(db)).toBe(5000)
    const movimientos = await listarMovimientosHucha(db)
    expect(movimientos).toHaveLength(1)
    expect(movimientos[0]).toMatchObject({ origen: 'manual', importe: 5000, concepto: 'Ingreso extra' })
  })

  it('admite retiros manuales (importe negativo)', async () => {
    const db = crearDbDeTest()
    await anadirMovimientoManual(db, { importe: 5000, concepto: null, fecha: '2026-10-05' })
    await anadirMovimientoManual(db, { importe: -2000, concepto: 'Retiro puntual', fecha: '2026-10-06' })

    expect(await obtenerSaldoHucha(db)).toBe(3000)
  })
})
