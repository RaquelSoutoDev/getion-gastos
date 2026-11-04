import { diasHasta } from './dates'
import type { FechaISO } from './types'

const DIAS_AVISO_BACKUP = 30

/** true si nunca se ha exportado o si la última exportación tiene más de 30 días. */
export function necesitaRecordatorioBackup(ultimaExportacion: FechaISO | null, hoyISO: FechaISO): boolean {
  if (ultimaExportacion === null) return true
  return diasHasta(hoyISO, ultimaExportacion) > DIAS_AVISO_BACKUP
}
