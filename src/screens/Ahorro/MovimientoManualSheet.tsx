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
import { useEstadoCicloActual } from '../../hooks/useEstadoCicloActual'
import { hoyISO } from '../../lib/hoy'

type TipoMovimiento = 'aportacion' | 'retiro'

interface MovimientoManualSheetProps {
  open: boolean
  onClose: () => void
}

export function MovimientoManualSheet({ open, onClose }: MovimientoManualSheetProps) {
  const estado = useEstadoCicloActual()
  const [tipo, setTipo] = useState<TipoMovimiento>('aportacion')
  const [importeTexto, setImporteTexto] = useState('')
  const [concepto, setConcepto] = useState('')
  const [fecha, setFecha] = useState(hoyISO())
  const [anadirAColchon, setAnadirAColchon] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  function resetear() {
    setTipo('aportacion')
    setImporteTexto('')
    setConcepto('')
    setFecha(hoyISO())
    setAnadirAColchon(true)
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
      cicloDestinoId: tipo === 'retiro' && anadirAColchon && estado ? estado.cycle.id : undefined,
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
          placeholder={tipo === 'retiro' ? 'Ej. Para gastos de este ciclo' : 'Ej. Ingreso extra'}
        />
        <DateField label="Fecha" value={fecha} onChange={(v) => setFecha(v ?? hoyISO())} />

        {tipo === 'retiro' && estado && (
          <label className="flex items-start gap-3 rounded-2xl bg-neutral-100 p-3 dark:bg-neutral-800">
            <input
              type="checkbox"
              checked={anadirAColchon}
              onChange={(e) => setAnadirAColchon(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-blue-600"
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              Añadir este importe al colchón disponible del ciclo actual
            </span>
          </label>
        )}

        <Button className="w-full" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </BottomSheet>
  )
}
