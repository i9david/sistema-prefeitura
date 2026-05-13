import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertTriangle, BarChart3, ClipboardList, Package, PackageSearch, Shapes } from 'lucide-react'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuloAlmoxarifadoNav } from '@/components/modulo-almoxarifado-nav'
import { ModuleAreaCard, ModuleCard, ModuleMetricCard } from '@/components/module/module-card'
import { ModuleGrid } from '@/components/module/module-grid'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { listarCategorias, listarMovimentacoes, listarProdutos } from './actions'

function normalizarRelacao<T>(relacao: T | T[] | null | undefined) {
  if (!relacao) return null
  return Array.isArray(relacao) ? relacao[0] ?? null : relacao
}

function formatarQuantidade(valor: number | string | null | undefined, unidade?: string | null) {
  const numero = Number(valor ?? 0)
  return `${numero.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}${unidade ? ` ${unidade}` : ''}`
}

function formatarDataHora(valor: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(valor))
}

export default async function AlmoxarifadoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [categorias, produtos, movimentacoes] = await Promise.all([
    listarCategorias(),
    listarProdutos({ ativos: true }),
    listarMovimentacoes({ limite: 5 }),
  ])

  const produtosBaixoEstoque = produtos.filter(
    (produto) => Number(produto.quantidade_atual) <= Number(produto.quantidade_minima)
  )

  return (
    <ModuleLayout sidebar={<ModuloAlmoxarifadoNav currentPath="/almoxarifado" />}>
      <ModuleHeader
        title="Almoxarifado"
        eyebrow="Gestão"
        description="Controle institucional de materiais com categorias, estoque mínimo, movimentações rastreáveis e alerta de reposição."
        icon={PackageSearch}
        accent="emerald"
        context="Estoque institucional"
      />

      <ModuleGrid columns={3}>
        <ModuleMetricCard
          label="Produtos ativos"
          value={produtos.length}
          description="Itens disponíveis para movimentação."
          icon={Package}
          accent="emerald"
        />
        <ModuleMetricCard
          label="Estoque baixo"
          value={produtosBaixoEstoque.length}
          description="Produtos em ponto de atenção."
          icon={AlertTriangle}
          accent="amber"
        />
        <ModuleMetricCard
          label="Categorias"
          value={categorias.length}
          description="Classificação dos materiais."
          icon={Shapes}
          accent="emerald"
        />
      </ModuleGrid>

      <ModuleGrid columns={4}>
        <ModuleAreaCard
          title="Categorias"
          description="Organize materiais por grupos de consumo, manutenção ou expediente."
          href="/almoxarifado/categorias"
          icon={Shapes}
          accent="emerald"
        />
        <ModuleAreaCard
          title="Produtos"
          description="Cadastre itens, unidades de medida, saldo atual e estoque mínimo."
          href="/almoxarifado/produtos"
          icon={Package}
          accent="emerald"
        />
        <ModuleAreaCard
          title="Movimentações"
          description="Registre entradas, saídas e ajustes com histórico de usuário."
          href="/almoxarifado/movimentacoes"
          icon={ClipboardList}
          accent="emerald"
        />
        <ModuleAreaCard
          title="Relatórios"
          description="Analise consumo por período, destino, centro de custo e itens críticos."
          href="/almoxarifado/relatorios"
          icon={BarChart3}
          accent="emerald"
        />
      </ModuleGrid>

      <div className="grid gap-6 xl:grid-cols-2">
        <ModuleCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Produtos com estoque baixo</h2>
              <p className="mt-1 text-sm text-slate-500">
                Itens que atingiram ou ficaram abaixo da quantidade mínima.
              </p>
            </div>
            <Link href="/almoxarifado/produtos?estoque=baixo" className="btn-secondary">
              Ver todos
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {produtosBaixoEstoque.slice(0, 6).map((produto) => {
              const categoria = normalizarRelacao(produto.categorias)

              return (
                <div key={produto.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-bold text-slate-950">{produto.nome}</p>
                      <p className="text-sm text-amber-800">{categoria?.nome ?? 'Sem categoria'}</p>
                    </div>
                    <p className="text-sm font-bold text-amber-900">
                      {formatarQuantidade(produto.quantidade_atual, produto.unidade)} / mínimo {formatarQuantidade(produto.quantidade_minima, produto.unidade)}
                    </p>
                  </div>
                </div>
              )
            })}

            {produtosBaixoEstoque.length === 0 && (
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Nenhum produto abaixo do mínimo no momento.
              </p>
            )}
          </div>
        </ModuleCard>

        <ModuleCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Últimas movimentações</h2>
              <p className="mt-1 text-sm text-slate-500">
                Histórico recente de entrada, saída e ajuste.
              </p>
            </div>
            <Link href="/almoxarifado/movimentacoes" className="btn-secondary">
              Abrir
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {movimentacoes.map((movimentacao) => {
              const produto = normalizarRelacao(movimentacao.almoxarifado_produtos)

              return (
                <div key={movimentacao.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-bold text-slate-950">{produto?.nome ?? 'Produto'}</p>
                      <p className="text-sm text-slate-500">{formatarDataHora(movimentacao.created_at)}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase text-emerald-700">
                      {movimentacao.tipo} · {formatarQuantidade(movimentacao.quantidade, produto?.unidade)}
                    </span>
                  </div>
                </div>
              )
            })}

            {movimentacoes.length === 0 && (
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Nenhuma movimentação registrada ainda.
              </p>
            )}
          </div>
        </ModuleCard>
      </div>
    </ModuleLayout>
  )
}
