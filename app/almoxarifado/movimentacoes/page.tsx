import { redirect } from 'next/navigation'
import { ClipboardList, Plus } from 'lucide-react'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuloAlmoxarifadoNav } from '@/components/modulo-almoxarifado-nav'
import { ModuleCard, ModuleMetricCard } from '@/components/module/module-card'
import { ModuleGrid } from '@/components/module/module-grid'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuleTable } from '@/components/module/module-table'
import { listarMovimentacoes, listarProdutos, registrarMovimentacao } from '../actions'

function normalizarRelacao<T>(relacao: T | T[] | null | undefined) {
  if (!relacao) return null
  return Array.isArray(relacao) ? relacao[0] ?? null : relacao
}

function formatarQuantidade(valor: number | string | null | undefined, unidade?: string | null) {
  return `${Number(valor ?? 0).toLocaleString('pt-BR', {
    maximumFractionDigits: 3,
  })}${unidade ? ` ${unidade}` : ''}`
}

function formatarDataHora(valor: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(valor))
}

function tipoClassName(tipo: string) {
  if (tipo === 'entrada') return 'bg-emerald-100 text-emerald-700'
  if (tipo === 'saida') return 'bg-red-100 text-red-700'
  return 'bg-blue-100 text-blue-700'
}

function formatarDestino(destino: string | null | undefined) {
  if (!destino) return '-'
  const labels: Record<string, string> = {
    setor: 'Setor',
    evento: 'Evento',
    aula: 'Aula',
    banda: 'Banda',
    turismo: 'Turismo',
  }
  return labels[destino] || destino
}

export default async function AlmoxarifadoMovimentacoesPage({
  searchParams,
}: {
  searchParams: Promise<{
    produto_id?: string
    destino?: string
    message?: string
  }>
}) {
  const params = await searchParams
  const produtoId = params.produto_id?.trim() || ''
  const destino = params.destino?.trim() || ''
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [produtos, movimentacoes] = await Promise.all([
    listarProdutos({ ativos: true }),
    listarMovimentacoes({
      produtoId: produtoId || undefined,
      destino: destino || undefined,
    }),
  ])

  const entradas = movimentacoes.filter((item) => item.tipo === 'entrada').length
  const saidas = movimentacoes.filter((item) => item.tipo === 'saida').length

  return (
    <ModuleLayout sidebar={<ModuloAlmoxarifadoNav currentPath="/almoxarifado/movimentacoes" />}>
      <ModuleHeader
        title="Movimentações"
        eyebrow="Operação"
        description="Registre entradas, saídas e ajustes com destino, centro de custo e histórico do usuário."
        icon={ClipboardList}
        accent="emerald"
      />

      <ModuleCard>
        <h2 className="text-lg font-bold text-slate-950">Nova movimentação</h2>
        <form action={registrarMovimentacao} className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <select
            name="produto_id"
            required
            defaultValue={produtoId}
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm xl:col-span-2"
          >
            <option value="">Selecione o produto</option>
            {produtos.map((produto) => (
              <option key={produto.id} value={produto.id}>
                {produto.nome} - saldo {formatarQuantidade(produto.quantidade_atual, produto.unidade)}
              </option>
            ))}
          </select>
          <select
            name="tipo"
            required
            defaultValue="entrada"
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm"
          >
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
            <option value="ajuste">Ajuste</option>
          </select>
          <input
            name="quantidade"
            type="number"
            step="0.001"
            required
            placeholder="Quantidade"
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm"
          />
          <select
            name="destino"
            defaultValue=""
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm"
          >
            <option value="">Destino</option>
            <option value="setor">Setor</option>
            <option value="evento">Evento</option>
            <option value="aula">Aula</option>
            <option value="banda">Banda</option>
            <option value="turismo">Turismo</option>
          </select>
          <button type="submit" className="btn-primary justify-center">
            <Plus size={16} aria-hidden="true" />
            Registrar
          </button>
          <input
            name="centro_custo"
            placeholder="Centro de custo"
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm xl:col-span-2"
          />
          <input
            name="responsavel_solicitacao"
            placeholder="Responsável pela solicitação"
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm xl:col-span-2"
          />
          <textarea
            name="observacao"
            placeholder="Observação"
            rows={2}
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm md:col-span-2 xl:col-span-2"
          />
        </form>

        {params.message && (
          <p className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
            {params.message}
          </p>
        )}
      </ModuleCard>

      <ModuleGrid columns={3}>
        <ModuleMetricCard label="Movimentações" value={movimentacoes.length} icon={ClipboardList} accent="emerald" />
        <ModuleMetricCard label="Entradas" value={entradas} icon={ClipboardList} accent="emerald" />
        <ModuleMetricCard label="Saídas" value={saidas} icon={ClipboardList} accent="amber" />
      </ModuleGrid>

      <ModuleCard>
        <form method="get" className="grid gap-3 md:grid-cols-[1fr_220px_160px]">
          <select
            name="produto_id"
            defaultValue={produtoId}
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm"
          >
            <option value="">Todos os produtos</option>
            {produtos.map((produto) => (
              <option key={produto.id} value={produto.id}>
                {produto.nome}
              </option>
            ))}
          </select>
          <select
            name="destino"
            defaultValue={destino}
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm"
          >
            <option value="">Todos os destinos</option>
            <option value="setor">Setor</option>
            <option value="evento">Evento</option>
            <option value="aula">Aula</option>
            <option value="banda">Banda</option>
            <option value="turismo">Turismo</option>
          </select>
          <button type="submit" className="btn-secondary justify-center">
            Filtrar
          </button>
        </form>
      </ModuleCard>

      <ModuleCard>
        <h2 className="text-lg font-bold text-slate-950">Histórico</h2>
        <div className="mt-4">
          <ModuleTable
            data={movimentacoes}
            getRowKey={(movimentacao) => movimentacao.id}
            emptyTitle="Nenhuma movimentação encontrada"
            emptyDescription="Registre uma entrada, saída ou ajuste para iniciar o histórico."
            columns={[
              {
                header: 'Data',
                headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                className: 'px-4 py-3 text-sm text-slate-600',
                render: (movimentacao) => formatarDataHora(movimentacao.created_at),
              },
              {
                header: 'Produto',
                headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                className: 'px-4 py-3 text-sm font-semibold text-slate-900',
                render: (movimentacao) => normalizarRelacao(movimentacao.almoxarifado_produtos)?.nome ?? '-',
              },
              {
                header: 'Tipo',
                headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                className: 'px-4 py-3 text-sm',
                render: (movimentacao) => (
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${tipoClassName(movimentacao.tipo)}`}>
                    {movimentacao.tipo}
                  </span>
                ),
              },
              {
                header: 'Quantidade',
                headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                className: 'px-4 py-3 text-sm font-bold text-slate-900',
                render: (movimentacao) => {
                  const produto = normalizarRelacao(movimentacao.almoxarifado_produtos)
                  return formatarQuantidade(movimentacao.quantidade, produto?.unidade)
                },
              },
              {
                header: 'Destino',
                headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                className: 'px-4 py-3 text-sm text-slate-600',
                render: (movimentacao) => formatarDestino(movimentacao.destino),
              },
              {
                header: 'Centro de custo',
                headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                className: 'px-4 py-3 text-sm text-slate-600',
                render: (movimentacao) => movimentacao.centro_custo || '-',
              },
              {
                header: 'Responsável',
                headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                className: 'px-4 py-3 text-sm text-slate-600',
                render: (movimentacao) => movimentacao.responsavel_solicitacao || '-',
              },
              {
                header: 'Usuário',
                headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                className: 'px-4 py-3 text-sm text-slate-600',
                render: (movimentacao) => {
                  const usuario = normalizarRelacao(movimentacao.administrativo_usuarios)
                  return usuario?.nome || usuario?.email || '-'
                },
              },
              {
                header: 'Observação',
                headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                className: 'px-4 py-3 text-sm text-slate-600',
                render: (movimentacao) => movimentacao.observacao || '-',
              },
            ]}
          />
        </div>
      </ModuleCard>
    </ModuleLayout>
  )
}
