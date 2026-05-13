import { redirect } from 'next/navigation'
import { BarChart3, ClipboardCheck, FileSearch, FolderKanban } from 'lucide-react'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuloCaptacaoNav } from '@/components/modulo-captacao-nav'
import { ModuleCard, ModuleMetricCard } from '@/components/module/module-card'
import { ModuleGrid } from '@/components/module/module-grid'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'

type Projeto = {
  id: string
  status: string | null
  prioridade: string | null
  area: string | null
}

type Oportunidade = {
  id: string
  status: string | null
  prazo_inscricao: string | null
  valor_disponivel: number | null
}

type Analise = {
  id: string
  status: string | null
  viabilidade: string | null
}

type Matching = {
  id: string
  score: number | null
  prioridade: string | null
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

function calcularMedia(valores: number[]) {
  if (valores.length === 0) return 0
  return valores.reduce((total, valor) => total + valor, 0) / valores.length
}

export default async function RelatoriosCaptacaoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: projetosData, error: projetosError },
    { data: oportunidadesData, error: oportunidadesError },
    { data: analisesData, error: analisesError },
    { data: matchingData, error: matchingError },
  ] = await Promise.all([
    supabase.from('captacao_projetos').select('id, status, prioridade, area'),
    supabase.from('captacao_oportunidades').select('id, status, prazo_inscricao, valor_disponivel'),
    supabase.from('captacao_analises').select('id, status, viabilidade'),
    supabase.from('captacao_matching').select('id, score, prioridade'),
  ])

  const erro = projetosError || oportunidadesError || analisesError || matchingError

  if (erro) {
    redirect(`/projetos-captacao?message=${encodeURIComponent(erro.message)}`)
  }

  const projetos = (projetosData ?? []) as Projeto[]
  const oportunidades = (oportunidadesData ?? []) as Oportunidade[]
  const analises = (analisesData ?? []) as Analise[]
  const matchings = (matchingData ?? []) as Matching[]

  const projetosAtivos = projetos.filter((projeto) => projeto.status !== 'arquivado').length
  const projetosAltaPrioridade = projetos.filter((projeto) => projeto.prioridade === 'alta').length
  const oportunidadesAbertas = oportunidades.filter((oportunidade) => oportunidade.status === 'aberta').length
  const valorMapeado = oportunidades.reduce(
    (total, oportunidade) => total + Number(oportunidade.valor_disponivel || 0),
    0
  )
  const analisesViaveis = analises.filter((analise) => analise.viabilidade === 'viavel').length
  const scoreMedio = calcularMedia(
    matchings
      .map((matching) => Number(matching.score || 0))
      .filter((score) => score > 0)
  )

  return (
    <ModuleLayout sidebar={<ModuloCaptacaoNav currentPath="/projetos-captacao/relatorios" />}>
      <ModuleHeader
        title="Relatórios Estratégicos"
        eyebrow="Relatórios"
        description="Visão consolidada da carteira de projetos, oportunidades, análises técnicas e compatibilidade."
        icon={BarChart3}
        accent="violet"
        context="Gestão estratégica"
      />

          <ModuleGrid columns={4}>
            <ModuleMetricCard label="Projetos ativos" value={projetosAtivos} icon={FolderKanban} accent="violet" />
            <ModuleMetricCard label="Oportunidades abertas" value={oportunidadesAbertas} icon={FileSearch} accent="violet" />
            <ModuleMetricCard label="Análises viáveis" value={analisesViaveis} icon={ClipboardCheck} accent="violet" />
            <ModuleMetricCard label="Score médio" value={scoreMedio.toFixed(1)} icon={BarChart3} accent="violet" />
          </ModuleGrid>

          <div className="grid gap-4 lg:grid-cols-2">
            <ModuleCard>
              <h2 className="text-xl font-bold text-slate-900">Carteira de projetos</h2>
              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <p>Projetos cadastrados: {projetos.length}</p>
                <p>Alta prioridade: {projetosAltaPrioridade}</p>
                <p>Áreas acompanhadas: {new Set(projetos.map((projeto) => projeto.area).filter(Boolean)).size}</p>
              </div>
            </ModuleCard>

            <ModuleCard>
              <h2 className="text-xl font-bold text-slate-900">Captação mapeada</h2>
              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <p>Oportunidades cadastradas: {oportunidades.length}</p>
                <p>Valor disponível mapeado: {formatarMoeda(valorMapeado)}</p>
                <p>Combinações de matching: {matchings.length}</p>
              </div>
            </ModuleCard>
          </div>
    </ModuleLayout>
  )
}
