import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { PeriodicItem } from '../../core/types'
import { GestionGastoDB } from '../schema'
import { anadirGasto, eliminarGasto } from './gastos'
import { crearPeriodicItem } from './periodicItems'
import { registrarImporteReal } from './registrosAproximado'
import { actualizarSettings } from './settings'
import {
  listarCiclosCerrados,
  obtenerCiclo,
  obtenerCicloAbierto,
  previsualizarCierreCicloActual,
  registrarSalario,
} from './cycles'

function crearDbDeTest(): GestionGastoDB {
  return new GestionGastoDB(`test-${crypto.randomUUID()}`)
}

describe('registrarSalario', () => {
  let db: GestionGastoDB

  beforeEach(() => {
    db = crearDbDeTest()
  })

  it('primer salario: no hay nada que cerrar (sin histórico)', async () => {
    const ciclo = await registrarSalario(db, 150000, '2026-10-04')

    expect(ciclo.numero).toBe(1)
    expect(ciclo.estado).toBe('abierto')
    expect(ciclo.deficitArrastrado).toBe(0)
    expect(ciclo.resumenCierre).toBeNull()
    expect(await listarCiclosCerrados(db)).toHaveLength(0)
    expect(await db.huchaMovimientos.toArray()).toHaveLength(0)
  })

  it('aparta el ahorro programado en la hucha al abrir el ciclo', async () => {
    await crearPeriodicItem(db, {
      nombre: 'Ahorro mensual',
      tipo: 'ahorro',
      importeMensual: 20000,
      fechaInicio: '2026-01-01',
      fechaFin: null,
    })

    const ciclo = await registrarSalario(db, 150000, '2026-10-04')

    const movimientos = await db.huchaMovimientos.toArray()
    expect(movimientos).toHaveLength(1)
    expect(movimientos[0]).toMatchObject({
      origen: 'ahorro_programado',
      importe: 20000,
      cicloId: ciclo.id,
      fecha: '2026-10-04',
    })
  })

  it('cierra el ciclo anterior con sobrante y lo aporta a la hucha como "Sobrante del ciclo N"', async () => {
    await actualizarSettings(db, { presupuestoComidaMensual: 25000 })
    await crearPeriodicItem(db, {
      nombre: 'Alquiler',
      tipo: 'fijo',
      importeMensual: 50000,
      fechaInicio: '2026-01-01',
      fechaFin: null,
    })

    const ciclo1 = await registrarSalario(db, 150000, '2026-10-04')
    // colchonInicial = 150000 - 50000 (fijo) - 25000 (comida) = 75000
    await anadirGasto(db, { cicloId: ciclo1.id, bolsa: 'comida', importe: 20000, concepto: null, fecha: '2026-10-10' })
    await anadirGasto(db, { cicloId: ciclo1.id, bolsa: 'colchon', importe: 30000, concepto: null, fecha: '2026-10-12' })
    // sobrante comida = 5000, sobrante colchón = 45000 -> aportación hucha = 50000

    const ciclo2 = await registrarSalario(db, 150000, '2026-11-04')

    const cicloCerrado = await obtenerCiclo(db, ciclo1.id)
    expect(cicloCerrado?.estado).toBe('cerrado')
    expect(cicloCerrado?.fechaFin).toBe('2026-11-04')
    expect(cicloCerrado?.resumenCierre?.sobranteComida).toBe(5000)
    expect(cicloCerrado?.resumenCierre?.sobranteColchon).toBe(45000)
    expect(cicloCerrado?.resumenCierre?.aportacionHuchaSobrante).toBe(50000)

    const movimientoSobrante = (await db.huchaMovimientos.toArray()).find((m) => m.origen === 'sobrante_ciclo')
    expect(movimientoSobrante).toMatchObject({
      importe: 50000,
      concepto: 'Sobrante del ciclo 1',
      cicloId: ciclo1.id,
    })

    expect(ciclo2.numero).toBe(2)
    expect(ciclo2.deficitArrastrado).toBe(0)
  })

  it('arrastra el déficit de una bolsa en negativo al colchón del ciclo nuevo, sin restarlo de la hucha', async () => {
    await actualizarSettings(db, { presupuestoComidaMensual: 25000 })

    const ciclo1 = await registrarSalario(db, 100000, '2026-10-04')
    // colchonInicial = 100000 - 25000 (comida) = 75000
    await anadirGasto(db, { cicloId: ciclo1.id, bolsa: 'comida', importe: 10000, concepto: null, fecha: '2026-10-10' })
    // sobrante comida = 15000
    await anadirGasto(db, { cicloId: ciclo1.id, bolsa: 'colchon', importe: 90000, concepto: null, fecha: '2026-10-12' })
    // sobrante colchón = 75000 - 90000 = -15000 (déficit)

    const ciclo2 = await registrarSalario(db, 100000, '2026-11-04')

    const cicloCerrado = await obtenerCiclo(db, ciclo1.id)
    expect(cicloCerrado?.resumenCierre?.deficitDetectado).toEqual({ comida: 0, colchon: 15000 })
    // solo el sobrante positivo de comida entra en la hucha
    expect(cicloCerrado?.resumenCierre?.aportacionHuchaSobrante).toBe(15000)

    expect(ciclo2.deficitArrastrado).toBe(15000)
    const movimientoSobrante = (await db.huchaMovimientos.toArray()).find((m) => m.origen === 'sobrante_ciclo')
    expect(movimientoSobrante?.importe).toBe(15000)
  })
})

describe('previsualizarCierreCicloActual', () => {
  let db: GestionGastoDB

  beforeEach(() => {
    db = crearDbDeTest()
  })

  it('devuelve null si no hay ciclo abierto', async () => {
    expect(await previsualizarCierreCicloActual(db)).toBeNull()
  })

  it('coincide exactamente con el resumen que se congela al registrar el salario', async () => {
    await actualizarSettings(db, { presupuestoComidaMensual: 25000 })
    const ciclo1 = await registrarSalario(db, 150000, '2026-10-04')
    await anadirGasto(db, { cicloId: ciclo1.id, bolsa: 'comida', importe: 5000, concepto: null, fecha: '2026-10-10' })

    const preview = await previsualizarCierreCicloActual(db)
    await registrarSalario(db, 150000, '2026-11-04')
    const cicloCerrado = await obtenerCiclo(db, ciclo1.id)

    expect(cicloCerrado?.resumenCierre).toEqual(preview)
  })
})

describe('ciclo cerrado: histórico de solo lectura', () => {
  let db: GestionGastoDB
  let cicloCerradoId: string

  beforeEach(async () => {
    db = crearDbDeTest()
    const ciclo1 = await registrarSalario(db, 150000, '2026-10-04')
    cicloCerradoId = ciclo1.id
    await registrarSalario(db, 150000, '2026-11-04') // cierra ciclo1
  })

  it('no permite añadir gastos a un ciclo cerrado', async () => {
    await expect(
      anadirGasto(db, { cicloId: cicloCerradoId, bolsa: 'comida', importe: 1000, concepto: null, fecha: '2026-11-10' }),
    ).rejects.toThrow()
  })

  it('no permite registrar el importe real de un aproximado en un ciclo cerrado', async () => {
    const luz: PeriodicItem = await crearPeriodicItem(db, {
      nombre: 'Luz',
      tipo: 'aproximado',
      importeMensual: 4000,
      fechaInicio: '2026-01-01',
      fechaFin: null,
    })
    await expect(registrarImporteReal(db, cicloCerradoId, luz.id, 4800)).rejects.toThrow()
  })

  it('no permite borrar un gasto que pertenece a un ciclo ya cerrado', async () => {
    // El gasto se creó cuando el ciclo todavía estaba abierto, antes del beforeEach de este bloque;
    // aquí simplemente comprobamos que el guard mira el estado actual del ciclo, no el de creación.
    const abierto = await obtenerCicloAbierto(db)
    const gasto = await anadirGasto(db, {
      cicloId: abierto!.id,
      bolsa: 'comida',
      importe: 1000,
      concepto: null,
      fecha: '2026-11-10',
    })
    await registrarSalario(db, 150000, '2026-12-04') // cierra el ciclo que contiene ese gasto

    await expect(eliminarGasto(db, gasto.id)).rejects.toThrow()
  })
})
