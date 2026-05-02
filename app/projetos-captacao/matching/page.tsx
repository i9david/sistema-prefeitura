import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModuloCaptacaoNav } from '@/components/modulo-captacao-nav'
import { gerarMatching } from './actions'

function cor(prioridade: string) {
  if (prioridade === 'alta') return 'bg-green-100 text-green-700'
  if (prioridade === 'media') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-200 text-slate-700'
}

function moeda(valor: number | null) {
  if (!valor) return '-'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

export default async function MatchingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data } = await supabase
    .from('captacao_matching')
    .select(`
      *,
      projetos:captacao_projetos (nome),
      oportunidades:captacao_oportunidades (titulo)
    `)
    .order('score', { ascending: false })

  const lista = data ?? []

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCaptacaoNav currentPath="/projetos-captacao/matching" />

        <section className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow">
            <h1 className="text-3xl font-bold">Matching Inteligente</h1>

            <form action={gerarMatching} className="mt-4">
              <button className="bg-violet-600 text-white px-5 py-3 rounded-xl">
                Atualizar análise
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow space-y-4">
            {lista.map((item: any) => (
              <div key={item.id} className="border rounded-xl p-4">
                <h3 className="font-bold text-lg">
                  {item.projetos?.nome} → {item.oportunidades?.titulo}
                </h3>

                <div className="flex gap-2 mt-2">
                  <span>Score: {item.score}</span>
                  <span className={cor(item.prioridade)}>
                    {item.prioridade}
                  </span>
                </div>

                <div className="text-sm mt-2 space-y-1">
                  <p>Aderência: {item.score_aderencia}</p>
                  <p>Financeiro: {item.score_financeiro}</p>
                  <p>Prazo: {item.score_prazo}</p>
                  <p>Valor estimado: {moeda(item.valor_estimado)}</p>
                </div>

                <p className="mt-2 text-sm">{item.sugestao}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}