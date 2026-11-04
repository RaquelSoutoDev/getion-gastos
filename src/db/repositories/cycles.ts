import { calcularCierreYApertura, calcularResumenCierre } from '../../core/cierre'
import { totalAhorroProgramado } from '../../core/periodicItems'
import type { Cycle, ResumenCierre } from '../../core/types'
import type { GestionGastoDB } from '../schema'
import { obtenerSettings } from './settings'

export async function obtenerCicloAbierto(db: GestionGastoDB): Promise<Cycle | null> {
  const ciclo = await db.cycles.where('estado').equals('abierto').first()
  return ciclo ?? null
}

export async function obtenerCiclo(db: GestionGastoDB, id: string): Promise<Cycle | null> {
  const ciclo = await db.cycles.get(id)
  return ciclo ?? null
}

export async function listarCiclosCerrados(db: GestionGastoDB): Promise<Cycle[]> {
  const ciclos = await db.cycles.where('estado').equals('cerrado').toArray()
  return ciclos.sort((a, b) => b.numero - a.numero)
}

/**
 * Calcula (sin persistir) cómo quedaría el cierre del ciclo abierto si se
 * registrara un salario ahora. Para mostrar el resumen de confirmación antes
 * de llamar a `registrarSalario`. `null` si no hay ciclo abierto (primer
 * salario que se registra jamás).
 */
export async function previsualizarCierreCicloActual(db: GestionGastoDB): Promise<ResumenCierre | null> {
  const cicloAbierto = await obtenerCicloAbierto(db)
  if (!cicloAbierto) return null

  const [periodicItems, settings, gastos, registrosAproximado] = await Promise.all([
    db.periodicItems.toArray(),
    obtenerSettings(db),
    db.gastos.where('cicloId').equals(cicloAbierto.id).toArray(),
    db.registrosAproximado.where('cicloId').equals(cicloAbierto.id).toArray(),
  ])

  return calcularResumenCierre({ cycle: cicloAbierto, periodicItems, registrosAproximado, gastos, settings })
}

/**
 * Registra un salario: cierra el ciclo abierto (si lo hay) congelando su
 * resumen, reparte su sobrante o déficit, y abre el ciclo nuevo con el
 * ahorro programado ya apartado a la hucha. Operación atómica.
 */
export async function registrarSalario(db: GestionGastoDB, salarioImporte: number, fecha: string): Promise<Cycle> {
  return db.transaction(
    'rw',
    [db.cycles, db.gastos, db.registrosAproximado, db.periodicItems, db.huchaMovimientos, db.settings],
    async () => {
      const cicloAbierto = await obtenerCicloAbierto(db)
      const periodicItems = await db.periodicItems.toArray()
      const settings = await obtenerSettings(db)

      const gastosCicloAnterior = cicloAbierto
        ? await db.gastos.where('cicloId').equals(cicloAbierto.id).toArray()
        : []
      const registrosCicloAnterior = cicloAbierto
        ? await db.registrosAproximado.where('cicloId').equals(cicloAbierto.id).toArray()
        : []

      const resultado = calcularCierreYApertura({
        cicloAnterior: cicloAbierto,
        periodicItems,
        registrosAproximadoCicloAnterior: registrosCicloAnterior,
        gastosCicloAnterior,
        settings,
      })

      if (cicloAbierto && resultado.resumenCicloAnterior) {
        await db.cycles.update(cicloAbierto.id, {
          estado: 'cerrado',
          fechaFin: fecha,
          resumenCierre: resultado.resumenCicloAnterior,
        })

        if (resultado.resumenCicloAnterior.aportacionHuchaSobrante > 0) {
          await db.huchaMovimientos.add({
            id: crypto.randomUUID(),
            fecha,
            importe: resultado.resumenCicloAnterior.aportacionHuchaSobrante,
            origen: 'sobrante_ciclo',
            concepto: `Sobrante del ciclo ${cicloAbierto.numero}`,
            cicloId: cicloAbierto.id,
          })
        }
      }

      const numero = (cicloAbierto?.numero ?? 0) + 1
      const nuevoCiclo: Cycle = {
        id: crypto.randomUUID(),
        numero,
        fechaInicio: fecha,
        fechaFin: null,
        salarioImporte,
        estado: 'abierto',
        deficitArrastrado: resultado.deficitArrastradoNuevoCiclo,
        resumenCierre: null,
      }
      await db.cycles.add(nuevoCiclo)

      const ahorroProgramado = totalAhorroProgramado(periodicItems)
      if (ahorroProgramado > 0) {
        await db.huchaMovimientos.add({
          id: crypto.randomUUID(),
          fecha,
          importe: ahorroProgramado,
          origen: 'ahorro_programado',
          concepto: `Ahorro programado - Ciclo ${numero}`,
          cicloId: nuevoCiclo.id,
        })
      }

      return nuevoCiclo
    },
  )
}
