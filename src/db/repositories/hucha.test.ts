import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { GestionGastoDB } from '../schema'
import { registrarSalario } from './cycles'
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

  it('un retiro con cicloDestinoId reduce la hucha y añade el mismo importe al colchón del ciclo', async () => {
    const db = crearDbDeTest()
    const ciclo = await registrarSalario(db, 150000, '2026-10-04')
    await anadirMovimientoManual(db, { importe: 5000, concepto: null, fecha: '2026-10-05' })

    await anadirMovimientoManual(db, {
      importe: -2000,
      concepto: 'Para gastos del ciclo',
      fecha: '2026-10-06',
      cicloDestinoId: ciclo.id,
    })

    expect(await obtenerSaldoHucha(db)).toBe(3000)

    const gastos = await db.gastos.where('cicloId').equals(ciclo.id).toArray()
    expect(gastos).toHaveLength(1)
    expect(gastos[0]).toMatchObject({ bolsa: 'colchon', importe: -2000, concepto: 'Para gastos del ciclo' })
  })

  it('un retiro sin concepto, enlazado al colchón, usa textos por defecto', async () => {
    const db = crearDbDeTest()
    const ciclo = await registrarSalario(db, 150000, '2026-10-04')

    await anadirMovimientoManual(db, {
      importe: -2000,
      concepto: null,
      fecha: '2026-10-06',
      cicloDestinoId: ciclo.id,
    })

    const movimientos = await listarMovimientosHucha(db)
    expect(movimientos[0].concepto).toBe('Retiro hacia el colchón')

    const gastos = await db.gastos.where('cicloId').equals(ciclo.id).toArray()
    expect(gastos[0].concepto).toBe('Desde la hucha')
  })

  it('no permite enlazar un retiro a un ciclo ya cerrado', async () => {
    const db = crearDbDeTest()
    const ciclo1 = await registrarSalario(db, 150000, '2026-10-04')
    await registrarSalario(db, 150000, '2026-11-04') // cierra ciclo1

    await expect(
      anadirMovimientoManual(db, {
        importe: -2000,
        concepto: null,
        fecha: '2026-11-10',
        cicloDestinoId: ciclo1.id,
      }),
    ).rejects.toThrow()
  })
})
