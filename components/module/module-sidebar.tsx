import Link from 'next/link'
import { ChevronLeft, Circle, type LucideIcon } from 'lucide-react'
import { LogoutButton } from '@/components/logout-button'
import { SidebarCollapseToggle } from '@/components/sidebar-collapse-toggle'
import { ThemeToggle } from '@/components/theme-toggle'
import { getTenantPath } from '@/lib/tenant-paths-server'

export type ModuleSidebarItem = {
  label: string
  href: string
  icon?: LucideIcon
}

export type ModuleSidebarGroup = {
  label: string
  items: ModuleSidebarItem[]
}

export type ModuleAccent = 'blue' | 'emerald' | 'violet' | 'amber'

type ModuleSidebarProps = {
  title: string
  currentPath?: string
  groups: ModuleSidebarGroup[]
  accent?: ModuleAccent
  backHref?: string
  backLabel?: string
  context?: string
}

function isActive(pathname: string, href: string) {
  if (!pathname) return false
  if (href === pathname) return true
  if (href !== '/' && pathname.startsWith(`${href}/`)) return true
  return false
}

function getAccentClass(accent: ModuleAccent) {
  switch (accent) {
    case 'emerald':
      return 'bg-emerald-600'
    case 'violet':
      return 'bg-violet-600'
    case 'amber':
      return 'bg-amber-600'
    default:
      return 'bg-blue-600'
  }
}

function getActiveClass(accent: ModuleAccent) {
  switch (accent) {
    case 'emerald':
      return 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-600 hover:text-white'
    case 'violet':
      return 'bg-violet-600 text-white shadow-sm hover:bg-violet-600 hover:text-white'
    case 'amber':
      return 'bg-amber-600 text-white shadow-sm hover:bg-amber-600 hover:text-white'
    default:
      return 'bg-blue-600 text-white shadow-sm hover:bg-blue-600 hover:text-white'
  }
}

export function ModuleSidebar({
  title,
  currentPath = '',
  groups,
  accent = 'blue',
  backHref = '/dashboard',
  backLabel = 'Voltar ao início',
  context = 'Sistema municipal',
}: ModuleSidebarProps) {
  return (
    <aside className="sidebar-shell module-sidebar">
      <div className="module-sidebar-brand rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className={`mb-3 h-1.5 w-12 rounded-full ${getAccentClass(accent)}`} />
        <p className="module-sidebar-text text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          Módulo
        </p>
        <h2 className="module-sidebar-title mt-1 text-xl font-bold text-slate-950">
          {title}
        </h2>
        <p className="module-sidebar-context mt-1 text-xs font-medium text-slate-500">
          {context}
        </p>
      </div>

      <div className="mt-4 grid gap-2">
        <SidebarCollapseToggle />

        <ThemeToggle />

        <Link href={getTenantPath(backHref)} className="btn-ghost justify-start module-sidebar-control">
          <ChevronLeft size={16} aria-hidden="true" />
          <span className="module-sidebar-text">{backLabel}</span>
        </Link>

        <LogoutButton className="btn-danger w-full justify-start module-sidebar-control" />
      </div>

      <nav className="mt-5 space-y-5">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1.5">
            <div className="flex items-center gap-2 px-3">
              <Circle size={6} className="fill-slate-300 text-slate-300" aria-hidden="true" />
              <p className="sidebar-section-label module-sidebar-section-text px-0">
                {group.label}
              </p>
            </div>

            {group.items.map((item) => {
              const Icon = item.icon
              const active = isActive(currentPath, item.href)

              return (
                <Link
                  key={item.href}
                  href={getTenantPath(item.href)}
                  className={`sidebar-link ${active ? getActiveClass(accent) : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  {Icon && <Icon size={18} aria-hidden="true" />}
                  <span className="module-sidebar-text">{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
