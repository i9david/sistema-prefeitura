import { redirect } from 'next/navigation'
import { ModuloCentroCulturalNav } from '@/components/modulo-centro-cultural-nav'
import { DashboardCard } from '@/components/dashboard-card'
import { PageEmptyState, PageList, PageShell } from '@/components/page-shell'
import { exigirPermissaoPagina } from '@/lib/seguranca-paginas'
import { getAgendaCultural, type ItemAgendaCultural } from '@/lib/agenda-cultural'

function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

function formatarHorario(inicio: string | null, fim: string | null) {
  if (!inicio && !fim) return 'Dia todo'
  if (inicio && fim) return `${inicio.slice(0, 5)} às ${fim.slice(0, 5)}`
  if (inicio) return inicio.slice(0, 5)
  return fim?.slice(0, 5) ?? 'Dia todo'
}

function badgeClassName(item: ItemAgendaCultural) {
  if (item.status.includes('cancel')) return 'bg-red-100 text-red-700'
  if (item.status.includes('realiz')) return 'bg-green-100 text-green-700'
  if (item.tipo === 'aula') return 'bg-blue-100 text-blue-700'
  if (item.modulo === 'Banda Municipal') return 'bg-violet-100 text-violet-700'
  return 'bg-slate-100 text-slate-700'
}

function agruparPorData(itens: ItemAgendaCultural[]) {
  return itens.reduce<Record<string, ItemAgendaCultural[]>>((acc, item) => {
    if (!acc[item.data]) acc[item.data] = []
    acc[item.data].push(item)
    return acc
  }, {})
}

export default async function AgendaCulturalPage({
  searchParams,
}: {
  searchParams: Promise<{
    data?: string
    visualizacao?: string
  }>
}) {
  await exigirPermissaoPagina('Centro Cultural', 'Aulas', 'visualizar')

  const params = await searchParams

  let agenda

  try {
    agenda = await getAgendaCultural({
      data: params.data,
      visualizacao: params.visualizacao,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar agenda'
    redirect(`/centro-cultural?message=${encodeURIComponent(message)}`)
  }

  const agrupado = agruparPorData(agenda.itens)
  const dias = Object.keys(agrupado).sort((a, b) => a.localeCompare(b))
  const dataBase =
    params.data?.trim() ||
    (agenda.periodo.visualizacao === 'dia'
      ? agenda.periodo.dataInicio
      : agenda.periodo.dataInicio)

  return (
    <PageShell
      nav={<ModuloCentroCulturalNav currentPath="/agenda-cultural" />}
      title="Agenda cultural"
      subtitle={`Agenda unificada de ${formatarData(
        agenda.periodo.dataInicio
      )} a ${formatarData(agenda.periodo.dataFim)}.`}
      primaryAction={null}
    >
      <form method="get" className="ui-card p-5">
        <div className="grid gap-4 md:grid-cols-[180px_180px_auto] md:items-end">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-600">
              Data
            </span>
            <input
              type="date"
              name="data"
              defaultValue={dataBase}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-600">
              Visualização
            </span>
            <select
              name="visualizacao"
              defaultValue={agenda.periodo.visualizacao}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="semana">Semana</option>
              <option value="dia">Dia</option>
            </select>
          </label>

          <button type="submit" className="btn-primary">
            Atualizar
          </button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Itens no período" value={agenda.totais.total} />
        <DashboardCard title="Aulas" value={agenda.totais.aulas} />
        <DashboardCard title="Eventos" value={agenda.totais.eventos} />
        <DashboardCard title="Banda Municipal" value={agenda.totais.banda} />
      </div>

      <PageList
        title="Programação"
        subtitle="Aulas recorrentes, eventos avulsos e agendas integradas dos módulos."
        meta={
          <span className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
            {agenda.itens.length} item(ns)
          </span>
        }
      >
        {agenda.itens.length > 0 ? (
          <div className="space-y-4">
            {dias.map((dia) => (
              <div key={dia} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-lg font-bold text-slate-950">{formatarData(dia)}</h3>

                <div className="mt-4 space-y-3">
                  {agrupado[dia].map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-3 rounded-lg bg-white p-4 md:grid-cols-[120px_1fr_auto]"
                    >
                      <div className="text-sm font-semibold text-slate-700">
                        {formatarHorario(item.horarioInicio, item.horarioFim)}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-950">{item.titulo}</h4>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClassName(
                              item
                            )}`}
                          >
                            {item.tipo}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-600">
                          {item.modulo}
                          {item.descricao ? ` • ${item.descricao}` : ''}
                          {item.local ? ` • ${item.local}` : ''}
                        </p>
                      </div>

                      <a href={item.href} className="btn-secondary self-start">
                        Abrir
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <PageEmptyState>
            Nenhum item encontrado para o período selecionado.
          </PageEmptyState>
        )}
      </PageList>

      <PageList title="Proposta de uso">
        <div className="grid gap-4 text-sm text-slate-600 md:grid-cols-3">
          <div>
            <p className="font-semibold text-slate-900">Dia</p>
            <p className="mt-1">Operação diária da recepção, professores e equipes de apoio.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Semana</p>
            <p className="mt-1">Visão consolidada para planejamento de salas, equipe e comunicação.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Integrações</p>
            <p className="mt-1">Aulas, eventos manuais, ensaios e apresentações aparecem juntos.</p>
          </div>
        </div>
      </PageList>
    </PageShell>
  )
}
