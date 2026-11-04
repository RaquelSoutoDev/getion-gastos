interface StatTileProps {
  label: string
  valor: string
  tono?: 'default' | 'grande'
  negativo?: boolean
}

export function StatTile({ label, valor, tono = 'default', negativo }: StatTileProps) {
  const tamano = tono === 'grande' ? 'text-5xl' : 'text-2xl'
  const color = negativo ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-neutral-50'

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-neutral-900">
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className={`mt-1 font-bold tracking-tight ${tamano} ${color}`}>{valor}</p>
    </div>
  )
}
