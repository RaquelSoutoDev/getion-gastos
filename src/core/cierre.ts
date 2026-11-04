import { calcularColchonInicial, calcularDisponibleBolsa } from './colchon'
import { calcularAportacionHucha, calcularDeficitDetectado } from './deficit'
import {
  resolverAproximados,
  totalAhorroProgramado,
  totalAproximadoEnVivo,
  totalFijos,
  totalFraccionadosVigentes,
} from './periodicItems'
import type { Centimos, Cycle, Gasto, PeriodicItem, RegistroAproximado, ResumenCierre, Settings } from './types'

type CicloParaCierre = Pick<Cycle, 'id' | 'fechaInicio' | 'salarioImporte' | 'deficitArrastrado'>

export interface DatosResumenCierre {
  cycle: CicloParaCierre
  periodicItems: PeriodicItem[]
  /** Solo los registros de este ciclo. */
  registrosAproximado: RegistroAproximado[]
  /** Solo los gastos de este ciclo. */
  gastos: Gasto[]
  settings: Settings
}

/**
 * Calcula el resumen de cierre de un ciclo con los valores vigentes en este
 * instante. El resultado se congela tal cual en `Cycle.resumenCierre`: a
 * partir de aquí el ciclo queda como histórico de solo lectura.
 */
export function calcularResumenCierre(datos: DatosResumenCierre): ResumenCierre {
  const { cycle, periodicItems, registrosAproximado, gastos, settings } = datos

  const fijos = totalFijos(periodicItems)
  const fraccionados = totalFraccionadosVigentes(periodicItems, cycle.fechaInicio)
  const ahorro = totalAhorroProgramado(periodicItems)
  const aproximados = resolverAproximados(periodicItems, registrosAproximado, cycle.id)
  const aproximadoEnVivo = totalAproximadoEnVivo(aproximados)

  const colchonInicial = calcularColchonInicial({
    salarioImporte: cycle.salarioImporte,
    totalFijos: fijos,
    totalFraccionados: fraccionados,
    totalAproximado: aproximadoEnVivo,
    totalAhorroProgramado: ahorro,
    presupuestoComida: settings.presupuestoComidaMensual,
    deficitArrastrado: cycle.deficitArrastrado,
  })

  const gastosComida = gastos.filter((g) => g.bolsa === 'comida')
  const gastosColchon = gastos.filter((g) => g.bolsa === 'colchon')

  const sobranteComida = calcularDisponibleBolsa(settings.presupuestoComidaMensual, gastosComida)
  const sobranteColchon = calcularDisponibleBolsa(colchonInicial, gastosColchon)

  const deficitDetectado = calcularDeficitDetectado(sobranteComida, sobranteColchon)
  const aportacionHuchaSobrante = calcularAportacionHucha(sobranteComida, sobranteColchon)

  return {
    colchonInicial,
    comidaInicial: settings.presupuestoComidaMensual,
    totalFijos: fijos,
    totalFraccionados: fraccionados,
    totalAhorroProgramado: ahorro,
    aproximados,
    gastosComidaTotal: gastosComida.reduce((suma, g) => suma + g.importe, 0),
    gastosColchonTotal: gastosColchon.reduce((suma, g) => suma + g.importe, 0),
    sobranteComida,
    sobranteColchon,
    deficitDetectado: { comida: deficitDetectado.comida, colchon: deficitDetectado.colchon },
    aportacionHuchaSobrante,
    deficitArrastrado: deficitDetectado.total,
  }
}

export interface DatosCierreYApertura {
  /** `null` si es el primer salario que se registra jamás (no hay nada que cerrar). */
  cicloAnterior: CicloParaCierre | null
  periodicItems: PeriodicItem[]
  registrosAproximadoCicloAnterior: RegistroAproximado[]
  gastosCicloAnterior: Gasto[]
  settings: Settings
}

export interface ResultadoCierreYApertura {
  /** `null` cuando no había ciclo previo que cerrar. */
  resumenCicloAnterior: ResumenCierre | null
  /** A aplicar como `deficitArrastrado` del ciclo nuevo. */
  deficitArrastradoNuevoCiclo: Centimos
}

/**
 * Orquesta el cierre del ciclo abierto (si lo hay) de cara a abrir uno nuevo
 * al registrar un salario. No crea ni persiste nada: solo calcula.
 */
export function calcularCierreYApertura(datos: DatosCierreYApertura): ResultadoCierreYApertura {
  if (datos.cicloAnterior === null) {
    return { resumenCicloAnterior: null, deficitArrastradoNuevoCiclo: 0 }
  }

  const resumenCicloAnterior = calcularResumenCierre({
    cycle: datos.cicloAnterior,
    periodicItems: datos.periodicItems,
    registrosAproximado: datos.registrosAproximadoCicloAnterior,
    gastos: datos.gastosCicloAnterior,
    settings: datos.settings,
  })

  return {
    resumenCicloAnterior,
    deficitArrastradoNuevoCiclo: resumenCicloAnterior.deficitArrastrado,
  }
}
