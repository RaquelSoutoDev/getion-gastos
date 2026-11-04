interface Opcion<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: Opcion<T>[]
}

export function SegmentedControl<T extends string>({ value, onChange, options }: SegmentedControlProps<T>) {
  return (
    <div className="flex gap-1 rounded-2xl bg-neutral-100 p-1 dark:bg-neutral-800">
      {options.map((opcion) => {
        const activo = opcion.value === value
        return (
          <button
            key={opcion.value}
            type="button"
            onClick={() => onChange(opcion.value)}
            className={`min-h-10 flex-1 rounded-xl text-sm font-semibold transition-colors ${
              activo
                ? 'bg-white text-neutral-900 shadow dark:bg-neutral-700 dark:text-neutral-50'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {opcion.label}
          </button>
        )
      })}
    </div>
  )
}
