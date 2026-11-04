import { useState } from 'react'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { NumberField } from '../../components/ui/NumberField'
import { centimosATexto, parsearImporte } from '../../core/money'
import { db } from '../../db/schema'
import { registrarImporteReal } from '../../db/repositories/registrosAproximado'

interface ImporteRealSheetProps {
  onClose: () => void
  cicloId: string
  periodicItemId: string
  nombre: string
  presupuesto: number
  realActual: number
}

/** Se monta solo mientras el sheet está visible (ver GastosPeriodicos/index.tsx). */
export function ImporteRealSheet({ onClose, cicloId, periodicItemId, nombre, presupuesto, realActual }: ImporteRealSheetProps) {
  const [importeTexto, setImporteTexto] = useState(centimosATexto(realActual))
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    const importe = parsearImporte(importeTexto)
    if (importe === null || importe < 0) {
      setError('Introduce un importe válido')
      return
    }
    setGuardando(true)
    await registrarImporteReal(db, cicloId, periodicItemId, importe)
    setGuardando(false)
    onClose()
  }

  return (
    <BottomSheet open onClose={onClose} title={`Importe real de ${nombre}`}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Presupuesto estimado para este ciclo: {centimosATexto(presupuesto)} €
        </p>
        <NumberField label="Importe real" value={importeTexto} onChange={setImporteTexto} autoFocus error={error ?? undefined} />
        <Button className="w-full" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </BottomSheet>
  )
}
