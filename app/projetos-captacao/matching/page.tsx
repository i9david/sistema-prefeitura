import { redirect } from 'next/navigation'
import { GitCompareArrows, RefreshCw, Target, TrendingUp } from 'lucide-react'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuloCaptacaoNav } from '@/components/modulo-captacao-nav'
import { ModuleCard, ModuleMetricCard } from '@/components/module/module-card'
import { ModuleGrid } from '@/components/module/module-grid'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { gerarMatching } from './actions'

type MatchingItem = {
  id: string
  projeto_id: string | null
  oportunidade_id: string | null
  score: number | null
  prioridade: string | null
  score_aderencia: number | null
  score_financeiro: number | null
  score_prazo: number | null
  valor_estimado: number | null
  sugestao: string | null
}

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

function getNomePorId(mapa: Map<string, string>, id: string | null, fallback: string) {
  if (!id) return fallback
  return mapa.get(id) ?? fallback
}

export default async function MatchingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: matchingData, error: matchingError },
    { data: projetosData, error: projetosError },
    { data: oportunidadesData, error: oportunidadesError },
  ] = await Promise.all([
    supabase
      .from('captacao_matching')
      .select('*')
      .order('score', { ascending: false }),
    supabase
      .from('captacao_projetos')
      .select('id, nome'),
    supabase
      .from('captacao_oportunidades')
      .select('id, titulo'),
  ])

  const erro = matchingError || projetosError || oportunidadesError

  if (erro) {
    redirect(`/projetos-captacao/matching?message=${encodeURIComponent(erro.message)}`)
  }

  const lista = (matchingData ?? []) as MatchingItem[]
  const projetosPorId = new Map(
    (projetosData ?? []).map((projeto) => [projeto.id, projeto.nome])
  )
  const oportunidadesPorId = new Map(
    (oportunidadesData ?? []).map((oportunidade) => [oportunidade.id, oportunidade.titulo])
  )

  const matchingsAltaPrioridade = lista.filter((item) => item.prioridade === 'alta').length
  const scoreMedio =
    lista.length > 0
      ? lista.reduce((total, item) => total + Number(item.score || 0), 0) / lista.length
      : 0

  return (
    <ModuleLayout sidebar={<ModuloCaptacaoNav currentPath="/projetos-captacao/matching" />}>
      <ModuleHeader
        title="Matching Inteligente"
        eyebrow="Operação"
        description="Relacione projetos cadastrados com oportunidades compatíveis e priorize combinações com maior aderência."
        icon={GitCompareArrows}
        accent="violet"
        context="Compatibilidade"
        action={
          <form action={gerarMatching}>
            <button className="btn-primary w-full justify-center md:w-auto">
              <RefreshCw size={16} aria-hidden="true" />
              Atualizar análise
            </button>
          </form>
        }
      />

          <ModuleGrid columns={3}>
            <ModuleMetricCard label="Combinações" value={lista.length} icon={GitCompareArrows} accent="violet" />
            <ModuleMetricCard label="Alta prioridade" value={matchingsAltaPrioridade} icon={Target} accent="violet" />
            <ModuleMetricCard label="Score médio" value={scoreMedio.toFixed(1)} icon={TrendingUp} accent="violet" />
          </ModuleGrid>

          <ModuleCard className="space-y-4">
            {lista.map((item) => (
              <div key={item.id} className="border rounded-xl p-4">
                <h3 className="font-bold text-lg">
                  {getNomePorId(projetosPorId, item.projeto_id, 'Projeto não encontrado')} →{' '}
                  {getNomePorId(
                    oportunidadesPorId,
                    item.oportunidade_id,
                    'Oportunidade não encontrada'
                  )}
                </h3>

                <div className="flex gap-2 mt-2">
                  <span>Score: {item.score}</span>
                  <span className={cor(item.prioridade ?? '')}>
                    {item.prioridade || '-'}
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
          </ModuleCard>
    </ModuleLayout>
  )
}
