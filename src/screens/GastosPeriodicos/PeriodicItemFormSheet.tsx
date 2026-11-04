import { useState } from 'react'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { DateField } from '../../components/ui/DateField'
import { NumberField } from '../../components/ui/NumberField'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { TextField } from '../../components/ui/TextField'
import { centimosATexto, parsearImporte } from '../../core/money'
import type { PeriodicItem, TipoPeriodico } from '../../core/types'
import { db } from '../../db/schema'
import {
  actualizarPeriodicItem,
  crearPeriodicItem,
  eliminarPeriodicItem,
  pausarPeriodicItem,
  reactivarPeriodicItem,
} from '../../db/repositories/periodicItems'
import { hoyISO } from '../../lib/hoy'

const ETIQUETAS_TIPO: Record<TipoPeriodico, string> = {
  fijo: 'Fijo',
  fraccionado: 'Fraccionado',
  aproximado: 'Aproximado',
  ahorro: 'Ahorro',
}

interface PeriodicItemFormSheetProps {
  onClose: () => void
  item: PeriodicItem | null
  tipoInicial: TipoPeriodico
}

/** Se monta solo mientras el sheet está visible (ver GastosPeriodicos/index.tsx). */
export function PeriodicItemFormSheet({ onClose, item, tipoInicial }: PeriodicItemFormSheetProps) {
  const [nombre, setNombre] = useState(item?.nombre ?? '')
  const [tipo, setTipo] = useState<TipoPeriodico>(item?.tipo ?? tipoInicial)
  const [importeTexto, setImporteTexto] = useState(item ? centimosATexto(item.importeMensual) : '')
  const [fechaFin, setFechaFin] = useState<string | null>(item?.fechaFin ?? null)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)

  async function guardar() {
    const importe = parsearImporte(importeTexto)
    if (nombre.trim() === '') {
      setError('Ponle un nombre')
      return
    }
    if (importe === null || importe <= 0) {
      setError('Introduce un importe válido')
      return
    }

    setGuardando(true)
    if (item) {
      await actualizarPeriodicItem(db, item.id, {
        nombre: nombre.trim(),
        importeMensual: importe,
        fechaFin: tipo === 'fraccionado' ? fechaFin : null,
      })
    } else {
      await crearPeriodicItem(db, {
        nombre: nombre.trim(),
        tipo,
        importeMensual: importe,
        fechaInicio: hoyISO(),
        fechaFin: tipo === 'fraccionado' ? fechaFin : null,
      })
    }
    setGuardando(false)
    onClose()
  }

  async function alternarPausa() {
    if (!item) return
    if (item.estado === 'pausado') {
      await reactivarPeriodicItem(db, item.id)
    } else {
      await pausarPeriodicItem(db, item.id)
    }
    onClose()
  }

  async function borrar() {
    if (!item) return
    await eliminarPeriodicItem(db, item.id)
    setConfirmandoBorrado(false)
    onClose()
  }

  const etiquetaImporte = tipo === 'aproximado' ? 'Presupuesto estimado' : tipo === 'ahorro' ? 'Importe a ahorrar' : 'Importe mensual'

  return (
    <BottomSheet open onClose={onClose} title={item ? 'Editar gasto periódico' : 'Nuevo gasto periódico'}>
      <div className="flex flex-col gap-4">
        {!item && (
          <SegmentedControl
            value={tipo}
            onChange={setTipo}
            options={(Object.keys(ETIQUETAS_TIPO) as TipoPeriodico[]).map((t) => ({ value: t, label: ETIQUETAS_TIPO[t] }))}
          />
        )}
        {item && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Tipo: <span className="font-medium text-neutral-900 dark:text-neutral-50">{ETIQUETAS_TIPO[tipo]}</span>
          </p>
        )}

        <TextField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Alquiler" />

        <NumberField label={etiquetaImporte} value={importeTexto} onChange={setImporteTexto} error={error ?? undefined} />

        {tipo === 'fraccionado' && (
          <DateField
            label="Fecha de fin (opcional)"
            value={fechaFin}
            onChange={setFechaFin}
            placeholder="Sin fecha de fin"
            allowClear
          />
        )}

        <Button className="w-full" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </Button>

        {item && (
          <>
            <Button variante="secondary" className="w-full" onClick={alternarPausa}>
              {item.estado === 'pausado' ? 'Reactivar' : 'Pausar'}
            </Button>
            <Button variante="danger" className="w-full" onClick={() => setConfirmandoBorrado(true)}>
              Eliminar
            </Button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmandoBorrado}
        title="¿Eliminar este gasto periódico?"
        description="Dejará de contar en los ciclos futuros. Los ciclos ya cerrados no cambian."
        confirmLabel="Eliminar"
        danger
        onConfirm={borrar}
        onCancel={() => setConfirmandoBorrado(false)}
      />
    </BottomSheet>
  )
}
