import type { FechaISO } from './types'

const fechaFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function formatearFechaEs(iso: FechaISO): string {
  return fechaFormatter.format(new Date(`${iso}T00:00:00`))
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function anioMes(iso: FechaISO): { anio: number; mes: number } {
  const [anio, mes] = iso.split('-').map(Number)
  return { anio, mes }
}

function indiceMes(iso: FechaISO): number {
  const { anio, mes } = anioMes(iso)
  return anio * 12 + (mes - 1)
}

/**
 * Número de meses de calendario entre `desde` y `hasta`, contando ambos
 * extremos (ignora el día del mes). Ej: noviembre -> junio del año siguiente
 * son 8 meses (nov, dic, ene, feb, mar, abr, may, jun). Puede ser <= 0 si
 * `hasta` ya quedó atrás.
 */
export function mesesEntreInclusive(desdeISO: FechaISO, hastaISO: FechaISO): number {
  return indiceMes(hastaISO) - indiceMes(desdeISO) + 1
}

/**
 * Siguiente fecha de cobro tras el inicio de un ciclo: el mismo día del mes
 * siguiente, o el último día de ese mes si no existe (ej. día 31 en febrero).
 */
export function fechaProximoCobro(fechaInicioCicloISO: FechaISO, diaCobroHabitual: number): FechaISO {
  const { anio, mes } = anioMes(fechaInicioCicloISO)
  const siguienteMes = mes === 12 ? 1 : mes + 1
  const siguienteAnio = mes === 12 ? anio + 1 : anio

  const ultimoDiaDelMes = new Date(Date.UTC(siguienteAnio, siguienteMes, 0)).getUTCDate()
  const dia = Math.min(diaCobroHabitual, ultimoDiaDelMes)

  return `${siguienteAnio}-${pad2(siguienteMes)}-${pad2(dia)}`
}

/** Días entre `hoyISO` y `fechaISO`. Negativo si `fechaISO` ya pasó. */
export function diasHasta(fechaISO: FechaISO, hoyISO: FechaISO): number {
  const msPorDia = 24 * 60 * 60 * 1000
  const fecha = new Date(`${fechaISO}T00:00:00Z`).getTime()
  const hoy = new Date(`${hoyISO}T00:00:00Z`).getTime()
  return Math.round((fecha - hoy) / msPorDia)
}
