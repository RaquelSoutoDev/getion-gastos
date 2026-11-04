import { describe, expect, it } from 'vitest'
import { diasHasta, fechaProximoCobro, formatearFechaEs, mesesEntreInclusive } from './dates'

describe('formatearFechaEs', () => {
  it('formatea en dd/mm/yyyy', () => {
    expect(formatearFechaEs('2026-11-04')).toBe('04/11/2026')
    expect(formatearFechaEs('2026-01-05')).toBe('05/01/2026')
  })
})

describe('mesesEntreInclusive', () => {
  it('cuenta ambos extremos, ignorando el día del mes', () => {
    // noviembre 2026 -> junio 2027: nov, dic, ene, feb, mar, abr, may, jun = 8
    expect(mesesEntreInclusive('2026-11-04', '2027-06-30')).toBe(8)
  })

  it('devuelve 1 cuando desde y hasta caen en el mismo mes (termina este mes)', () => {
    expect(mesesEntreInclusive('2026-11-04', '2026-11-30')).toBe(1)
  })

  it('devuelve 0 o negativo cuando hasta ya quedó atrás', () => {
    expect(mesesEntreInclusive('2026-11-04', '2026-10-31')).toBe(0)
    expect(mesesEntreInclusive('2026-11-04', '2026-09-30')).toBe(-1)
  })
})

describe('fechaProximoCobro', () => {
  it('usa el mismo día del mes siguiente', () => {
    expect(fechaProximoCobro('2026-11-04', 15)).toBe('2026-12-15')
  })

  it('pasa de diciembre a enero del año siguiente', () => {
    expect(fechaProximoCobro('2026-12-10', 1)).toBe('2027-01-01')
  })

  it('clampa al último día del mes si no existe (ej. 31 en febrero)', () => {
    expect(fechaProximoCobro('2026-01-15', 31)).toBe('2026-02-28')
  })

  it('respeta los años bisiestos al clampar', () => {
    expect(fechaProximoCobro('2028-01-15', 31)).toBe('2028-02-29')
  })
})

describe('diasHasta', () => {
  it('cuenta los días entre hoy y una fecha futura', () => {
    expect(diasHasta('2026-11-14', '2026-11-04')).toBe(10)
  })

  it('devuelve negativo si la fecha ya pasó', () => {
    expect(diasHasta('2026-11-01', '2026-11-04')).toBe(-3)
  })

  it('devuelve 0 si es hoy mismo', () => {
    expect(diasHasta('2026-11-04', '2026-11-04')).toBe(0)
  })
})
