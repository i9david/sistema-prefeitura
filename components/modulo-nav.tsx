import Link from 'next/link'
import { LogoutButton } from '@/components/logout-button'

type ModuloNavItem = {
  label: string
  href: string
}

type ModuloNavProps = {
  titulo: string
  currentPath?: string
  itens: ModuloNavItem[]
  cor?: 'azul' | 'verde' | 'roxo' | 'laranja'
}

function isActive(pathname: string, href: string) {
  if (!pathname) return false
  if (href === pathname) return true
  if (href !== '/' && pathname.startsWith(`${href}/`)) return true
  return false
}

function getClasses(cor: ModuloNavProps['cor']) {
  switch (cor) {
    case 'verde':
      return {
        header: 'from-emerald-700 via-emerald-600 to-green-600',
        active: 'bg-emerald-600 text-white shadow-sm',
      }
    case 'roxo':
      return {
        header: 'from-violet-700 via-violet-600 to-fuchsia-600',
        active: 'bg-violet-600 text-white shadow-sm',
      }
    case 'laranja':
      return {
        header: 'from-orange-700 via-orange-600 to-amber-500',
        active: 'bg-orange-600 text-white shadow-sm',
      }
    default:
      return {
        header: 'from-blue-700 via-blue-600 to-indigo-600',
        active: 'bg-blue-600 text-white shadow-sm',
      }
  }
}

export function ModuloNav({
  titulo,
  currentPath = '',
  itens,
  cor = 'azul',
}: ModuloNavProps) {
  const classes = getClasses(cor)

  return (
    <aside className="h-fit rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className={`rounded-3xl bg-gradient-to-br ${classes.header} p-6 text-white shadow-lg`}>
        <h2 className="text-2xl font-bold tracking-tight">{titulo}</h2>
      </div>

      <div className="mt-5 space-y-2">
        <Link
          href="/dashboard"
          className="block rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          ← Voltar ao início
        </Link>

        <LogoutButton className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100" />
      </div>

      <nav className="mt-5 space-y-1.5">
        {itens.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
              isActive(currentPath, item.href)
                ? classes.active
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}