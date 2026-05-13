import type { ReactNode } from 'react'

type ModuleLayoutProps = {
  sidebar: ReactNode
  children: ReactNode
}

export function ModuleLayout({ sidebar, children }: ModuleLayoutProps) {
  return (
    <main className="min-h-screen bg-[var(--color-page)] p-6">
      <div className="module-shell mx-auto grid max-w-7xl gap-6">
        {sidebar}

        <section className="min-w-0 space-y-6">{children}</section>
      </div>
    </main>
  )
}
