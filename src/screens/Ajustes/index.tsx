import { useEffect, useRef, useState } from 'react'
import { Screen } from '../../components/layout/Screen'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { NumberField } from '../../components/ui/NumberField'
import { centimosATexto, parsearImporte } from '../../core/money'
import { borrarTodo, exportarDatos, importarDatos, parsearBackup, type BackupData } from '../../db/backup'
import { descargarBackup } from '../../db/backupFile'
import { db } from '../../db/schema'
import { actualizarSettings } from '../../db/repositories/settings'
import { useSettings } from '../../hooks/useSettings'
import { hoyISO } from '../../lib/hoy'

export function Ajustes() {
  const settings = useSettings()
  const inputArchivoRef = useRef<HTMLInputElement>(null)

  const [presupuestoTexto, setPresupuestoTexto] = useState('')
  const [diaCobro, setDiaCobro] = useState(1)
  const [errorPresupuesto, setErrorPresupuesto] = useState<string | null>(null)
  const [guardandoAjustes, setGuardandoAjustes] = useState(false)
  const [guardadoOk, setGuardadoOk] = useState(false)

  const [exportando, setExportando] = useState(false)

  const [backupPendiente, setBackupPendiente] = useState<BackupData | null>(null)
  const [errorImportar, setErrorImportar] = useState<string | null>(null)

  const [pasoBorrado, setPasoBorrado] = useState<0 | 1 | 2>(0)

  useEffect(() => {
    if (!settings) return
    setPresupuestoTexto(centimosATexto(settings.presupuestoComidaMensual))
    setDiaCobro(settings.diaCobroHabitual)
  }, [settings])

  async function guardarAjustes() {
    const presupuesto = parsearImporte(presupuestoTexto)
    if (presupuesto === null || presupuesto < 0) {
      setErrorPresupuesto('Introduce un importe válido')
      return
    }
    setErrorPresupuesto(null)
    setGuardandoAjustes(true)
    await actualizarSettings(db, { presupuestoComidaMensual: presupuesto, diaCobroHabitual: diaCobro })
    setGuardandoAjustes(false)
    setGuardadoOk(true)
    setTimeout(() => setGuardadoOk(false), 2000)
  }

  async function exportar() {
    setExportando(true)
    const data = await exportarDatos(db)
    descargarBackup(data)
    await actualizarSettings(db, { ultimaExportacion: hoyISO() })
    setExportando(false)
  }

  async function onArchivoSeleccionado(file: File | undefined) {
    if (!file) return
    setErrorImportar(null)
    try {
      const texto = await file.text()
      const data = parsearBackup(texto)
      setBackupPendiente(data)
    } catch (e) {
      setErrorImportar(e instanceof Error ? e.message : 'No se pudo leer el archivo')
    }
  }

  async function confirmarImportar() {
    if (!backupPendiente) return
    await importarDatos(db, backupPendiente)
    setBackupPendiente(null)
  }

  async function confirmarBorrarTodoDefinitivo() {
    await borrarTodo(db)
    setPasoBorrado(0)
  }

  return (
    <Screen title="Ajustes">
      <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/5">
        <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">General</h2>
        <NumberField
          label="Presupuesto de comida (mensual)"
          value={presupuestoTexto}
          onChange={setPresupuestoTexto}
          error={errorPresupuesto ?? undefined}
        />
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Día habitual de cobro</span>
          <select
            value={diaCobro}
            onChange={(e) => setDiaCobro(Number(e.target.value))}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => (
              <option key={dia} value={dia}>
                Día {dia}
              </option>
            ))}
          </select>
        </label>
        <Button onClick={guardarAjustes} disabled={guardandoAjustes}>
          {guardadoOk ? 'Guardado ✓' : guardandoAjustes ? 'Guardando…' : 'Guardar ajustes'}
        </Button>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/5">
        <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Copia de seguridad</h2>
        {settings?.ultimaExportacion && (
          <p className="text-sm text-neutral-400">Última exportación: {settings.ultimaExportacion}</p>
        )}
        <Button variante="secondary" onClick={exportar} disabled={exportando}>
          {exportando ? 'Exportando…' : 'Exportar todos los datos (JSON)'}
        </Button>
        <Button variante="secondary" onClick={() => inputArchivoRef.current?.click()}>
          Importar desde un archivo JSON
        </Button>
        <input
          ref={inputArchivoRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            void onArchivoSeleccionado(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        {errorImportar && <p className="text-sm text-red-600 dark:text-red-400">{errorImportar}</p>}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/5">
        <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Zona de peligro</h2>
        <Button variante="danger" onClick={() => setPasoBorrado(1)}>
          Borrar todos los datos
        </Button>
      </section>

      <ConfirmDialog
        open={backupPendiente !== null}
        title="¿Importar este backup?"
        description="Se reemplazarán TODOS los datos actuales del dispositivo por los del archivo. Esta acción no se puede deshacer."
        confirmLabel="Reemplazar todo"
        danger
        onConfirm={confirmarImportar}
        onCancel={() => setBackupPendiente(null)}
      />

      <ConfirmDialog
        open={pasoBorrado === 1}
        title="¿Borrar todos los datos?"
        description="Se perderán todos los ciclos, gastos, gastos periódicos y la hucha de ahorro de este dispositivo."
        confirmLabel="Continuar"
        danger
        onConfirm={() => setPasoBorrado(2)}
        onCancel={() => setPasoBorrado(0)}
      />

      <ConfirmDialog
        open={pasoBorrado === 2}
        title="Esto es definitivo"
        description="No hay vuelta atrás. ¿Confirmas que quieres borrar todos los datos de la app?"
        confirmLabel="Sí, borrar todo"
        danger
        onConfirm={confirmarBorrarTodoDefinitivo}
        onCancel={() => setPasoBorrado(0)}
      />
    </Screen>
  )
}
