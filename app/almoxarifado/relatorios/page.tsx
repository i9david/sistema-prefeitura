import { redirect } from 'next/navigation'
import { BarChart3, Boxes, PackageSearch, TrendingUp } from 'lucide-react'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuloAlmoxarifadoNav } from '@/components/modulo-almoxarifado-nav'
import { ModuleCard, ModuleMetricCard } from '@/components/module/module-card'
import { ModuleGrid } from '@/components/module/module-grid'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuleTable } from '@/components/module/module-table'
import { getRelatoriosAlmoxarifado } from '../actions'

function formatarQuantidade(valor: number | string | null | undefined, unidade?: string | null) {
  return `${Number(valor ?? 0).toLocaleString('pt-BR', {
    maximumFractionDigits: 3,
  })}${unidade ? ` ${unidade}` : ''}`
}

function formatarData(valor: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(`${valor}T00:00:00`))
}

function hojeBrasil() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function inicioMesAtual() {
  return `${hojeBrasil().slice(0, 8)}01`
}

export default async function AlmoxarifadoRelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{
    data_inicio?: string
    data_fim?: string
  }>
}) {
  const params = await searchParams
  const dataInicio = params.data_inicio?.trim() || inicioMesAtual()
  const dataFim = params.data_fim?.trim() || hojeBrasil()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const relatorios = await getRelatoriosAlmoxarifado({
    dataInicio,
    dataFim,
  })

  const consumoTotal = relatorios.consumoPorPeriodo.reduce(
    (total, item) => total + item.quantidade,
    0
  )
  const destinosAtendidos = relatorios.consumoPorDestino.filter(
    (item) => item.destino !== 'Sem destino'
  ).length

  return (
    <ModuleLayout sidebar={<ModuloAlmoxarifadoNav currentPath="/almoxarifado/relatorios" />}>
      <ModuleHeader
        title="Relatórios do almoxarifado"
        eyebrow="Relatórios"
        description="Acompanhe consumo por período, produtos mais utilizados e itens abaixo do estoque mínimo."
        icon={BarChart3}
        accent="emerald"
      />

      <ModuleCard>
        <form method="get" className="grid gap-3 md:grid-cols-[180px_180px_160px]">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Data inicial
            <input
              type="date"
              name="data_inicio"
              defaultValue={relatorios.periodo.dataInicio}
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-normal"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Data final
            <input
              type="date"
              name="data_fim"
              defaultValue={relatorios.periodo.dataFim}
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-normal"
            />
          </label>
          <div className="flex items-end">
            <button type="submit" className="btn-secondary w-full justify-center">
              Filtrar
            </button>
          </div>
        </form>
      </ModuleCard>

      <ModuleGrid columns={3}>
        <ModuleMetricCard
          label="Consumo no período"
          value={formatarQuantidade(consumoTotal)}
          description={`${formatarData(relatorios.periodo.dataInicio)} até ${formatarData(relatorios.periodo.dataFim)}`}
          icon={TrendingUp}
          accent="emerald"
        />
        <ModuleMetricCard
          label="Produtos utilizados"
          value={relatorios.produtosMaisUtilizados.length}
          description="Produtos com saída registrada no período."
          icon={PackageSearch}
          accent="blue"
        />
        <ModuleMetricCard
          label="Itens abaixo do mínimo"
          value={relatorios.itensAbaixoMinimo.length}
          description={`${destinosAtendidos} destino(s) com consumo classificado.`}
          icon={Boxes}
          accent="amber"
        />
      </ModuleGrid>

      <ModuleGrid columns={2}>
        <ModuleCard>
          <h2 className="text-lg font-bold text-slate-950">Produtos mais utilizados</h2>
          <div className="mt-4">
            <ModuleTable
              data={relatorios.produtosMaisUtilizados}
              getRowKey={(item) => item.produtoId}
              emptyTitle="Nenhum consumo registrado"
              emptyDescription="Não há saídas no período selecionado."
              columns={[
                {
                  header: 'Produto',
                  headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                  className: 'px-4 py-3 text-sm font-semibold text-slate-900',
                  render: (item) => item.produto,
                },
                {
                  header: 'Quantidade',
                  headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                  className: 'px-4 py-3 text-sm font-bold text-slate-900',
                  render: (item) => formatarQuantidade(item.quantidade, item.unidade),
                },
              ]}
            />
          </div>
        </ModuleCard>

        <ModuleCard>
          <h2 className="text-lg font-bold text-slate-950">Consumo por destino</h2>
          <div className="mt-4">
            <ModuleTable
              data={relatorios.consumoPorDestino}
              getRowKey={(item) => item.destino}
              emptyTitle="Nenhum destino registrado"
              emptyDescription="As movimentações ainda não possuem destino no período."
              columns={[
                {
                  header: 'Destino',
                  headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                  className: 'px-4 py-3 text-sm font-semibold text-slate-900',
                  render: (item) => item.destino,
                },
                {
                  header: 'Quantidade',
                  headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                  className: 'px-4 py-3 text-sm font-bold text-slate-900',
                  render: (item) => formatarQuantidade(item.quantidade),
                },
              ]}
            />
          </div>
        </ModuleCard>

        <ModuleCard>
          <h2 className="text-lg font-bold text-slate-950">Consumo por centro de custo</h2>
          <div className="mt-4">
            <ModuleTable
              data={relatorios.consumoPorCentroCusto}
              getRowKey={(item) => item.centroCusto}
              emptyTitle="Nenhum centro de custo"
              emptyDescription="Preencha o centro de custo nas movimentações para habilitar esta visão."
              columns={[
                {
                  header: 'Centro de custo',
                  headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                  className: 'px-4 py-3 text-sm font-semibold text-slate-900',
                  render: (item) => item.centroCusto,
                },
                {
                  header: 'Quantidade',
                  headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                  className: 'px-4 py-3 text-sm font-bold text-slate-900',
                  render: (item) => formatarQuantidade(item.quantidade),
                },
              ]}
            />
          </div>
        </ModuleCard>

        <ModuleCard>
          <h2 className="text-lg font-bold text-slate-950">Itens abaixo do mínimo</h2>
          <div className="mt-4">
            <ModuleTable
              data={relatorios.itensAbaixoMinimo}
              getRowKey={(item) => item.id}
              emptyTitle="Nenhum item crítico"
              emptyDescription="Todos os produtos ativos estão acima do estoque mínimo."
              columns={[
                {
                  header: 'Produto',
                  headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                  className: 'px-4 py-3 text-sm font-semibold text-slate-900',
                  render: (item) => item.nome,
                },
                {
                  header: 'Saldo',
                  headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                  className: 'px-4 py-3 text-sm font-bold text-red-700',
                  render: (item) => formatarQuantidade(item.quantidade_atual, item.unidade),
                },
                {
                  header: 'Mínimo',
                  headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                  className: 'px-4 py-3 text-sm text-slate-600',
                  render: (item) => formatarQuantidade(item.quantidade_minima, item.unidade),
                },
              ]}
            />
          </div>
        </ModuleCard>
      </ModuleGrid>

      <ModuleCard>
        <h2 className="text-lg font-bold text-slate-950">Consumo diário</h2>
        <div className="mt-4">
          <ModuleTable
            data={relatorios.consumoPorPeriodo}
            getRowKey={(item) => item.data}
            emptyTitle="Nenhum consumo diário"
            emptyDescription="Não há saídas no período selecionado."
            columns={[
              {
                header: 'Data',
                headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                className: 'px-4 py-3 text-sm font-semibold text-slate-900',
                render: (item) => formatarData(item.data),
              },
              {
                header: 'Quantidade consumida',
                headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                className: 'px-4 py-3 text-sm font-bold text-slate-900',
                render: (item) => formatarQuantidade(item.quantidade),
              },
            ]}
          />
        </div>
      </ModuleCard>
    </ModuleLayout>
  )
}
