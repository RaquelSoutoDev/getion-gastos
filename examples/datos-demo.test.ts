import 'fake-indexeddb/auto'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { calcularColchonInicial } from '../src/core/colchon'
import { resolverAproximados, totalAhorroProgramado, totalAproximadoEnVivo, totalFijos, totalFraccionadosVigentes } from '../src/core/periodicItems'
import { parsearBackup, importarDatos } from '../src/db/backup'
import { GestionGastoDB } from '../src/db/schema'
import { obtenerSaldoHucha } from '../src/db/repositories/hucha'

const RUTA_DEMO = resolve(dirname(fileURLToPath(import.meta.url)), 'datos-demo.json')

describe('examples/datos-demo.json', () => {
  it('tiene forma de backup válida y se importa sin errores', async () => {
    const texto = readFileSync(RUTA_DEMO, 'utf-8')
    const data = parsearBackup(texto)

    const db = new GestionGastoDB(`test-demo-${crypto.randomUUID()}`)
    await importarDatos(db, data)

    expect(await db.periodicItems.toArray()).toHaveLength(4)
    expect(await db.cycles.toArray()).toHaveLength(2)
    expect(await db.gastos.toArray()).toHaveLength(8)
    expect(await db.registrosAproximado.toArray()).toHaveLength(1)
    expect(await db.huchaMovimientos.toArray()).toHaveLength(4)
  })

  it('el saldo de la hucha resultante es la suma de sus movimientos', async () => {
    const texto = readFileSync(RUTA_DEMO, 'utf-8')
    const data = parsearBackup(texto)
    const db = new GestionGastoDB(`test-demo-${crypto.randomUUID()}`)
    await importarDatos(db, data)

    expect(await obtenerSaldoHucha(db)).toBe(82000)
  })

  it('el colchón inicial del ciclo 2 (abierto) cuadra con la fórmula real', async () => {
    const texto = readFileSync(RUTA_DEMO, 'utf-8')
    const data = parsearBackup(texto)
    const ciclo2 = data.cycles.find((c) => c.id === 'ciclo-2')
    if (!ciclo2) throw new Error('ciclo-2 no está en el JSON de demo')

    const fijos = totalFijos(data.periodicItems)
    const fraccionados = totalFraccionadosVigentes(data.periodicItems, ciclo2.fechaInicio)
    const ahorro = totalAhorroProgramado(data.periodicItems)
    const aproximados = resolverAproximados(data.periodicItems, data.registrosAproximado, ciclo2.id)
    const aproximado = totalAproximadoEnVivo(aproximados)

    const colchonInicial = calcularColchonInicial({
      salarioImporte: ciclo2.salarioImporte,
      totalFijos: fijos,
      totalFraccionados: fraccionados,
      totalAproximado: aproximado,
      totalAhorroProgramado: ahorro,
      presupuestoComida: data.settings.presupuestoComidaMensual,
      deficitArrastrado: ciclo2.deficitArrastrado,
    })

    expect(colchonInicial).toBe(54000)
  })

  it('el resumen de cierre guardado en el ciclo 1 cuadra con la fórmula real', async () => {
    const texto = readFileSync(RUTA_DEMO, 'utf-8')
    const data = parsearBackup(texto)
    const ciclo1 = data.cycles.find((c) => c.id === 'ciclo-1')
    if (!ciclo1 || !ciclo1.resumenCierre) throw new Error('ciclo-1 no tiene resumenCierre en el JSON de demo')

    const fijos = totalFijos(data.periodicItems)
    const fraccionados = totalFraccionadosVigentes(data.periodicItems, ciclo1.fechaInicio)
    const ahorro = totalAhorroProgramado(data.periodicItems)
    const aproximados = resolverAproximados(data.periodicItems, data.registrosAproximado, ciclo1.id)
    const aproximado = totalAproximadoEnVivo(aproximados)

    const colchonInicial = calcularColchonInicial({
      salarioImporte: ciclo1.salarioImporte,
      totalFijos: fijos,
      totalFraccionados: fraccionados,
      totalAproximado: aproximado,
      totalAhorroProgramado: ahorro,
      presupuestoComida: data.settings.presupuestoComidaMensual,
      deficitArrastrado: ciclo1.deficitArrastrado,
    })

    expect(colchonInicial).toBe(ciclo1.resumenCierre.colchonInicial)

    const gastosComida = data.gastos.filter((g) => g.cicloId === ciclo1.id && g.bolsa === 'comida')
    const gastosColchon = data.gastos.filter((g) => g.cicloId === ciclo1.id && g.bolsa === 'colchon')
    const gastosComidaTotal = gastosComida.reduce((s, g) => s + g.importe, 0)
    const gastosColchonTotal = gastosColchon.reduce((s, g) => s + g.importe, 0)

    expect(gastosComidaTotal).toBe(ciclo1.resumenCierre.gastosComidaTotal)
    expect(gastosColchonTotal).toBe(ciclo1.resumenCierre.gastosColchonTotal)
    expect(data.settings.presupuestoComidaMensual - gastosComidaTotal).toBe(ciclo1.resumenCierre.sobranteComida)
    expect(colchonInicial - gastosColchonTotal).toBe(ciclo1.resumenCierre.sobranteColchon)
  })
})
