import type { ButtonHTMLAttributes } from 'react'

type Variante = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
}

const estilos: Record<Variante, string> = {
  primary: 'bg-blue-600 text-white active:bg-blue-700 dark:bg-blue-500 dark:active:bg-blue-600',
  secondary:
    'bg-neutral-100 text-neutral-900 active:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:active:bg-neutral-700',
  danger: 'bg-red-600 text-white active:bg-red-700 dark:bg-red-500 dark:active:bg-red-600',
  ghost: 'bg-transparent text-blue-600 active:bg-blue-50 dark:text-blue-400 dark:active:bg-blue-950',
}

export function Button({ variante = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-base font-semibold transition-colors disabled:opacity-40 ${estilos[variante]} ${className}`}
      {...props}
    />
  )
}
