import { describe, expect, it } from 'vitest'
import { formatearEuros, parsearImporte } from './money'

describe('formatearEuros', () => {
  it('formatea céntimos a euros con coma decimal y símbolo €', () => {
    expect(formatearEuros(0)).toBe('0,00 €')
    expect(formatearEuros(100)).toBe('1,00 €')
    expect(formatearEuros(123456)).toBe('1234,56 €')
  })

  it('agrupa los miles a partir de 10.000 €', () => {
    expect(formatearEuros(1234567)).toBe('12.345,67 €')
  })

  it('formatea importes negativos', () => {
    expect(formatearEuros(-500)).toBe('-5,00 €')
  })
})

describe('parsearImporte', () => {
  it('admite coma como separador decimal', () => {
    expect(parsearImporte('12,50')).toBe(1250)
  })

  it('admite punto como separador decimal cuando no hay coma', () => {
    expect(parsearImporte('12.50')).toBe(1250)
  })

  it('admite punto de miles cuando hay coma decimal', () => {
    expect(parsearImporte('1.234,56')).toBe(123456)
  })

  it('admite importes sin decimales', () => {
    expect(parsearImporte('1234')).toBe(123400)
  })

  it('admite importes negativos', () => {
    expect(parsearImporte('-12,50')).toBe(-1250)
  })

  it('ignora espacios alrededor', () => {
    expect(parsearImporte('  12,50  ')).toBe(1250)
  })

  it('rechaza texto vacío', () => {
    expect(parsearImporte('')).toBeNull()
    expect(parsearImporte('   ')).toBeNull()
  })

  it('rechaza texto no numérico', () => {
    expect(parsearImporte('doce euros')).toBeNull()
  })

  it('rechaza un punto de miles ambiguo sin coma decimal', () => {
    // "1.234" sin coma: no se sabe si el punto es de miles o decimal -> se rechaza.
    expect(parsearImporte('1.234')).toBeNull()
  })

  it('rechaza más de dos decimales', () => {
    expect(parsearImporte('12,505')).toBeNull()
  })
})
