import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function ModuloCard({ modulo }: any) {
  const Icon = modulo.icon

  return (
    <Link
      href={modulo.href}
      className="ui-card group block p-5 transition hover:border-blue-200 hover:shadow-[var(--shadow-card)]"
    >
      <div className={`flex size-12 items-center justify-center rounded-lg ${modulo.cor}`}>
        <Icon size={24} />
      </div>

      <h3 className="mt-4 text-lg font-bold text-slate-950">
        {modulo.nome}
      </h3>

      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
        {modulo.descricao}
      </p>

      <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700">
        Acessar
        <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}
