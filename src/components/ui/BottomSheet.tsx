import { X } from 'lucide-react'
import { type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previo
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-xl dark:bg-neutral-900">
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-2 text-neutral-400 active:bg-neutral-100 dark:active:bg-neutral-800"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
