'use client'

import { memo, useCallback } from 'react'

type ModuloAcessoCardProps = {
  titulo: string
  descricao: string
  href: string
  permitido: boolean
  cor?: 'azul' | 'verde' | 'roxo' | 'laranja'
}

function getBadge(cor: ModuloAcessoCardProps['cor']) {
  switch (cor) {
    case 'verde':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    case 'roxo':
      return 'bg-violet-50 text-violet-700 ring-1 ring-violet-200'
    case 'laranja':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
    default:
      return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
  }
}

function ModuloAcessoCardInner({
  titulo,
  descricao,
  href,
  permitido,
  cor = 'azul',
}: ModuloAcessoCardProps) {
  const entrar = useCallback(() => {
    if (!permitido) {
      window.alert('Usuário não tem acesso a este módulo')
      return
    }

    window.location.href = href
  }, [permitido, href])

  return (
    <div className="ui-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-slate-950">
            {titulo}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {descricao}
          </p>
        </div>

        <span className={`badge ${permitido ? getBadge(cor) : 'badge-muted'}`}>
          {permitido ? 'Acesso liberado' : 'Sem acesso'}
        </span>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={entrar}
          className={permitido ? 'btn-primary' : 'btn-secondary cursor-not-allowed'}
          disabled={!permitido}
        >
          Entrar no módulo
        </button>
      </div>
    </div>
  )
}

export const ModuloAcessoCard = memo(ModuloAcessoCardInner)
