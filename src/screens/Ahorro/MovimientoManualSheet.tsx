import { useState } from 'react'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { DateField } from '../../components/ui/DateField'
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
        <DateField label="Fecha" value={fecha} onChange={(v) => setFecha(v ?? hoyISO())} />
        <Button className="w-full" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </BottomSheet>
  )
}
