import { useState } from 'react'
import { CalculoColchonView } from '../../components/CalculoColchonView'
import { ResumenCierreView } from '../../components/ResumenCierreView'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { NumberField } from '../../components/ui/NumberField'
import { calcularColchonInicial } from '../../core/colchon'
import { formatearFechaEs } from '../../core/dates'
import { formatearEuros, parsearImporte } from '../../core/money'
import {
  resolverAproximados,
  totalAhorroProgramado,
  totalAproximadoEnVivo,
  totalFijos,
  totalFraccionadosVigentes,
} from '../../core/periodicItems'
import type { ResumenCierre } from '../../core/types'
import { db } from '../../db/schema'
import { previsualizarCierreCicloActual, registrarSalario } from '../../db/repositories/cycles'
import { obtenerSettings } from '../../db/repositories/settings'
import { hoyISO } from '../../lib/hoy'

interface RegistrarSalarioFlowProps {
  open: boolean
  onClose: () => void
}

interface CalculoNuevoCiclo {
  totalFijos: number
  totalFraccionados: number
  totalAproximado: number
  totalAhorroProgramado: number
  presupuestoComida: number
  deficitArrastrado: number
  colchonInicial: number
}

export function RegistrarSalarioFlow({ open, onClose }: RegistrarSalarioFlowProps) {
  const [paso, setPaso] = useState<'formulario' | 'confirmar'>('formulario')
  const [importeTexto, setImporteTexto] = useState('')
  const [fecha, setFecha] = useState(hoyISO())
  const [resumen, setResumen] = useState<ResumenCierre | null>(null)
  const [calculoNuevo, setCalculoNuevo] = useState<CalculoNuevoCiclo | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function cerrarYResetear() {
    setPaso('formulario')
    setImporteTexto('')
    setFecha(hoyISO())
    setResumen(null)
    setCalculoNuevo(null)
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

    const [previo, periodicItems, settings] = await Promise.all([
      previsualizarCierreCicloActual(db),
      db.periodicItems.toArray(),
      obtenerSettings(db),
    ])

    const deficitArrastrado = previo?.deficitArrastrado ?? 0
    const fijos = totalFijos(periodicItems)
    const fraccionados = totalFraccionadosVigentes(periodicItems, fecha)
    const ahorro = totalAhorroProgramado(periodicItems)
    // Un ciclo nuevo todavía no tiene registros de "aproximado": siempre cuenta el presupuesto.
    const aproximadoTotal = totalAproximadoEnVivo(resolverAproximados(periodicItems, [], 'nuevo'))

    const colchonInicial = calcularColchonInicial({
      salarioImporte: importe,
      totalFijos: fijos,
      totalFraccionados: fraccionados,
      totalAproximado: aproximadoTotal,
      totalAhorroProgramado: ahorro,
      presupuestoComida: settings.presupuestoComidaMensual,
      deficitArrastrado,
    })

    setResumen(previo)
    setCalculoNuevo({
      totalFijos: fijos,
      totalFraccionados: fraccionados,
      totalAproximado: aproximadoTotal,
      totalAhorroProgramado: ahorro,
      presupuestoComida: settings.presupuestoComidaMensual,
      deficitArrastrado,
      colchonInicial,
    })
    setCargando(false)
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

  const importeSalario = parsearImporte(importeTexto) ?? 0

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
          {resumen && (
            <>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Así queda el ciclo actual antes de cerrarlo. Lo que sobre pasa a la hucha; si alguna bolsa quedó en
                negativo, se descuenta del colchón del ciclo nuevo.
              </p>
              <ResumenCierreView resumen={resumen} />
            </>
          )}

          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Así queda el colchón del ciclo nuevo, con salario de {formatearEuros(importeSalario)} desde el{' '}
            {formatearFechaEs(fecha)}:
          </p>
          {calculoNuevo && (
            <CalculoColchonView
              salarioImporte={importeSalario}
              totalFijos={calculoNuevo.totalFijos}
              totalFraccionados={calculoNuevo.totalFraccionados}
              totalAproximado={calculoNuevo.totalAproximado}
              totalAhorroProgramado={calculoNuevo.totalAhorroProgramado}
              presupuestoComida={calculoNuevo.presupuestoComida}
              deficitArrastrado={calculoNuevo.deficitArrastrado}
              colchonInicial={calculoNuevo.colchonInicial}
            />
          )}

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
