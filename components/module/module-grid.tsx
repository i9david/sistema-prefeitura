import type { ReactNode } from 'react'
import { ModuleCard } from '@/components/module/module-card'

type ModuleGridProps = {
  children: ReactNode
  columns?: 2 | 3 | 4 | 5
  className?: string
}

type ModuleSectionGridProps = {
  title: string
  description?: string
  children: ReactNode
  columns?: 2 | 3 | 4
}

function getColumns(columns: ModuleGridProps['columns']) {
  switch (columns) {
    case 2:
      return 'grid gap-4 md:grid-cols-2'
    case 3:
      return 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'
    case 5:
      return 'grid gap-4 md:grid-cols-2 xl:grid-cols-5'
    default:
      return 'grid gap-4 md:grid-cols-2 xl:grid-cols-4'
  }
}

export function ModuleGrid({
  children,
  columns = 3,
  className = '',
}: ModuleGridProps) {
  return <div className={`${getColumns(columns)} ${className}`}>{children}</div>
}

export function ModuleSectionGrid({
  title,
  description,
  children,
  columns = 3,
}: ModuleSectionGridProps) {
  return (
    <ModuleCard>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>

      <ModuleGrid columns={columns}>{children}</ModuleGrid>
    </ModuleCard>
  )
}
