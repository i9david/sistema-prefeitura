import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function ModuloCard({ modulo }: any) {
  const Icon = modulo.icon

  return (
    <Link href={modulo.href} className="card p-6 hover:scale-[1.02] transition">

      <div className={`w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-r ${modulo.cor} text-white`}>
        <Icon size={26} />
      </div>

      <h3 className="mt-4 text-xl font-bold">
        {modulo.nome}
      </h3>

      <p className="text-sm text-slate-600 mt-2">
        {modulo.descricao}
      </p>

      <div className="flex items-center gap-2 mt-4 text-violet-600 font-semibold">
        Acessar
        <ArrowRight size={16} />
      </div>

    </Link>
  )
}