import type { ReactNode } from 'react'

interface ScreenProps {
  title: string
  action?: ReactNode
  children: ReactNode
}

export function Screen({ title, action, children }: ScreenProps) {
  return (
    <div className="min-h-dvh bg-neutral-50 pb-28 dark:bg-neutral-950">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-neutral-50/95 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 backdrop-blur dark:bg-neutral-950/95">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{title}</h1>
        {action}
      </header>
      <main className="flex flex-col gap-4 px-4 pb-4">{children}</main>
    </div>
  )
}
