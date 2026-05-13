/**
 * FASE 5B: Página de Detalhe de Oportunidade
 * 
 * Mostra informações completas de uma oportunidade:
 * - Score detalhado (breakdown de critérios)
 * - Vinculações com projetos
 * - Histórico de scores
 * - Ações (vincular, descartar, arquivar)
 */

import { redirect } from 'next/navigation'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleCard } from '@/components/module/module-card'
import { ModuleGrid } from '@/components/module/module-grid'
import { ArrowLeft, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { obterOportunidadeDetalhes } from '@/lib/captacao-radar-actions'
import { ModuloCaptacaoNav } from '@/components/modulo-captacao-nav'
import { DetalheClientComponent } from './detalhe-client'

export const revalidate = 300

export default async function OportunidadeDetalhePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obter dados da oportunidade
  const { oportunidade, vinculacoes, historico } = await obterOportunidadeDetalhes(id)

  if (!oportunidade) {
    redirect('/projetos-captacao/radar')
  }

  return (
    <ModuleLayout sidebar={<ModuloCaptacaoNav currentPath="/projetos-captacao/radar" />}>
      {/* Botão voltar */}
      <Link
        href="/projetos-captacao/radar"
        className="mb-4 flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700"
      >
        <ArrowLeft size={16} />
        Voltar para Radar
      </Link>

      {/* Header */}
      <ModuleHeader
        title={oportunidade.titulo}
        description={oportunidade.descricao}
        eyebrow={oportunidade.tipo.toUpperCase()}
        accent={oportunidade.elegivel_prefeitura ? 'emerald' : 'amber'}
      />

      {/* Informações Principais */}
      <ModuleCard>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {/* Score */}
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="text-sm text-slate-600">Score</div>
            <div className="mt-1 text-3xl font-bold text-violet-700">
              {oportunidade.score}/100
            </div>
            {oportunidade.score >= 70 && (
              <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <CheckCircle size={14} />
                Prioritária
              </div>
            )}
          </div>

          {/* Área */}
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="text-sm text-slate-600">Área</div>
            <div className="mt-1 text-lg font-semibold text-slate-950">
              {oportunidade.area}
            </div>
          </div>

          {/* Valor */}
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="text-sm text-slate-600">Valor Estimado</div>
            <div className="mt-1 text-lg font-semibold text-slate-950">
              {oportunidade.valor_estimado
                ? `R$ ${(oportunidade.valor_estimado / 1000).toFixed(0)}k`
                : '-'}
            </div>
          </div>

          {/* Data */}
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="text-sm text-slate-600">Encerramento</div>
            <div className="mt-1 text-lg font-semibold text-slate-950">
              {new Date(oportunidade.data_encerramento).toLocaleDateString('pt-BR')}
            </div>
            {oportunidade.dias_para_encerramento < 7 && (
              <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-red-700">
                <AlertCircle size={14} />
                Prazo curto
              </div>
            )}
          </div>
        </div>
      </ModuleCard>

      {/* Detalhamento do Score */}
      {oportunidade.score_detalhe && (
        <ModuleCard>
          <h3 className="mb-4 text-lg font-bold text-slate-950">Breakdown do Score</h3>

          <div className="space-y-3">
            {/* Score por critério */}
            {Object.entries(oportunidade.score_detalhe).map(([criterio, pontos]: [string, any]) => (
              <div key={criterio}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    {criterio.charAt(0).toUpperCase() + criterio.slice(1)}
                  </span>
                  <span className="text-sm font-bold text-slate-950">{pontos}/20</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-violet-600"
                    style={{ width: `${(pontos / 20) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-slate-100 px-3 py-2">
            <div className="text-xs text-slate-600">Última atualização</div>
            <div className="text-sm font-semibold text-slate-950">
              {new Date(oportunidade.score_calculado_em).toLocaleDateString('pt-BR', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </ModuleCard>
      )}

      {/* Informações Completas */}
      <ModuleGrid columns={2}>
        {/* Elegibilidade */}
        <ModuleCard>
          <h3 className="mb-3 font-semibold text-slate-950">Elegibilidade</h3>
          <div
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              oportunidade.elegivel_prefeitura
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {oportunidade.elegivel_prefeitura
              ? '✅ Elegível para prefeitura'
              : '⚠️ Requer análise de elegibilidade'}
          </div>
          <p className="mt-2 text-xs text-slate-600">{oportunidade.motivo_inelegibilidade || ''}</p>
        </ModuleCard>

        {/* URL/Fonte */}
        <ModuleCard>
          <h3 className="mb-3 font-semibold text-slate-950">Fonte</h3>
          <div className="space-y-2">
            <div className="text-sm text-slate-600">Origem: {oportunidade.fonte}</div>
            {oportunidade.url && (
              <a
                href={oportunidade.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700"
              >
                Acessar no site original
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </ModuleCard>

        {/* Status */}
        <ModuleCard>
          <h3 className="mb-3 font-semibold text-slate-950">Status</h3>
          <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-950">
            {oportunidade.status.toUpperCase()}
          </div>
        </ModuleCard>

        {/* Data de Descoberta */}
        <ModuleCard>
          <h3 className="mb-3 font-semibold text-slate-950">Descoberta em</h3>
          <div className="text-sm text-slate-600">
            {new Date(oportunidade.created_at).toLocaleDateString('pt-BR', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
        </ModuleCard>
      </ModuleGrid>

      {/* Descrição Completa */}
      {oportunidade.descricao && (
        <ModuleCard>
          <h3 className="mb-3 font-semibold text-slate-950">Descrição Completa</h3>
          <p className="whitespace-pre-line text-sm text-slate-700">
            {oportunidade.descricao}
          </p>
        </ModuleCard>
      )}

      {/* Vinculações com Projetos */}
      {vinculacoes.length > 0 && (
        <ModuleCard>
          <h3 className="mb-4 font-semibold text-slate-950">Projetos Vinculados</h3>

          <div className="space-y-2">
            {vinculacoes.map((vinc) => (
              <div
                key={vinc.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3"
              >
                <div>
                  <div className="font-medium text-slate-950">{vinc.projeto_nome}</div>
                  <div className="text-xs text-slate-600">Status: {vinc.status}</div>
                </div>
                <Link
                  href={`/projetos-captacao/${vinc.projeto_id}`}
                  className="text-xs font-medium text-blue-600 transition hover:text-blue-700"
                >
                  Ver Projeto →
                </Link>
              </div>
            ))}
          </div>
        </ModuleCard>
      )}

      {/* Histórico de Scores */}
      {historico.length > 0 && (
        <ModuleCard>
          <h3 className="mb-4 font-semibold text-slate-950">Histórico de Scores</h3>

          <div className="space-y-3">
            {historico.map((hist) => (
              <div key={hist.id} className="border-l-4 border-slate-200 pl-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-950">
                    {hist.score_anterior} → {hist.score_novo}
                  </span>
                  <span className="text-xs text-slate-600">
                    {new Date(hist.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  {hist.motivo_mudanca || 'Recalculado automaticamente'}
                </div>
              </div>
            ))}
          </div>
        </ModuleCard>
      )}

      {/* Ações */}
      <DetalheClientComponent oportunidadeId={id} status={oportunidade.status} />
    </ModuleLayout>
  )
}
