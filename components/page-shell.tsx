import Link from 'next/link'
import type { ReactNode } from 'react'
import { ModuleEmptyState } from '@/components/module/module-state'

type PageShellProps = {
  nav: ReactNode
  title: string
  subtitle: string
  primaryAction?: {
    label: string
    href: string
  } | null
  children: ReactNode
}

type PageFiltersProps = {
  title?: string
  subtitle?: string
  children: ReactNode
}

type PageListProps = {
  title: string
  subtitle?: string
  meta?: ReactNode
  children: ReactNode
}

export function PageShell({
  nav,
  title,
  subtitle,
  primaryAction,
  children,
}: PageShellProps) {
  return (
    <main className="app-shell">
      <div className="app-container module-shell grid gap-6">
        {nav}

        <section className="min-w-0 space-y-6">
          <div className="page-header">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="page-title">{title}</h1>
                <p className="page-subtitle">{subtitle}</p>
              </div>

              {primaryAction && (
                <Link href={primaryAction.href} className="btn-primary">
                  {primaryAction.label}
                </Link>
              )}
            </div>
          </div>

          {children}
        </section>
      </div>
    </main>
  )
}

export function PageFilters({
  title = 'Filtros',
  subtitle = 'Refine os resultados exibidos na listagem.',
  children,
}: PageFiltersProps) {
  return (
    <div className="ui-card">
      <div className="ui-card-header">
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>

      <div className="ui-card-body">{children}</div>
    </div>
  )
}

export function PageList({
  title,
  subtitle,
  meta,
  children,
}: PageListProps) {
  return (
    <div className="ui-card">
      <div className="ui-card-header">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>

          {meta && <div>{meta}</div>}
        </div>
      </div>

      <div className="ui-card-body">{children}</div>
    </div>
  )
}

export function PageEmptyState({ children }: { children: ReactNode }) {
  return <ModuleEmptyState title={String(children)} />
}
