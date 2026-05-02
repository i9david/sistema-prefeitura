'use client'

type ModuloAcessoCardProps = {
  titulo: string
  descricao: string
  href: string
  permitido: boolean
  cor?: 'azul' | 'verde' | 'roxo' | 'laranja'
}

function getClasses(cor: ModuloAcessoCardProps['cor']) {
  switch (cor) {
    case 'verde':
      return {
        botao: 'bg-emerald-600 hover:bg-emerald-700',
        badge: 'bg-emerald-100 text-emerald-700',
      }
    case 'roxo':
      return {
        botao: 'bg-violet-600 hover:bg-violet-700',
        badge: 'bg-violet-100 text-violet-700',
      }
    case 'laranja':
      return {
        botao: 'bg-orange-600 hover:bg-orange-700',
        badge: 'bg-orange-100 text-orange-700',
      }
    default:
      return {
        botao: 'bg-blue-600 hover:bg-blue-700',
        badge: 'bg-blue-100 text-blue-700',
      }
  }
}

export function ModuloAcessoCard({
  titulo,
  descricao,
  href,
  permitido,
  cor = 'azul',
}: ModuloAcessoCardProps) {
  const classes = getClasses(cor)

  function entrar() {
    if (!permitido) {
      window.alert('Usuário não tem acesso a este módulo')
      return
    }

    window.location.href = href
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-slate-900">
            {titulo}
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            {descricao}
          </p>
        </div>

        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            permitido
              ? classes.badge
              : 'bg-slate-200 text-slate-600'
          }`}
        >
          {permitido ? 'Acesso liberado' : 'Sem acesso'}
        </span>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={entrar}
          className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
            permitido
              ? classes.botao
              : 'cursor-not-allowed bg-slate-400'
          }`}
        >
          Entrar no módulo
        </button>
      </div>
    </div>
  )
}