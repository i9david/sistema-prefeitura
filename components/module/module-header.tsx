import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type ModuleHeaderProps = {
  title: string
  description: string
  eyebrow?: string
  icon?: LucideIcon
  action?: ReactNode
  meta?: ReactNode
  context?: string
  accent?: 'blue' | 'emerald' | 'violet' | 'amber'
}

function getAccentClass(accent: ModuleHeaderProps['accent']) {
  switch (accent) {
    case 'emerald':
      return 'border-emerald-100 bg-emerald-50 text-emerald-700'
    case 'violet':
      return 'border-violet-100 bg-violet-50 text-violet-700'
    case 'amber':
      return 'border-amber-100 bg-amber-50 text-amber-700'
    default:
      return 'border-blue-100 bg-blue-50 text-blue-700'
  }
}

export function ModuleHeader({
  title,
  description,
  eyebrow = 'Visão geral',
  icon: Icon,
  action,
  meta,
  context,
  accent = 'blue',
}: ModuleHeaderProps) {
  return (
    <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition duration-200 ease-out hover:shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${getAccentClass(accent)}`}
            >
              {Icon && <Icon size={14} aria-hidden="true" />}
              {eyebrow}
            </div>

            {context && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                {context}
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>

          {meta && <div className="mt-4 flex flex-wrap gap-2">{meta}</div>}
        </div>

        {action && <div className="w-full md:w-auto">{action}</div>}
      </div>
    </header>
  )
}
