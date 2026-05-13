import { AlertTriangle, Loader2, SearchX, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type ModuleStateProps = {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
}

export function ModuleEmptyState({
  title,
  description,
  icon: Icon = SearchX,
  action,
}: ModuleStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
        <Icon size={20} aria-hidden="true" />
      </div>
      <h3 className="mt-3 text-sm font-bold text-slate-950">{title}</h3>
      {description && (
        <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ModuleErrorState({
  title,
  description,
  action,
}: ModuleStateProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-white text-red-600 shadow-sm">
        <AlertTriangle size={20} aria-hidden="true" />
      </div>
      <h3 className="mt-3 text-sm font-bold text-red-900">{title}</h3>
      {description && (
        <p className="mx-auto mt-1 max-w-lg text-sm text-red-700">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ModuleLoadingState({
  title = 'Carregando dados',
  description = 'Aguarde enquanto as informações são preparadas.',
}: Partial<ModuleStateProps>) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-50 text-blue-600">
        <Loader2 size={20} className="animate-spin" aria-hidden="true" />
      </div>
      <h3 className="mt-3 text-sm font-bold text-slate-950">{title}</h3>
      {description && (
        <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">
          {description}
        </p>
      )}
    </div>
  )
}

export function ModuleSkeletonGrid({ items = 6 }: { items?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-9 w-20 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-5 h-3 w-full animate-pulse rounded-full bg-slate-100" />
          <div className="mt-2 h-3 w-2/3 animate-pulse rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  )
}
