import { formatearEuros } from '../core/money'

interface CalculoColchonViewProps {
  salarioImporte: number
  totalFijos: number
  totalFraccionados: number
  totalAproximado: number
  totalAhorroProgramado: number
  presupuestoComida: number
  deficitArrastrado: number
  colchonInicial: number
  /** Si se indica junto a `disponible`, añade las filas de gastos ya registrados → disponible. */
  gastosRegistrados?: number
  disponible?: number
}

/**
 * Desglosa la fórmula del colchón: salario − fijos − fraccionados vigentes −
 * aproximados − ahorro programado − comida − déficit arrastrado = colchón.
 */
export function CalculoColchonView({
  salarioImporte,
  totalFijos,
  totalFraccionados,
  totalAproximado,
  totalAhorroProgramado,
  presupuestoComida,
  deficitArrastrado,
  colchonInicial,
  gastosRegistrados,
  disponible,
}: CalculoColchonViewProps) {
  const hayDisponible = gastosRegistrados !== undefined && disponible !== undefined

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-neutral-100 p-4 dark:bg-neutral-800">
      <Fila label="Salario" valor={salarioImporte} />
      <Fila label="Gastos fijos" valor={-totalFijos} />
      <Fila label="Cuotas fraccionadas vigentes" valor={-totalFraccionados} />
      <Fila label="Gastos aproximados" valor={-totalAproximado} />
      <Fila label="Ahorro programado" valor={-totalAhorroProgramado} />
      <Fila label="Presupuesto de comida" valor={-presupuestoComida} />
      {deficitArrastrado > 0 && <Fila label="Déficit arrastrado del ciclo anterior" valor={-deficitArrastrado} />}
      <hr className="border-neutral-200 dark:border-neutral-700" />
      <Fila label="Colchón inicial" valor={colchonInicial} destacado={!hayDisponible} />
      {hayDisponible && (
        <>
          <Fila label="Gastos ya registrados en el colchón" valor={-gastosRegistrados} />
          <hr className="border-neutral-200 dark:border-neutral-700" />
          <Fila label="Colchón disponible" valor={disponible} destacado />
        </>
      )}
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
