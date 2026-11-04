import { useState } from 'react'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { NumberField } from '../../components/ui/NumberField'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { TextField } from '../../components/ui/TextField'
import { parsearImporte } from '../../core/money'
import { db } from '../../db/schema'
import { anadirMovimientoManual } from '../../db/repositories/hucha'
import { hoyISO } from '../../lib/hoy'

type TipoMovimiento = 'aportacion' | 'retiro'

interface MovimientoManualSheetProps {
  open: boolean
  onClose: () => void
}

export function MovimientoManualSheet({ open, onClose }: MovimientoManualSheetProps) {
  const [tipo, setTipo] = useState<TipoMovimiento>('aportacion')
  const [importeTexto, setImporteTexto] = useState('')
  const [concepto, setConcepto] = useState('')
  const [fecha, setFecha] = useState(hoyISO())
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  function resetear() {
    setTipo('aportacion')
    setImporteTexto('')
    setConcepto('')
    setFecha(hoyISO())
    setError(null)
  }

  async function guardar() {
    const importe = parsearImporte(importeTexto)
    if (importe === null || importe <= 0) {
      setError('Introduce un importe válido')
      return
    }

    setGuardando(true)
    await anadirMovimientoManual(db, {
      importe: tipo === 'retiro' ? -importe : importe,
      concepto: concepto.trim() || null,
      fecha,
    })
    setGuardando(false)
    resetear()
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Movimiento manual en la hucha">
      <div className="flex flex-col gap-4">
        <SegmentedControl
          value={tipo}
          onChange={setTipo}
          options={[
            { value: 'aportacion', label: 'Aportación' },
            { value: 'retiro', label: 'Retiro' },
          ]}
        />
        <NumberField label="Importe" value={importeTexto} onChange={setImporteTexto} autoFocus error={error ?? undefined} />
        <TextField
          label="Concepto (opcional)"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder="Ej. Ingreso extra"
        />
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Fecha</span>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
          />
        </label>
        <Button className="w-full" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </BottomSheet>
  )
}
