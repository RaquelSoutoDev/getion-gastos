import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { formatearFechaEs } from '../../core/dates'
import type { FechaISO } from '../../core/types'
import { hoyISO } from '../../lib/hoy'

interface DateFieldProps {
  label: string
  value: FechaISO | null
  onChange: (value: FechaISO | null) => void
  placeholder?: string
  /** Si se indica, aparece un enlace para dejar el campo sin fecha. */
  allowClear?: boolean
}

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function aISO(anio: number, mesIndice: number, dia: number): FechaISO {
  return `${anio}-${pad2(mesIndice + 1)}-${pad2(dia)}`
}

function partesDe(iso: FechaISO): { anio: number; mesIndice: number; dia: number } {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return { anio, mesIndice: mes - 1, dia }
}

/** Celdas del mes: `null` son huecos de relleno antes del día 1 (semana empieza en lunes). */
function construirCeldasMes(anio: number, mesIndice: number): (number | null)[] {
  const primerDiaSemana = new Date(anio, mesIndice, 1).getDay()
  const relleno = (primerDiaSemana + 6) % 7
  const diasEnMes = new Date(anio, mesIndice + 1, 0).getDate()
  return [...Array(relleno).fill(null), ...Array.from({ length: diasEnMes }, (_, i) => i + 1)]
}

/**
 * Selector de fecha propio: el `<input type="date">` nativo abre su calendario
 * anclado al campo, y dentro de un sheet (que ocupa la parte baja de la
 * pantalla) ese calendario queda recortado contra el borde de la ventana,
 * dejando fechas sin poder seleccionar. Este componente se centra siempre en
 * pantalla, así que nunca se recorta.
 */
export function DateField({ label, value, onChange, placeholder = 'Sin fecha', allowClear }: DateFieldProps) {
  const [abierto, setAbierto] = useState(false)
  const base = value ? partesDe(value) : partesDe(hoyISO())
  const [vistaAnio, setVistaAnio] = useState(base.anio)
  const [vistaMesIndice, setVistaMesIndice] = useState(base.mesIndice)

  function abrir() {
    const partes = value ? partesDe(value) : partesDe(hoyISO())
    setVistaAnio(partes.anio)
    setVistaMesIndice(partes.mesIndice)
    setAbierto(true)
  }

  function cambiarMes(delta: number) {
    let mes = vistaMesIndice + delta
    let anio = vistaAnio
    if (mes < 0) {
      mes = 11
      anio -= 1
    } else if (mes > 11) {
      mes = 0
      anio += 1
    }
    setVistaMesIndice(mes)
    setVistaAnio(anio)
  }

  function elegirDia(dia: number) {
    onChange(aISO(vistaAnio, vistaMesIndice, dia))
    setAbierto(false)
  }

  const seleccionado = value ? partesDe(value) : null
  const celdas = construirCeldasMes(vistaAnio, vistaMesIndice)

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
      <button
        type="button"
        onClick={abrir}
        className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-left text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
      >
        {value ? formatearFechaEs(value) : <span className="text-neutral-400">{placeholder}</span>}
      </button>
      {allowClear && value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="self-start text-sm font-medium text-blue-600 dark:text-blue-400"
        >
          Quitar fecha
        </button>
      )}

      {abierto &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Cerrar"
              className="absolute inset-0 bg-black/40"
              onClick={() => setAbierto(false)}
            />
            <div className="relative z-10 w-full max-w-xs rounded-3xl bg-white p-4 shadow-xl dark:bg-neutral-900">
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => cambiarMes(-1)}
                  aria-label="Mes anterior"
                  className="rounded-full p-2 text-neutral-500 active:bg-neutral-100 dark:text-neutral-400 dark:active:bg-neutral-800"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-semibold text-neutral-900 capitalize dark:text-neutral-50">
                  {MESES[vistaMesIndice]} {vistaAnio}
                </span>
                <button
                  type="button"
                  onClick={() => cambiarMes(1)}
                  aria-label="Mes siguiente"
                  className="rounded-full p-2 text-neutral-500 active:bg-neutral-100 dark:text-neutral-400 dark:active:bg-neutral-800"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral-400">
                {DIAS_SEMANA.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              <div className="mt-1 grid grid-cols-7 gap-1">
                {celdas.map((dia, i) => {
                  if (dia === null) return <span key={`hueco-${i}`} />
                  const esSeleccionado =
                    seleccionado !== null &&
                    seleccionado.anio === vistaAnio &&
                    seleccionado.mesIndice === vistaMesIndice &&
                    seleccionado.dia === dia

                  return (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => elegirDia(dia)}
                      className={`flex h-9 items-center justify-center rounded-full text-sm ${
                        esSeleccionado
                          ? 'bg-blue-600 font-semibold text-white'
                          : 'text-neutral-900 active:bg-neutral-100 dark:text-neutral-50 dark:active:bg-neutral-800'
                      }`}
                    >
                      {dia}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
