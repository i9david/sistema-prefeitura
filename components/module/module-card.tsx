import Link from 'next/link'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { getTenantPath } from '@/lib/tenant-paths-server'

type ModuleCardProps = {
  children: ReactNode
  className?: string
}

type ModuleMetricCardProps = {
  label: string
  value: ReactNode
  description?: string
  trend?: ReactNode
  icon?: LucideIcon
  accent?: 'blue' | 'emerald' | 'violet' | 'amber'
}

type ModuleAreaCardProps = {
  title: string
  description: string
  href: string
  icon?: LucideIcon
  accent?: 'blue' | 'emerald' | 'violet' | 'amber'
}

function getAccentClasses(accent: ModuleMetricCardProps['accent']) {
  switch (accent) {
    case 'emerald':
      return {
        soft: 'bg-emerald-50 text-emerald-700',
        hover: 'hover:border-emerald-200 focus-visible:ring-emerald-500 group-hover:bg-emerald-600',
      }
    case 'violet':
      return {
        soft: 'bg-violet-50 text-violet-700',
        hover: 'hover:border-violet-200 focus-visible:ring-violet-500 group-hover:bg-violet-600',
      }
    case 'amber':
      return {
        soft: 'bg-amber-50 text-amber-700',
        hover: 'hover:border-amber-200 focus-visible:ring-amber-500 group-hover:bg-amber-600',
      }
    default:
      return {
        soft: 'bg-blue-50 text-blue-700',
        hover: 'hover:border-blue-200 focus-visible:ring-blue-500 group-hover:bg-blue-600',
      }
  }
}

export function ModuleCard({ children, className = '' }: ModuleCardProps) {
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white p-6 shadow-[var(--shadow-soft)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </section>
  )
}

export function ModuleMetricCard({
  label,
  value,
  description,
  trend,
  icon: Icon,
  accent = 'blue',
}: ModuleMetricCardProps) {
  const classes = getAccentClasses(accent)

  return (
    <ModuleCard className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500/70 via-slate-300/40 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        {Icon && (
          <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${classes.soft}`}>
            <Icon size={19} aria-hidden="true" />
          </span>
        )}
      </div>

      {description && (
        <p className="mt-4 text-sm text-slate-500">{description}</p>
      )}

      {trend && <div className="mt-4">{trend}</div>}
    </ModuleCard>
  )
}

export function ModuleAreaCard({
  title,
  description,
  href,
  icon: Icon,
  accent = 'blue',
}: ModuleAreaCardProps) {
  const classes = getAccentClasses(accent)

  return (
    <Link
      href={getTenantPath(href)}
      className={`group flex min-h-36 flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${classes.hover}`}
    >
      <span className="flex items-center justify-between gap-4">
        {Icon && (
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-lg transition group-hover:text-white ${classes.soft} ${classes.hover}`}
          >
            <Icon size={20} aria-hidden="true" />
          </span>
        )}
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Abrir
        </span>
      </span>

      <span>
        <span className="block text-base font-bold text-slate-950">{title}</span>
        <span className="mt-2 block text-sm leading-6 text-slate-600">
          {description}
        </span>
      </span>
    </Link>
  )
}
