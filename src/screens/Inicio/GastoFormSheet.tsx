import { useState } from 'react'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { NumberField } from '../../components/ui/NumberField'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { TextField } from '../../components/ui/TextField'
import { centimosATexto, parsearImporte } from '../../core/money'
import type { Bolsa, Gasto } from '../../core/types'
import { db } from '../../db/schema'
import { actualizarGasto, anadirGasto, eliminarGasto } from '../../db/repositories/gastos'
import { hoyISO } from '../../lib/hoy'

interface GastoFormSheetProps {
  onClose: () => void
  cicloId: string
  gasto: Gasto | null
}

/** Se monta solo mientras el sheet está visible (ver App.tsx/Inicio): así cada apertura parte de un estado limpio. */
export function GastoFormSheet({ onClose, cicloId, gasto }: GastoFormSheetProps) {
  const [importeTexto, setImporteTexto] = useState(gasto ? centimosATexto(gasto.importe) : '')
  const [bolsa, setBolsa] = useState<Bolsa>(gasto?.bolsa ?? 'colchon')
  const [concepto, setConcepto] = useState(gasto?.concepto ?? '')
  const [fecha, setFecha] = useState(gasto?.fecha ?? hoyISO())
  const [error, setError] = useState<string | null>(null)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    const importe = parsearImporte(importeTexto)
    if (importe === null || importe <= 0) {
      setError('Introduce un importe válido')
      return
    }

    setGuardando(true)
    const datos = { bolsa, importe, concepto: concepto.trim() || null, fecha }
    if (gasto) {
      await actualizarGasto(db, gasto.id, datos)
    } else {
      await anadirGasto(db, { cicloId, ...datos })
    }
    setGuardando(false)
    onClose()
  }

  async function borrar() {
    if (!gasto) return
    await eliminarGasto(db, gasto.id)
    setConfirmandoBorrado(false)
    onClose()
  }

  return (
    <BottomSheet open onClose={onClose} title={gasto ? 'Editar gasto' : 'Añadir gasto'}>
      <div className="flex flex-col gap-4">
        <NumberField label="Importe" value={importeTexto} onChange={setImporteTexto} autoFocus error={error ?? undefined} />

        <SegmentedControl
          value={bolsa}
          onChange={setBolsa}
          options={[
            { value: 'colchon', label: 'Colchón' },
            { value: 'comida', label: 'Comida' },
          ]}
        />

        <TextField
          label="Concepto (opcional)"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder="Ej. Cena con amigos"
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

        {gasto && (
          <Button variante="danger" className="w-full" onClick={() => setConfirmandoBorrado(true)}>
            Eliminar gasto
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmandoBorrado}
        title="¿Eliminar este gasto?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        onConfirm={borrar}
        onCancel={() => setConfirmandoBorrado(false)}
      />
    </BottomSheet>
  )
}
