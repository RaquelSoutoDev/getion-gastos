import { describe, expect, it } from 'vitest'
import { calcularColchonInicial, calcularDisponibleBolsa } from './colchon'

describe('calcularColchonInicial', () => {
  it('resta fijos, fraccionados, aproximado, ahorro, comida y déficit arrastrado del salario', () => {
    const colchon = calcularColchonInicial({
      salarioImporte: 150000,
      totalFijos: 50000,
      totalFraccionados: 10000,
      totalAproximado: 6000,
      totalAhorroProgramado: 20000,
      presupuestoComida: 25000,
      deficitArrastrado: 0,
    })
    expect(colchon).toBe(39000)
  })

  it('descuenta el déficit arrastrado del ciclo anterior', () => {
    const colchon = calcularColchonInicial({
      salarioImporte: 150000,
      totalFijos: 50000,
      totalFraccionados: 10000,
      totalAproximado: 6000,
      totalAhorroProgramado: 20000,
      presupuestoComida: 25000,
      deficitArrastrado: 5000,
    })
    expect(colchon).toBe(34000)
  })

  it('puede salir negativo si los compromisos superan el salario', () => {
    const colchon = calcularColchonInicial({
      salarioImporte: 50000,
      totalFijos: 50000,
      totalFraccionados: 10000,
      totalAproximado: 0,
      totalAhorroProgramado: 0,
      presupuestoComida: 0,
      deficitArrastrado: 0,
    })
    expect(colchon).toBe(-10000)
  })
})

describe('calcularDisponibleBolsa', () => {
  it('resta los gastos del presupuesto inicial', () => {
    expect(calcularDisponibleBolsa(25000, [{ importe: 5000 }, { importe: 3000 }])).toBe(17000)
  })

  it('devuelve negativo cuando los gastos superan el presupuesto (bolsa en negativo)', () => {
    expect(calcularDisponibleBolsa(10000, [{ importe: 7000 }, { importe: 6000 }])).toBe(-3000)
  })

  it('sin gastos, devuelve el presupuesto íntegro', () => {
    expect(calcularDisponibleBolsa(10000, [])).toBe(10000)
  })
})
