import { mesesEntreInclusive } from './dates'
import type { Centimos, FechaISO, PeriodicItem, RegistroAproximado } from './types'

/**
 * Un fraccionado cuenta en un ciclo si está activo y la fecha de inicio del
 * ciclo es anterior o igual a su fecha de fin (si no tiene fecha de fin,
 * siempre cuenta mientras esté activo). La comparación de fechas ISO
 * `yyyy-mm-dd` funciona lexicográficamente sin necesidad de parsear a Date.
 */
export function esFraccionadoVigente(item: PeriodicItem, fechaInicioCicloISO: FechaISO): boolean {
  if (item.tipo !== 'fraccionado' || item.estado !== 'activo') return false
  if (item.fechaFin === null) return true
  return fechaInicioCicloISO <= item.fechaFin
}

/**
 * Cuotas restantes de un fraccionado, en meses de calendario hasta su fecha
 * fin (inclusive). `null` si no es fraccionado o no tiene fecha fin. Se
 * clampa a 0 cuando ya ha terminado (nunca negativo).
 */
export function cuotasRestantes(item: PeriodicItem, hoyISO: FechaISO): number | null {
  if (item.tipo !== 'fraccionado' || item.fechaFin === null) return null
  return Math.max(0, mesesEntreInclusive(hoyISO, item.fechaFin))
}

export function totalFijos(items: PeriodicItem[]): Centimos {
  return items
    .filter((i) => i.tipo === 'fijo' && i.estado === 'activo')
    .reduce((suma, i) => suma + i.importeMensual, 0)
}

export function totalFraccionadosVigentes(items: PeriodicItem[], fechaInicioCicloISO: FechaISO): Centimos {
  return items
    .filter((i) => esFraccionadoVigente(i, fechaInicioCicloISO))
    .reduce((suma, i) => suma + i.importeMensual, 0)
}

export function totalAhorroProgramado(items: PeriodicItem[]): Centimos {
  return items
    .filter((i) => i.tipo === 'ahorro' && i.estado === 'activo')
    .reduce((suma, i) => suma + i.importeMensual, 0)
}

export interface DetalleAproximado {
  periodicItemId: string
  nombre: string
  presupuesto: Centimos
  real: Centimos
  diferencia: Centimos
}

/**
 * Para cada "aproximado" activo, resuelve su importe real para el ciclo: si
 * no se ha registrado todavía, cuenta el presupuesto (diferencia 0).
 */
export function resolverAproximados(
  items: PeriodicItem[],
  registros: RegistroAproximado[],
  cicloId: string,
): DetalleAproximado[] {
  return items
    .filter((i) => i.tipo === 'aproximado' && i.estado === 'activo')
    .map((item) => {
      const registro = registros.find((r) => r.cicloId === cicloId && r.periodicItemId === item.id)
      const presupuesto = item.importeMensual
      const real = registro ? registro.importeReal : presupuesto
      return {
        periodicItemId: item.id,
        nombre: item.nombre,
        presupuesto,
        real,
        diferencia: real - presupuesto,
      }
    })
}

export function totalAproximadoEnVivo(detalles: DetalleAproximado[]): Centimos {
  return detalles.reduce((suma, d) => suma + d.real, 0)
}
