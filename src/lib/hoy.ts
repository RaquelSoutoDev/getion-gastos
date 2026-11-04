import type { FechaISO } from '../core/types'

/** Fecha de hoy en hora local (no UTC) en formato ISO `yyyy-mm-dd`. Única fuente impura de "ahora". */
export function hoyISO(): FechaISO {
  const d = new Date()
  const anio = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}
