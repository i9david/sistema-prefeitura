import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertTriangle, Package, Plus, Search } from 'lucide-react'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuloAlmoxarifadoNav } from '@/components/modulo-almoxarifado-nav'
import { ModuleCard, ModuleMetricCard } from '@/components/module/module-card'
import { ModuleGrid } from '@/components/module/module-grid'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuleTable } from '@/components/module/module-table'
import { criarProduto, listarCategorias, listarProdutos } from '../actions'

function normalizarRelacao<T>(relacao: T | T[] | null | undefined) {
  if (!relacao) return null
  return Array.isArray(relacao) ? relacao[0] ?? null : relacao
}

function formatarQuantidade(valor: number | string | null | undefined, unidade?: string | null) {
  return `${Number(valor ?? 0).toLocaleString('pt-BR', {
    maximumFractionDigits: 3,
  })}${unidade ? ` ${unidade}` : ''}`
}

function statusEstoqueClassName(baixo: boolean) {
  return baixo
    ? 'bg-amber-100 text-amber-800'
    : 'bg-emerald-100 text-emerald-700'
}

export default async function AlmoxarifadoProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{
    busca?: string
    categoria_id?: string
    estoque?: string
    novo?: string
    message?: string
  }>
}) {
  const params = await searchParams
  const busca = params.busca?.trim() || ''
  const categoriaId = params.categoria_id?.trim() || ''
  const estoque = params.estoque?.trim() || ''
  const modoNovo = params.novo === '1'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [categorias, produtos] = await Promise.all([
    listarCategorias(),
    listarProdutos({ busca, categoriaId, estoque, ativos: true }),
  ])

  const produtosBaixoEstoque = produtos.filter(
    (produto) => Number(produto.quantidade_atual) <= Number(produto.quantidade_minima)
  )

  return (
    <ModuleLayout sidebar={<ModuloAlmoxarifadoNav currentPath="/almoxarifado/produtos" />}>
      <ModuleHeader
        title="Produtos"
        eyebrow="Cadastros"
        description="Controle os materiais com unidade de medida, saldo atual, estoque mínimo e categoria."
        icon={Package}
        accent="emerald"
        action={
          !modoNovo && (
            <Link href="/almoxarifado/produtos?novo=1" className="btn-primary w-full justify-center md:w-auto">
              <Plus size={16} aria-hidden="true" />
              Novo produto
            </Link>
          )
        }
      />

      {modoNovo && (
        <ModuleCard>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Novo produto</h2>
              <p className="mt-1 text-sm text-slate-500">
                Cadastre o item com saldo inicial e ponto mínimo de reposição.
              </p>
            </div>
            <Link href="/almoxarifado/produtos" className="btn-secondary">
              Voltar
            </Link>
          </div>

          <form action={criarProduto} className="mt-5 grid gap-4 md:grid-cols-2">
            <input
              name="nome"
              required
              placeholder="Nome do produto"
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm"
            />
            <select
              name="categoria_id"
              required
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm"
            >
              <option value="">Selecione a categoria</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
            <input
              name="unidade"
              required
              placeholder="Unidade: un, litro, caixa"
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm"
            />
            <input
              name="quantidade_atual"
              type="number"
              step="0.001"
              min="0"
              defaultValue="0"
              placeholder="Quantidade atual"
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm"
            />
            <input
              name="quantidade_minima"
              type="number"
              step="0.001"
              min="0"
              defaultValue="0"
              placeholder="Quantidade mínima"
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm"
            />
            <button type="submit" className="btn-primary justify-center">
              <Plus size={16} aria-hidden="true" />
              Cadastrar produto
            </button>
          </form>
        </ModuleCard>
      )}

      <ModuleCard>
        <form method="get" className="grid gap-3 md:grid-cols-[1fr_240px_180px_160px]">
          <input
            name="busca"
            defaultValue={busca}
            placeholder="Buscar produto"
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm"
          />
          <select
            name="categoria_id"
            defaultValue={categoriaId}
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm"
          >
            <option value="">Todas as categorias</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
          <select
            name="estoque"
            defaultValue={estoque}
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm"
          >
            <option value="">Todos os estoques</option>
            <option value="baixo">Estoque baixo</option>
          </select>
          <button type="submit" className="btn-primary justify-center">
            <Search size={16} aria-hidden="true" />
            Filtrar
          </button>
        </form>

        {params.message && (
          <p className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
            {params.message}
          </p>
        )}
      </ModuleCard>

      <ModuleGrid columns={3}>
        <ModuleMetricCard label="Produtos listados" value={produtos.length} icon={Package} accent="emerald" />
        <ModuleMetricCard label="Estoque baixo" value={produtosBaixoEstoque.length} icon={AlertTriangle} accent="amber" />
        <ModuleMetricCard label="Categorias" value={categorias.length} icon={Package} accent="emerald" />
      </ModuleGrid>

      <ModuleCard>
        <h2 className="text-lg font-bold text-slate-950">Lista de produtos</h2>
        <div className="mt-4">
          <ModuleTable
            data={produtos}
            getRowKey={(produto) => produto.id}
            emptyTitle="Nenhum produto encontrado"
            emptyDescription="Ajuste os filtros ou cadastre um novo produto."
            columns={[
              {
                header: 'Produto',
                headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                className: 'px-4 py-3 text-sm font-semibold text-slate-900',
                render: (produto) => produto.nome,
              },
              {
                header: 'Categoria',
                headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                className: 'px-4 py-3 text-sm text-slate-600',
                render: (produto) => normalizarRelacao(produto.categorias)?.nome ?? '-',
              },
              {
                header: 'Saldo',
                headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                className: 'px-4 py-3 text-sm font-bold text-slate-900',
                render: (produto) => formatarQuantidade(produto.quantidade_atual, produto.unidade),
              },
              {
                header: 'Mínimo',
                headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                className: 'px-4 py-3 text-sm text-slate-600',
                render: (produto) => formatarQuantidade(produto.quantidade_minima, produto.unidade),
              },
              {
                header: 'Status',
                headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                className: 'px-4 py-3 text-sm',
                render: (produto) => {
                  const baixo = Number(produto.quantidade_atual) <= Number(produto.quantidade_minima)
                  return (
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusEstoqueClassName(baixo)}`}>
                      {baixo ? 'Estoque baixo' : 'Regular'}
                    </span>
                  )
                },
              },
            ]}
          />
        </div>
      </ModuleCard>
    </ModuleLayout>
  )
}
