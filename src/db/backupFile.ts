import type { BackupData } from './backup'

/** Descarga el backup como fichero .json. Requiere DOM (se usa desde la pantalla de Ajustes). */
export function descargarBackup(data: BackupData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  try {
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `gestion-gastos-backup-${data.exportadoEn.slice(0, 10)}.json`
    enlace.click()
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function leerArchivoComoTexto(file: File): Promise<string> {
  return file.text()
}
