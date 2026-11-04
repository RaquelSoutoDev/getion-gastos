import { describe, expect, it } from 'vitest'
import { calcularCierreYApertura, calcularResumenCierre } from './cierre'
import type { Gasto, PeriodicItem, RegistroAproximado, Settings } from './types'

const settings: Settings = {
  presupuestoComidaMensual: 25000,
  diaCobroHabitual: 5,
  ultimaExportacion: null,
}

const periodicItems: PeriodicItem[] = [
  {
    id: 'alquiler',
    nombre: 'Alquiler',
    tipo: 'fijo',
    importeMensual: 50000,
    fechaInicio: '2025-01-01',
    fechaFin: null,
    estado: 'activo',
  },
  {
    id: 'universidad',
    nombre: 'Universidad',
    tipo: 'fraccionado',
    importeMensual: 10000,
    fechaInicio: '2026-01-01',
    fechaFin: '2026-11-30',
    estado: 'activo',
  },
  {
    id: 'luz',
    nombre: 'Luz',
    tipo: 'aproximado',
    importeMensual: 4000,
    fechaInicio: '2025-01-01',
    fechaFin: null,
    estado: 'activo',
  },
  {
    id: 'hucha-mensual',
    nombre: 'Ahorro mensual',
    tipo: 'ahorro',
    importeMensual: 20000,
    fechaInicio: '2025-01-01',
    fechaFin: null,
    estado: 'activo',
  },
]

const cycle = {
  id: 'ciclo-1',
  fechaInicio: '2026-10-04',
  salarioImporte: 150000,
  deficitArrastrado: 0,
}

// colchonInicial = 150000 - 50000 (fijos) - 10000 (fraccionado vigente) - 4800 (luz real)
//                  - 20000 (ahorro) - 25000 (comida) - 0 (déficit arrastrado) = 40200
const registrosAproximado: RegistroAproximado[] = [
  { id: 'r1', cicloId: 'ciclo-1', periodicItemId: 'luz', importeReal: 4800 },
]

describe('calcularResumenCierre', () => {
  it('calcula un cierre normal con sobrante en ambas bolsas', () => {
    const gastos: Gasto[] = [
      { id: 'g1', cicloId: 'ciclo-1', bolsa: 'comida', importe: 18000, concepto: null, fecha: '2026-10-10' },
      { id: 'g2', cicloId: 'ciclo-1', bolsa: 'colchon', importe: 20000, concepto: null, fecha: '2026-10-15' },
    ]

    const resumen = calcularResumenCierre({ cycle, periodicItems, registrosAproximado, gastos, settings })

    expect(resumen.colchonInicial).toBe(40200)
    expect(resumen.comidaInicial).toBe(25000)
    expect(resumen.totalFijos).toBe(50000)
    expect(resumen.totalFraccionados).toBe(10000)
    expect(resumen.totalAhorroProgramado).toBe(20000)
    expect(resumen.aproximados).toEqual([
      { periodicItemId: 'luz', nombre: 'Luz', presupuesto: 4000, real: 4800, diferencia: 800 },
    ])
    expect(resumen.gastosComidaTotal).toBe(18000)
    expect(resumen.gastosColchonTotal).toBe(20000)
    expect(resumen.sobranteComida).toBe(7000)
    expect(resumen.sobranteColchon).toBe(20200)
    expect(resumen.deficitDetectado).toEqual({ comida: 0, colchon: 0 })
    expect(resumen.aportacionHuchaSobrante).toBe(27200)
    expect(resumen.deficitArrastrado).toBe(0)
  })

  it('detecta el déficit cuando una bolsa queda en negativo y no lo resta de la aportación a la hucha', () => {
    const gastos: Gasto[] = [
      { id: 'g1', cicloId: 'ciclo-1', bolsa: 'comida', importe: 18000, concepto: null, fecha: '2026-10-10' },
      // colchonInicial es 40200: con 45000 de gasto queda en -4800
      { id: 'g2', cicloId: 'ciclo-1', bolsa: 'colchon', importe: 45000, concepto: 'imprevisto', fecha: '2026-10-20' },
    ]

    const resumen = calcularResumenCierre({ cycle, periodicItems, registrosAproximado, gastos, settings })

    expect(resumen.sobranteComida).toBe(7000)
    expect(resumen.sobranteColchon).toBe(-4800)
    expect(resumen.deficitDetectado).toEqual({ comida: 0, colchon: 4800 })
    // Solo el sobrante positivo de comida entra en la hucha; el déficit de colchón no se resta de ella.
    expect(resumen.aportacionHuchaSobrante).toBe(7000)
    expect(resumen.deficitArrastrado).toBe(4800)
  })

  it('usa el presupuesto cuando el aproximado no tiene importe real registrado', () => {
    const gastos: Gasto[] = []
    const resumen = calcularResumenCierre({
      cycle,
      periodicItems,
      registrosAproximado: [], // sin registro para "luz"
      gastos,
      settings,
    })

    expect(resumen.aproximados).toEqual([
      { periodicItemId: 'luz', nombre: 'Luz', presupuesto: 4000, real: 4000, diferencia: 0 },
    ])
    // colchonInicial ahora resta el presupuesto de luz (4000) en vez del real (4800)
    expect(resumen.colchonInicial).toBe(41000)
  })
})

describe('calcularCierreYApertura', () => {
  it('no hay nada que cerrar en el primer ciclo (sin histórico)', () => {
    const resultado = calcularCierreYApertura({
      cicloAnterior: null,
      periodicItems,
      registrosAproximadoCicloAnterior: [],
      gastosCicloAnterior: [],
      settings,
    })

    expect(resultado.resumenCicloAnterior).toBeNull()
    expect(resultado.deficitArrastradoNuevoCiclo).toBe(0)
  })

  it('arrastra el déficit del ciclo anterior al nuevo ciclo', () => {
    const gastosCicloAnterior: Gasto[] = [
      { id: 'g1', cicloId: 'ciclo-1', bolsa: 'comida', importe: 18000, concepto: null, fecha: '2026-10-10' },
      { id: 'g2', cicloId: 'ciclo-1', bolsa: 'colchon', importe: 45000, concepto: null, fecha: '2026-10-20' },
    ]

    const resultado = calcularCierreYApertura({
      cicloAnterior: cycle,
      periodicItems,
      registrosAproximadoCicloAnterior: registrosAproximado,
      gastosCicloAnterior,
      settings,
    })

    expect(resultado.resumenCicloAnterior).not.toBeNull()
    expect(resultado.resumenCicloAnterior?.deficitArrastrado).toBe(4800)
    expect(resultado.deficitArrastradoNuevoCiclo).toBe(4800)
  })
})
