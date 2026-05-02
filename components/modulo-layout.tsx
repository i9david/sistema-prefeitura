import Link from 'next/link'

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
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
          <h2 className="text-2xl font-bold text-slate-900">{titulo}</h2>

          <div className="mt-5 space-y-2">
            <Link
              href="/"
              className="block rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ← Voltar ao início
            </Link>

            <Link
              href="/login"
              className="block rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Sair do sistema
            </Link>
          </div>

          {itens.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 px-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Navegação do módulo
              </p>

              <nav className="space-y-1.5">
                {itens.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive(item.href)
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </aside>

        <section>{children}</section>
      </div>
    </main>
  )
}