import { describe, expect, it } from 'vitest'
import { necesitaRecordatorioBackup } from './backup'

describe('necesitaRecordatorioBackup', () => {
  it('avisa si nunca se ha exportado', () => {
    expect(necesitaRecordatorioBackup(null, '2026-11-04')).toBe(true)
  })

  it('no avisa si la última exportación tiene 30 días o menos', () => {
    expect(necesitaRecordatorioBackup('2026-10-05', '2026-11-04')).toBe(false)
  })

  it('avisa si la última exportación tiene más de 30 días', () => {
    expect(necesitaRecordatorioBackup('2026-10-04', '2026-11-04')).toBe(true)
  })
})
