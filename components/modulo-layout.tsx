import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

type ModuloItem = {
  label: string
  href: string
}

export function ModuloLayout({
  titulo,
  children,
  itens = [],
  currentPath = '',
}: {
  titulo: string
  children: React.ReactNode
  itens?: ModuloItem[]
  currentPath?: string
}) {
  function isActive(href: string) {
    if (!currentPath) return false
    if (href === currentPath) return true
    if (href !== '/' && currentPath.startsWith(`${href}/`)) return true
    return false
  }

  return (
    <main className="app-shell">
      <div className="app-container grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="sidebar-shell">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              Módulo
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{titulo}</h2>
          </div>

          <div className="mt-4">
            <Link href="/" className="btn-ghost w-full justify-start">
              <ChevronLeft size={16} />
              Voltar ao início
            </Link>
          </div>

          {itens.length > 0 && (
            <nav className="mt-5 space-y-1.5">
              <p className="sidebar-section-label">Navegação</p>

              {itens.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${
                    isActive(item.href) ? 'sidebar-link-active' : ''
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </aside>

        <section className="min-w-0">{children}</section>
      </div>
    </main>
  )
}
