import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  confirmDisabled?: boolean
  onConfirm: () => void
  onCancel: () => void
  children?: ReactNode
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger,
  confirmDisabled,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 max-h-[85dvh] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-5 shadow-xl dark:bg-neutral-900">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{title}</h2>
        {description && <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>}
        {children && <div className="mt-3">{children}</div>}
        <div className="mt-5 flex gap-3">
          <Button variante="secondary" className="flex-1" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variante={danger ? 'danger' : 'primary'} className="flex-1" disabled={confirmDisabled} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
