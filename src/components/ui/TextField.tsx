import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function TextField({ label, className = '', ...props }: TextFieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
      <input
        className={`rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50 ${className}`}
        {...props}
      />
    </label>
  )
}
