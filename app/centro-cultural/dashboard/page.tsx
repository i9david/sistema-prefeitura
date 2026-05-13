import { redirect } from 'next/navigation'
import {
  BarChart3,
  CalendarRange,
  ClipboardCheck,
  GraduationCap,
  Percent,
  TrendingDown,
} from 'lucide-react'
import { ModuleCard, ModuleMetricCard } from '@/components/module/module-card'
import { ModuleGrid } from '@/components/module/module-grid'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuleEmptyState } from '@/components/module/module-state'
import { ModuleTable } from '@/components/module/module-table'

export const revalidate = 300 // Revalidar cache a cada 5 minutos
import { ModuloCentroCulturalNav } from '@/components/modulo-centro-cultural-nav'
import { getIndicadoresGestaoCultural } from '@/lib/indicadores-culturais'
import { exigirPermissaoPagina } from '@/lib/seguranca-paginas'

function formatarPercentual(valor: number) {
  return `${valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

export default async function CentroCulturalDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    data_inicio?: string
    data_fim?: string
  }>
}) {
  await exigirPermissaoPagina('Centro Cultural', 'Alunos', 'visualizar')

  const params = await searchParams

  let indicadores

  try {
    indicadores = await getIndicadoresGestaoCultural({
      dataInicio: params.data_inicio,
      dataFim: params.data_fim,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar indicadores'
    redirect(`/centro-cultural?message=${encodeURIComponent(message)}`)
  }

  const periodo = `${formatarData(indicadores.periodo.dataInicio)} a ${formatarData(
    indicadores.periodo.dataFim
  )}`

  return (
    <ModuleLayout sidebar={<ModuloCentroCulturalNav currentPath="/centro-cultural/dashboard" />}>
      <ModuleHeader
        title="Dashboard de gestão cultural"
        eyebrow="Gestão"
        description="Indicadores consolidados de alunos, matrículas, frequência e modalidades para acompanhamento institucional."
        icon={BarChart3}
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
              defaultValue={indicadores.periodo.dataInicio}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-600">
              Fim
            </span>
            <input
              type="date"
              name="data_fim"
              defaultValue={indicadores.periodo.dataFim}
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
          value={indicadores.totalAlunosAtivos}
          description="Matrículas vigentes no período."
          icon={GraduationCap}
          accent="blue"
        />
        <ModuleMetricCard
          label="Taxa de evasão"
          value={formatarPercentual(indicadores.taxaEvasao)}
          description="Encerramentos sobre matrículas analisadas."
          icon={TrendingDown}
          accent="amber"
        />
        <ModuleMetricCard
          label="Frequência média"
          value={formatarPercentual(indicadores.frequenciaMedia)}
          description="Presenças sobre lançamentos."
          icon={Percent}
          accent="emerald"
        />
        <ModuleMetricCard
          label="Lançamentos"
          value={indicadores.totalLancamentosFrequencia}
          description="Registros de frequência no período."
          icon={ClipboardCheck}
          accent="violet"
        />
      </ModuleGrid>

      <ModuleCard>
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Ranking de modalidades</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ordenado pela quantidade de alunos ativos com matrícula vigente.
            </p>
          </div>
          <span className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
            {indicadores.rankingModalidades.length} modalidade(s)
          </span>
        </div>

        {indicadores.rankingModalidades.length > 0 ? (
          <ModuleTable
            data={indicadores.rankingModalidades}
            getRowKey={(item) => item.modalidadeId}
            columns={[
              {
                header: 'Modalidade',
                render: (item) => (
                  <span className="font-medium text-slate-950">{item.modalidade}</span>
                ),
              },
              {
                header: 'Alunos ativos',
                render: (item) => item.alunosAtivos,
              },
              {
                header: 'Frequência média',
                render: (item) => formatarPercentual(item.frequenciaMedia),
              },
            ]}
          />
        ) : (
          <ModuleEmptyState title="Nenhuma modalidade com matrícula ativa encontrada no período." />
        )}
      </ModuleCard>

      <ModuleCard>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-950">Leitura dos indicadores</h2>
          <p className="mt-1 text-sm text-slate-500">
            Síntese para tomada de decisão e acompanhamento operacional.
          </p>
        </div>

        <div className="grid gap-4 text-sm text-slate-600 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-950">Evasão</p>
            <p className="mt-1">
              {indicadores.totalEvasoes} encerramento(s) em{' '}
              {indicadores.totalMatriculasPeriodo} matrícula(s) analisada(s).
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-950">Frequência</p>
            <p className="mt-1">
              {indicadores.totalPresencas} presença(s) em{' '}
              {indicadores.totalLancamentosFrequencia} lançamento(s).
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-950">Fonte</p>
            <p className="mt-1">
              Matrículas históricas, aulas, modalidades e registros de frequência.
            </p>
          </div>
        </div>
      </ModuleCard>
    </ModuleLayout>
  )
}
