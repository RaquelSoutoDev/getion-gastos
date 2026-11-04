import { useState } from 'react'
import { ResumenCierreView } from '../../components/ResumenCierreView'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { NumberField } from '../../components/ui/NumberField'
import { formatearFechaEs } from '../../core/dates'
import { formatearEuros, parsearImporte } from '../../core/money'
import type { ResumenCierre } from '../../core/types'
import { db } from '../../db/schema'
import { previsualizarCierreCicloActual, registrarSalario } from '../../db/repositories/cycles'
import { hoyISO } from '../../lib/hoy'

interface RegistrarSalarioFlowProps {
  open: boolean
  onClose: () => void
}

export function RegistrarSalarioFlow({ open, onClose }: RegistrarSalarioFlowProps) {
  const [paso, setPaso] = useState<'formulario' | 'confirmar'>('formulario')
  const [importeTexto, setImporteTexto] = useState('')
  const [fecha, setFecha] = useState(hoyISO())
  const [resumen, setResumen] = useState<ResumenCierre | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function cerrarYResetear() {
    setPaso('formulario')
    setImporteTexto('')
    setFecha(hoyISO())
    setResumen(null)
    setError(null)
    onClose()
  }

  async function continuar() {
    const importe = parsearImporte(importeTexto)
    if (importe === null || importe <= 0) {
      setError('Introduce un importe válido')
      return
    }
    setError(null)
    setCargando(true)
    const previo = await previsualizarCierreCicloActual(db)
    setCargando(false)
    setResumen(previo)
    setPaso('confirmar')
  }

  async function confirmar() {
    const importe = parsearImporte(importeTexto)
    if (importe === null) return
    setCargando(true)
    await registrarSalario(db, importe, fecha)
    setCargando(false)
    cerrarYResetear()
  }

  return (
    <BottomSheet
      open={open}
      onClose={cerrarYResetear}
      title={paso === 'formulario' ? 'Registrar salario' : 'Confirmar cierre de ciclo'}
    >
      {paso === 'formulario' ? (
        <div className="flex flex-col gap-4">
          <NumberField
            label="Importe del salario"
            value={importeTexto}
            onChange={setImporteTexto}
            autoFocus
            error={error ?? undefined}
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
          <Button onClick={continuar} disabled={cargando}>
            {cargando ? 'Calculando…' : 'Continuar'}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {resumen ? (
            <>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Así queda el ciclo actual antes de cerrarlo. Lo que sobre pasa a la hucha; si alguna bolsa quedó en
                negativo, se descuenta del colchón del ciclo nuevo.
              </p>
              <ResumenCierreView resumen={resumen} />
            </>
          ) : (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Es tu primer ciclo: todavía no hay nada que cerrar.
            </p>
          )}
          <p className="text-base font-medium text-neutral-900 dark:text-neutral-50">
            Nuevo ciclo con salario de {formatearEuros(parsearImporte(importeTexto) ?? 0)} desde el{' '}
            {formatearFechaEs(fecha)}.
          </p>
          <div className="flex gap-3">
            <Button variante="secondary" className="flex-1" onClick={() => setPaso('formulario')}>
              Atrás
            </Button>
            <Button className="flex-1" onClick={confirmar} disabled={cargando}>
              {cargando ? 'Guardando…' : 'Confirmar'}
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}
