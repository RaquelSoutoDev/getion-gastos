import { describe, expect, it } from 'vitest'
import { calcularSaldoHucha } from './hucha'

describe('calcularSaldoHucha', () => {
  it('suma los importes de todos los movimientos', () => {
    expect(calcularSaldoHucha([{ importe: 10000 }, { importe: 5000 }])).toBe(15000)
  })

  it('admite importes negativos (retiros manuales)', () => {
    expect(calcularSaldoHucha([{ importe: 10000 }, { importe: -3000 }])).toBe(7000)
  })

  it('devuelve 0 sin movimientos', () => {
    expect(calcularSaldoHucha([])).toBe(0)
  })
})
