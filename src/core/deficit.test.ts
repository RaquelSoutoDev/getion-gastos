import { describe, expect, it } from 'vitest'
import { calcularAportacionHucha, calcularDeficitDetectado } from './deficit'

describe('calcularDeficitDetectado', () => {
  it('no detecta déficit si ambas bolsas quedan en positivo', () => {
    expect(calcularDeficitDetectado(500, 1000)).toEqual({ comida: 0, colchon: 0, total: 0 })
  })

  it('detecta déficit solo en comida (bolsa en negativo)', () => {
    expect(calcularDeficitDetectado(-300, 1000)).toEqual({ comida: 300, colchon: 0, total: 300 })
  })

  it('detecta déficit solo en colchón', () => {
    expect(calcularDeficitDetectado(500, -2000)).toEqual({ comida: 0, colchon: 2000, total: 2000 })
  })

  it('detecta déficit en ambas bolsas a la vez', () => {
    expect(calcularDeficitDetectado(-300, -2000)).toEqual({ comida: 300, colchon: 2000, total: 2300 })
  })
})

describe('calcularAportacionHucha', () => {
  it('suma ambos sobrantes cuando son positivos', () => {
    expect(calcularAportacionHucha(500, 1000)).toBe(1500)
  })

  it('ignora la parte negativa de una bolsa en déficit', () => {
    expect(calcularAportacionHucha(-300, 1000)).toBe(1000)
  })

  it('es 0 cuando ambas bolsas están en negativo', () => {
    expect(calcularAportacionHucha(-300, -2000)).toBe(0)
  })
})
