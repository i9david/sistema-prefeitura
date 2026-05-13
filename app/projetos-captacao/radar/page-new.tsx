/**
 * FASE 5: Página do Radar Avançado
 * 
 * Interface para monitoramento inteligente de captação de recursos
 * - Lista de oportunidades com filtros
 * - Destaque para oportunidades prioritárias
 * - Ações de vinculação com projetos
 */

import { redirect } from 'next/navigation'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleCard, ModuleMetricCard } from '@/components/module/module-card'
import { ModuleGrid } from '@/components/module/module-grid'
import { Radar, AlertCircle, TrendingUp, Clock, Target } from 'lucide-react'
import { obterEstatisticasRadar, obterOportunidadesPrioritarias, listarOportunidades } from '@/lib/captacao-radar-actions'
import { ModuloCaptacaoNav } from '@/components/modulo-captacao-nav'
import { RadarClientComponent } from './radar-client'

export const revalidate = 300 // Cache de 5 minutos

export default async function RadarPage({
  searchParams
}: {
  searchParams: Promise<{
    status?: string
    area?: string
    score?: string
    sort?: string
    page?: string
  }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obter estatísticas
  const stats = await obterEstatisticasRadar()

  // Obter oportunidades prioritárias
  const prioritarias = await obterOportunidadesPrioritarias(5)

  // Obter lista completa com filtros
  const filtros = {
    status: params.status,
    area: params.area,
    minScore: params.score ? parseInt(params.score) : undefined,
    limite: 20,
    offset: params.page ? (parseInt(params.page) - 1) * 20 : 0
  }

  const listaResult = await listarOportunidades(filtros)

  return (
    <ModuleLayout sidebar={<ModuloCaptacaoNav currentPath="/projetos-captacao/radar" />}>
      {/* Header */}
      <ModuleHeader
        title="Radar de Oportunidades"
        description="Monitoramento inteligente de editais, convênios e oportunidades de captação de recursos"
        eyebrow="Captação"
        icon={Radar}
        accent="violet"
      />

      {/* Métricas */}
      <ModuleGrid columns={4}>
        <ModuleMetricCard
          label="Total de oportunidades"
          value={stats.total}
          icon={Target}
          accent="violet"
        />
        <ModuleMetricCard
          label="Prazo até 7 dias"
          value={stats.prazoCurto}
          icon={Clock}
          accent="amber"
        />
        <ModuleMetricCard
          label="Score médio"
          value={`${stats.scoreMedio}/100`}
          icon={TrendingUp}
          accent="emerald"
        />
        <ModuleMetricCard
          label="Fontes monitoradas"
          value={stats.ultimasAtualizacoes.length}
          icon={Radar}
          accent="blue"
        />
      </ModuleGrid>

      {/* Oportunidades Prioritárias */}
      {prioritarias.length > 0 && (
        <ModuleCard>
          <div className="mb-4 flex items-center gap-2">
            <AlertCircle className="text-red-600" size={20} />
            <h2 className="text-lg font-bold text-slate-950">Oportunidades Prioritárias</h2>
          </div>

          <div className="space-y-3">
            {prioritarias.map((opp) => (
              <a
                key={opp.id}
                href={`/projetos-captacao/radar/${opp.id}`}
                className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-3 transition hover:bg-red-100"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-950">{opp.titulo}</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    {opp.fonte_nome} • {opp.area} • {opp.dias_para_encerramento} dias
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">{opp.score}/100</div>
                  <div className="text-xs text-slate-600">
                    {opp.valor_estimado ? `R$ ${(opp.valor_estimado / 1000).toFixed(0)}k` : '-'}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </ModuleCard>
      )}

      {/* Filtros e Lista */}
      <RadarClientComponent
        oportunidades={listaResult.oportunidades}
        total={listaResult.total}
        parametrosFiltro={params}
      />

      {/* Últimas Atualizações */}
      {stats.ultimasAtualizacoes.length > 0 && (
        <ModuleCard>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Últimas Atualizações</h3>
          <div className="space-y-2">
            {stats.ultimasAtualizacoes.map((fonte) => (
              <div key={fonte.nome} className="flex items-center justify-between text-sm">
                <span className="text-slate-900">{fonte.nome}</span>
                <span className="text-slate-500">
                  {fonte.total_oportunidades_encontradas || 0} oportunidades
                </span>
              </div>
            ))}
          </div>
        </ModuleCard>
      )}
    </ModuleLayout>
  )
}
