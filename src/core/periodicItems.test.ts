import { describe, expect, it } from 'vitest'
import {
  cuotasRestantes,
  esFraccionadoVigente,
  resolverAproximados,
  totalAhorroProgramado,
  totalAproximadoEnVivo,
  totalFijos,
  totalFraccionadosVigentes,
} from './periodicItems'
import type { PeriodicItem, RegistroAproximado } from './types'

function item(overrides: Partial<PeriodicItem>): PeriodicItem {
  return {
    id: 'item-1',
    nombre: 'Item',
    tipo: 'fijo',
    importeMensual: 1000,
    fechaInicio: '2026-01-01',
    fechaFin: null,
    estado: 'activo',
    ...overrides,
  }
}

describe('esFraccionadoVigente', () => {
  it('es vigente mientras el ciclo empiece antes o igual a la fecha fin', () => {
    const universidad = item({ tipo: 'fraccionado', fechaFin: '2026-11-30' })
    expect(esFraccionadoVigente(universidad, '2026-11-04')).toBe(true)
  })

  it('deja de ser vigente en el ciclo que empieza después de la fecha fin (fraccionado que termina este mes)', () => {
    const universidad = item({ tipo: 'fraccionado', fechaFin: '2026-11-30' })
    expect(esFraccionadoVigente(universidad, '2026-12-05')).toBe(false)
  })

  it('es vigente siempre si no tiene fecha fin', () => {
    const ordenador = item({ tipo: 'fraccionado', fechaFin: null })
    expect(esFraccionadoVigente(ordenador, '2030-01-01')).toBe(true)
  })

  it('no es vigente si está pausado o eliminado', () => {
    const pausado = item({ tipo: 'fraccionado', fechaFin: '2030-01-01', estado: 'pausado' })
    const eliminado = item({ tipo: 'fraccionado', fechaFin: '2030-01-01', estado: 'eliminado' })
    expect(esFraccionadoVigente(pausado, '2026-11-04')).toBe(false)
    expect(esFraccionadoVigente(eliminado, '2026-11-04')).toBe(false)
  })

  it('no aplica a otros tipos', () => {
    const fijo = item({ tipo: 'fijo' })
    expect(esFraccionadoVigente(fijo, '2026-11-04')).toBe(false)
  })
})

describe('cuotasRestantes', () => {
  it('cuenta 1 cuando termina este mismo mes (fraccionado que termina este mes)', () => {
    const universidad = item({ tipo: 'fraccionado', fechaFin: '2026-11-30' })
    expect(cuotasRestantes(universidad, '2026-11-04')).toBe(1)
  })

  it('cuenta varios meses hasta la fecha fin', () => {
    const universidad = item({ tipo: 'fraccionado', fechaFin: '2027-06-30' })
    expect(cuotasRestantes(universidad, '2026-11-04')).toBe(8)
  })

  it('se clampa a 0 cuando ya ha terminado, nunca negativo', () => {
    const universidad = item({ tipo: 'fraccionado', fechaFin: '2026-09-30' })
    expect(cuotasRestantes(universidad, '2026-11-04')).toBe(0)
  })

  it('devuelve null si no tiene fecha fin', () => {
    const ordenador = item({ tipo: 'fraccionado', fechaFin: null })
    expect(cuotasRestantes(ordenador, '2026-11-04')).toBeNull()
  })

  it('devuelve null si no es fraccionado', () => {
    const fijo = item({ tipo: 'fijo' })
    expect(cuotasRestantes(fijo, '2026-11-04')).toBeNull()
  })
})

describe('totalFijos', () => {
  it('suma solo los fijos activos', () => {
    const items = [
      item({ id: '1', tipo: 'fijo', importeMensual: 50000 }),
      item({ id: '2', tipo: 'fijo', importeMensual: 3000, estado: 'pausado' }),
      item({ id: '3', tipo: 'fraccionado', importeMensual: 1000 }),
    ]
    expect(totalFijos(items)).toBe(50000)
  })
})

describe('totalFraccionadosVigentes', () => {
  it('suma solo los vigentes para la fecha de inicio del ciclo', () => {
    const items = [
      item({ id: '1', tipo: 'fraccionado', importeMensual: 4000, fechaFin: '2026-11-30' }),
      item({ id: '2', tipo: 'fraccionado', importeMensual: 2000, fechaFin: '2026-09-30' }),
    ]
    expect(totalFraccionadosVigentes(items, '2026-11-04')).toBe(4000)
  })
})

describe('totalAhorroProgramado', () => {
  it('suma solo los ahorros activos', () => {
    const items = [
      item({ id: '1', tipo: 'ahorro', importeMensual: 10000 }),
      item({ id: '2', tipo: 'ahorro', importeMensual: 5000, estado: 'eliminado' }),
    ]
    expect(totalAhorroProgramado(items)).toBe(10000)
  })
})

describe('resolverAproximados', () => {
  it('usa el presupuesto cuando no hay importe real registrado (aproximado sin importe real)', () => {
    const items = [item({ id: 'luz', tipo: 'aproximado', nombre: 'Luz', importeMensual: 4000 })]
    const registros: RegistroAproximado[] = []
    const detalles = resolverAproximados(items, registros, 'ciclo-1')
    expect(detalles).toEqual([
      { periodicItemId: 'luz', nombre: 'Luz', presupuesto: 4000, real: 4000, diferencia: 0 },
    ])
  })

  it('usa el importe real cuando ya se ha registrado', () => {
    const items = [item({ id: 'luz', tipo: 'aproximado', nombre: 'Luz', importeMensual: 4000 })]
    const registros: RegistroAproximado[] = [
      { id: 'r1', cicloId: 'ciclo-1', periodicItemId: 'luz', importeReal: 4800 },
    ]
    const detalles = resolverAproximados(items, registros, 'ciclo-1')
    expect(detalles[0]).toEqual({
      periodicItemId: 'luz',
      nombre: 'Luz',
      presupuesto: 4000,
      real: 4800,
      diferencia: 800,
    })
  })

  it('ignora registros de otros ciclos', () => {
    const items = [item({ id: 'luz', tipo: 'aproximado', importeMensual: 4000 })]
    const registros: RegistroAproximado[] = [
      { id: 'r1', cicloId: 'ciclo-anterior', periodicItemId: 'luz', importeReal: 9999 },
    ]
    const detalles = resolverAproximados(items, registros, 'ciclo-1')
    expect(detalles[0].real).toBe(4000)
  })
})

describe('totalAproximadoEnVivo', () => {
  it('suma los importes reales resueltos', () => {
    const detalles = [
      { periodicItemId: '1', nombre: 'Luz', presupuesto: 4000, real: 4800, diferencia: 800 },
      { periodicItemId: '2', nombre: 'Agua', presupuesto: 2000, real: 2000, diferencia: 0 },
    ]
    expect(totalAproximadoEnVivo(detalles)).toBe(6800)
  })
})
