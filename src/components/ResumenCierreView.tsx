import { formatearEuros } from '../core/money'
import type { ResumenCierre } from '../core/types'

export function ResumenCierreView({ resumen }: { resumen: ResumenCierre }) {
  const hayDeficit = resumen.deficitArrastrado > 0

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-neutral-100 p-4 dark:bg-neutral-800">
      <Fila label="Colchón inicial" valor={resumen.colchonInicial} />
      <Fila label="Comida inicial" valor={resumen.comidaInicial} />
      <Fila label="Gastos colchón" valor={-resumen.gastosColchonTotal} />
      <Fila label="Gastos comida" valor={-resumen.gastosComidaTotal} />
      <hr className="border-neutral-200 dark:border-neutral-700" />
      <Fila label="Sobrante colchón" valor={resumen.sobranteColchon} destacado />
      <Fila label="Sobrante comida" valor={resumen.sobranteComida} destacado />

      {hayDeficit && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          Alguna bolsa quedó en negativo: se descontarán {formatearEuros(resumen.deficitArrastrado)} del colchón del
          ciclo nuevo.
        </p>
      )}

      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Va a la hucha:{' '}
        <span className="font-semibold text-neutral-900 dark:text-neutral-50">
          {formatearEuros(resumen.aportacionHuchaSobrante)}
        </span>
      </p>
    </div>
  )
}

function Fila({ label, valor, destacado }: { label: string; valor: number; destacado?: boolean }) {
  const negativo = valor < 0
  const pesoClase = destacado ? 'font-bold' : 'font-medium'
  const colorClase = negativo ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-neutral-50'

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
      <span className={`${pesoClase} ${colorClase}`}>{formatearEuros(valor)}</span>
    </div>
  )
}
