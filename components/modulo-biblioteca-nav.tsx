import Link from 'next/link'

type ModuloBibliotecaNavProps = {
  currentPath?: string
}

function isActive(pathname: string, href: string) {
  if (!pathname) return false
  if (href === pathname) return true
  if (href !== '/' && pathname.startsWith(`${href}/`)) return true
  return false
}

export function ModuloBibliotecaNav({
  currentPath = '',
}: ModuloBibliotecaNavProps) {
  return (
    <aside className="h-fit rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-600 p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold tracking-tight">Biblioteca Municipal</h2>
      </div>

      <div className="mt-5 space-y-2">
        <Link
          href="/dashboard"
          className="block rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          ← Voltar ao início
        </Link>

        <Link
          href="/login"
          className="block rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
          Sair do sistema
        </Link>
      </div>

      <nav className="mt-5 space-y-1.5">
        <Link
          href="/biblioteca"
          className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
            currentPath === '/biblioteca'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Visão do módulo
        </Link>

        <Link
          href="/biblioteca/leitores"
          className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
            isActive(currentPath, '/biblioteca/leitores')
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Leitores
        </Link>

        <Link
          href="/biblioteca/livros"
          className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
            isActive(currentPath, '/biblioteca/livros')
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Acervo
        </Link>

        <Link
          href="/biblioteca/emprestimos"
          className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
            isActive(currentPath, '/biblioteca/emprestimos')
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Empréstimos
        </Link>

        <Link
          href="/biblioteca/relatorios"
          className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
            isActive(currentPath, '/biblioteca/relatorios')
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Relatórios
        </Link>
      </nav>
    </aside>
  )
}