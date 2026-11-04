interface NumberFieldProps {
  label: string
  value: string
  onChange: (texto: string) => void
  autoFocus?: boolean
  placeholder?: string
  error?: string
}

export function NumberField({ label, value, onChange, autoFocus, placeholder = '0,00', error }: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900">
        <input
          type="text"
          inputMode="decimal"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-3xl font-semibold text-neutral-900 outline-none dark:text-neutral-50"
        />
        <span className="text-xl font-semibold text-neutral-400 dark:text-neutral-500">€</span>
      </div>
      {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
    </label>
  )
}
