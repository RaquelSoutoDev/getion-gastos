import { ChevronDown, ChevronUp } from 'lucide-react'
import { type ReactNode, useState } from 'react'

interface DisclosureProps {
  label: string
  labelAbierto?: string
  children: ReactNode
}

export function Disclosure({ label, labelAbierto, children }: DisclosureProps) {
  const [abierto, setAbierto] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center justify-center gap-1 text-sm font-medium text-neutral-500 dark:text-neutral-400"
      >
        {abierto ? labelAbierto ?? label : label}
        {abierto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {abierto && children}
    </div>
  )
}
