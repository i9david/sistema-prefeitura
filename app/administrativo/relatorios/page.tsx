import { redirect } from 'next/navigation'
import {
  BarChart3,
  CalendarCheck,
  ClipboardCheck,
  Music,
  RefreshCw,
  Users,
} from 'lucide-react'
import { ModuleMetricCard } from '@/components/module/module-card'
import { ModuleGrid } from '@/components/module/module-grid'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuleTable } from '@/components/module/module-table'
import { ModuloAdministrativoNav } from '@/components/modulo-administrativo-nav'
import { getRelatoriosInstitucionais } from '@/lib/relatorios-institucionais'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'

type AdministrativoRelatoriosPageProps = {
  searchParams?: Promise<{
    mes?: string
  }>
}

const headerCellClass =
  'border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500'

const bodyCellClass =
  'border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-700'

const numericCellClass =
  'border-b border-slate-100 px-4 py-3 text-right text-sm font-semibold text-slate-900'

function formatarPercentual(valor: number) {
  return `${valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatarMesReferencia(mesReferencia: string) {
  const [ano, mes] = mesReferencia.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(ano, mes - 1, 1))
}

export default async function AdministrativoRelatoriosPage({
  searchParams,
}: AdministrativoRelatoriosPageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const params = await searchParams
  const relatorios = await getRelatoriosInstitucionais({ mes: params?.mes })
  const periodoLabel = formatarMesReferencia(relatorios.periodo.mesReferencia)

  return (
    <ModuleLayout sidebar={<ModuloAdministrativoNav currentPath="/administrativo/relatorios" />}>
      <ModuleHeader
        title="Relatórios institucionais"
        eyebrow="Gestão pública"
        description="Consolidação mensal de atividades, frequência, visitantes e presença da Banda Municipal para prestação de contas e tomada de decisão."
        icon={BarChart3}
        accent="blue"
        context={periodoLabel}
        action={
          <form method="get" className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <label className="sr-only" htmlFor="mes">
              Mês de referência
            </label>
            <input
              id="mes"
              name="mes"
              type="month"
              defaultValue={relatorios.periodo.mesReferencia}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button type="submit" className="btn-primary justify-center">
              <RefreshCw size={16} aria-hidden="true" />
              Atualizar
            </button>
          </form>
        }
      />

      <ModuleGrid columns={4}>
        <ModuleMetricCard
          label="Atividades realizadas"
          value={relatorios.resumo.atividadesRealizadas}
          description="Eventos, ensaios e apresentações com status realizado no mês."
          icon={CalendarCheck}
          accent="blue"
        />
        <ModuleMetricCard
          label="Frequência média"
          value={formatarPercentual(relatorios.resumo.frequenciaMedia)}
          description="Percentual de presenças sobre lançamentos de frequência."
          icon={ClipboardCheck}
          accent="emerald"
        />
        <ModuleMetricCard
          label="Visitantes atendidos"
          value={relatorios.resumo.visitantesAtendidos}
          description="Total de visitas registradas no período selecionado."
          icon={Users}
          accent="amber"
        />
        <ModuleMetricCard
          label="Presença da banda"
          value={formatarPercentual(relatorios.resumo.presencaBanda)}
          description="Presenças da Banda Municipal sobre lançamentos do mês."
          icon={Music}
          accent="violet"
        />
      </ModuleGrid>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Relatório mensal de atividades</h2>
          <p className="mt-1 text-sm text-slate-500">
            Consolida atividades institucionais por módulo, tipo e situação operacional.
          </p>
        </div>
        <ModuleTable
          data={relatorios.atividades}
          getRowKey={(row) => row.chave}
          emptyTitle="Nenhuma atividade no período"
          emptyDescription="Não há atividades institucionais, ensaios ou apresentações registradas neste mês."
          columns={[
            {
              header: 'Módulo',
              render: (row) => row.modulo,
              headerClassName: headerCellClass,
              className: bodyCellClass,
            },
            {
              header: 'Tipo',
              render: (row) => row.tipo,
              headerClassName: headerCellClass,
              className: bodyCellClass,
            },
            {
              header: 'Planejadas',
              render: (row) => row.planejadas,
              headerClassName: `${headerCellClass} text-right`,
              className: numericCellClass,
            },
            {
              header: 'Realizadas',
              render: (row) => row.realizadas,
              headerClassName: `${headerCellClass} text-right`,
              className: numericCellClass,
            },
            {
              header: 'Canceladas',
              render: (row) => row.canceladas,
              headerClassName: `${headerCellClass} text-right`,
              className: numericCellClass,
            },
            {
              header: 'Total',
              render: (row) => row.total,
              headerClassName: `${headerCellClass} text-right`,
              className: numericCellClass,
            },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Relatório de frequência</h2>
          <p className="mt-1 text-sm text-slate-500">
            Apura presença dos alunos por modalidade a partir dos lançamentos de frequência.
          </p>
        </div>
        <ModuleTable
          data={relatorios.frequencia}
          getRowKey={(row) => row.modalidade}
          emptyTitle="Nenhuma frequência no período"
          emptyDescription="Não há registros de frequência de alunos para o mês selecionado."
          columns={[
            {
              header: 'Modalidade',
              render: (row) => row.modalidade,
              headerClassName: headerCellClass,
              className: bodyCellClass,
            },
            {
              header: 'Lançamentos',
              render: (row) => row.lancamentos,
              headerClassName: `${headerCellClass} text-right`,
              className: numericCellClass,
            },
            {
              header: 'Presenças',
              render: (row) => row.presencas,
              headerClassName: `${headerCellClass} text-right`,
              className: numericCellClass,
            },
            {
              header: 'Faltas',
              render: (row) => row.faltas,
              headerClassName: `${headerCellClass} text-right`,
              className: numericCellClass,
            },
            {
              header: 'Frequência média',
              render: (row) => formatarPercentual(row.frequenciaMedia),
              headerClassName: `${headerCellClass} text-right`,
              className: numericCellClass,
            },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Relatório de visitantes</h2>
          <p className="mt-1 text-sm text-slate-500">
            Demonstra volume de atendimento ao público e recorrência por destino.
          </p>
        </div>
        <ModuleTable
          data={relatorios.visitantes}
          getRowKey={(row) => row.destino}
          emptyTitle="Nenhuma visita no período"
          emptyDescription="Não há visitas registradas para o mês selecionado."
          columns={[
            {
              header: 'Destino',
              render: (row) => row.destino,
              headerClassName: headerCellClass,
              className: bodyCellClass,
            },
            {
              header: 'Visitas',
              render: (row) => row.visitas,
              headerClassName: `${headerCellClass} text-right`,
              className: numericCellClass,
            },
            {
              header: 'Visitantes únicos',
              render: (row) => row.visitantesUnicos,
              headerClassName: `${headerCellClass} text-right`,
              className: numericCellClass,
            },
            {
              header: 'Recorrentes',
              render: (row) => row.visitantesRecorrentes,
              headerClassName: `${headerCellClass} text-right`,
              className: numericCellClass,
            },
            {
              header: 'Taxa',
              render: (row) => formatarPercentual(row.taxaRecorrencia),
              headerClassName: `${headerCellClass} text-right`,
              className: numericCellClass,
            },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Relatório da banda</h2>
          <p className="mt-1 text-sm text-slate-500">
            Consolida presença de músicos e base financeira para conferência de pagamentos.
          </p>
        </div>
        <ModuleTable
          data={relatorios.banda}
          getRowKey={(row) => row.tipo}
          emptyTitle="Nenhuma presença da banda no período"
          emptyDescription="Não há presenças da Banda Municipal registradas para o mês selecionado."
          columns={[
            {
              header: 'Tipo',
              render: (row) => row.tipo,
              headerClassName: headerCellClass,
              className: bodyCellClass,
            },
            {
              header: 'Lançamentos',
              render: (row) => row.lancamentos,
              headerClassName: `${headerCellClass} text-right`,
              className: numericCellClass,
            },
            {
              header: 'Presenças',
              render: (row) => row.presencas,
              headerClassName: `${headerCellClass} text-right`,
              className: numericCellClass,
            },
            {
              header: 'Faltas',
              render: (row) => row.faltas,
              headerClassName: `${headerCellClass} text-right`,
              className: numericCellClass,
            },
            {
              header: 'Justificadas',
              render: (row) => row.justificadas,
              headerClassName: `${headerCellClass} text-right`,
              className: numericCellClass,
            },
            {
              header: 'Presença média',
              render: (row) => formatarPercentual(row.presencaMedia),
              headerClassName: `${headerCellClass} text-right`,
              className: numericCellClass,
            },
            {
              header: 'Valor total',
              render: (row) => formatarMoeda(row.valorTotal),
              headerClassName: `${headerCellClass} text-right`,
              className: numericCellClass,
            },
            {
              header: 'Pendentes',
              render: (row) => row.pagamentosPendentes,
              headerClassName: `${headerCellClass} text-right`,
              className: numericCellClass,
            },
            {
              header: 'Pagos',
              render: (row) => row.pagamentosPagos,
              headerClassName: `${headerCellClass} text-right`,
              className: numericCellClass,
            },
          ]}
        />
      </section>
    </ModuleLayout>
  )
}
