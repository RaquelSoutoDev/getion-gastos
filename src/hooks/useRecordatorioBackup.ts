import { necesitaRecordatorioBackup } from '../core/backup'
import { hoyISO } from '../lib/hoy'
import { useSettings } from './useSettings'

/** `undefined` mientras carga, `true`/`false` según si toca avisar de hacer backup. */
export function useRecordatorioBackup(): boolean | undefined {
  const settings = useSettings()
  if (settings === undefined) return undefined
  return necesitaRecordatorioBackup(settings.ultimaExportacion, hoyISO())
}
