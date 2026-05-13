import { redirect } from 'next/navigation'
import {
  BarChart3,
  CalendarRange,
  ClipboardCheck,
  FileBarChart,
  Percent,
  UserRoundPlus,
  Users,
} from 'lucide-react'
import { ModuleCard, ModuleMetricCard } from '@/components/module/module-card'
import { ModuleGrid } from '@/components/module/module-grid'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuleEmptyState } from '@/components/module/module-state'
import { ModuleTable } from '@/components/module/module-table'
import { ModuloCentroCulturalNav } from '@/components/modulo-centro-cultural-nav'
import { getRelatoriosGestaoPublica } from '@/lib/relatorios-gestao-publica'
import { exigirPermissaoPagina } from '@/lib/seguranca-paginas'

function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

function formatarPercentual(valor: number) {
  return `${valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

export default async function CentroCulturalRelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{
    data_inicio?: string
    data_fim?: string
  }>
}) {
  await exigirPermissaoPagina('Centro Cultural', 'Alunos', 'visualizar')

  const params = await searchParams

  let relatorio

  try {
    relatorio = await getRelatoriosGestaoPublica({
      dataInicio: params.data_inicio,
      dataFim: params.data_fim,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar relatórios'
    redirect(`/centro-cultural?message=${encodeURIComponent(message)}`)
  }

  const periodo = `${formatarData(relatorio.periodo.dataInicio)} a ${formatarData(
    relatorio.periodo.dataFim
  )}`

  return (
    <ModuleLayout sidebar={<ModuloCentroCulturalNav currentPath="/centro-cultural/relatorios" />}>
      <ModuleHeader
        title="Relatórios de gestão pública"
        eyebrow="Relatórios"
        description="Consolidados profissionais de frequência, alunos e visitantes para prestação de contas e gestão institucional."
        icon={FileBarChart}
        context={periodo}
        accent="blue"
      />

      <ModuleCard>
        <form method="get" className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-600">
              Início
            </span>
            <input
              type="date"
              name="data_inicio"
              defaultValue={relatorio.periodo.dataInicio}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-600">
              Fim
            </span>
            <input
              type="date"
              name="data_fim"
              defaultValue={relatorio.periodo.dataFim}
            />
          </label>

          <button type="submit" className="btn-primary">
            <CalendarRange size={16} aria-hidden="true" />
            Atualizar
          </button>
        </form>
      </ModuleCard>

      <ModuleGrid columns={4}>
        <ModuleMetricCard
          label="Alunos ativos"
          value={relatorio.indicadores.alunosAtivos}
          icon={Users}
          accent="blue"
        />
        <ModuleMetricCard
          label="Frequência média"
          value={formatarPercentual(relatorio.indicadores.frequenciaMedia)}
          icon={Percent}
          accent="emerald"
        />
        <ModuleMetricCard
          label="Visitantes"
          value={relatorio.indicadores.totalVisitas}
          icon={UserRoundPlus}
          accent="violet"
        />
        <ModuleMetricCard
          label="Recorrência"
          value={formatarPercentual(relatorio.indicadores.taxaRecorrencia)}
          icon={BarChart3}
          accent="amber"
        />
      </ModuleGrid>

      <ModuleGrid columns={4}>
        <ModuleMetricCard
          label="Lançamentos"
          value={relatorio.indicadores.totalFrequencias}
          icon={ClipboardCheck}
          accent="blue"
        />
        <ModuleMetricCard
          label="Presenças"
          value={relatorio.indicadores.presencas}
          icon={ClipboardCheck}
          accent="emerald"
        />
        <ModuleMetricCard
          label="Faltas"
          value={relatorio.indicadores.faltas}
          icon={ClipboardCheck}
          accent="amber"
        />
        <ModuleMetricCard
          label="Visitantes únicos"
          value={relatorio.indicadores.visitantesUnicos}
          icon={UserRoundPlus}
          accent="violet"
        />
      </ModuleGrid>

      <ModuleCard>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-950">
            Alunos e frequência por modalidade
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Baseado em matrículas ativas e lançamentos de frequência do período.
          </p>
        </div>

        {relatorio.modalidades.length > 0 ? (
          <ModuleTable
            data={relatorio.modalidades}
            getRowKey={(linha) => linha.modalidadeId}
            columns={[
              {
                header: 'Modalidade',
                render: (linha) => (
                  <span className="font-medium text-slate-950">{linha.modalidade}</span>
                ),
              },
              { header: 'Alunos ativos', render: (linha) => linha.alunosAtivos },
              { header: 'Lançamentos', render: (linha) => linha.lancamentos },
              { header: 'Presenças', render: (linha) => linha.presencas },
              { header: 'Faltas', render: (linha) => linha.faltas },
              {
                header: 'Freq. média',
                render: (linha) => formatarPercentual(linha.frequenciaMedia),
              },
            ]}
          />
        ) : (
          <ModuleEmptyState title="Nenhuma modalidade encontrada para o período." />
        )}
      </ModuleCard>

      <ModuleCard>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-950">Visitantes por destino</h2>
          <p className="mt-1 text-sm text-slate-500">
            Baseado no CRM cultural quando disponível, com fallback para registros legados.
          </p>
        </div>

        {relatorio.visitantesPorDestino.length > 0 ? (
          <ModuleTable
            data={relatorio.visitantesPorDestino}
            getRowKey={(linha) => linha.destino}
            columns={[
              {
                header: 'Destino',
                render: (linha) => (
                  <span className="font-medium text-slate-950">{linha.destino}</span>
                ),
              },
              { header: 'Visitas', render: (linha) => linha.totalVisitas },
              { header: 'Visitantes únicos', render: (linha) => linha.visitantesUnicos },
              { header: 'Recorrentes', render: (linha) => linha.visitantesRecorrentes },
              { header: 'Taxa', render: (linha) => formatarPercentual(linha.taxaRecorrencia) },
            ]}
          />
        ) : (
          <ModuleEmptyState title="Nenhum visitante encontrado para o período." />
        )}
      </ModuleCard>

      <ModuleCard>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-950">Série diária</h2>
          <p className="mt-1 text-sm text-slate-500">
            Leitura diária para prestação de contas e acompanhamento operacional.
          </p>
        </div>

        {relatorio.serieDiaria.length > 0 ? (
          <ModuleTable
            data={relatorio.serieDiaria}
            getRowKey={(linha) => linha.data}
            columns={[
              {
                header: 'Data',
                render: (linha) => (
                  <span className="font-medium text-slate-950">
                    {formatarData(linha.data)}
                  </span>
                ),
              },
              { header: 'Frequências', render: (linha) => linha.frequenciasLancadas },
              { header: 'Presenças', render: (linha) => linha.presencas },
              { header: 'Visitantes', render: (linha) => linha.visitantes },
            ]}
          />
        ) : (
          <ModuleEmptyState title="Nenhuma movimentação encontrada para o período." />
        )}
      </ModuleCard>
    </ModuleLayout>
  )
}
