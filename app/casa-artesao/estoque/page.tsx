import { redirect } from 'next/navigation'
import { Boxes, PackageCheck, PackageX, Wallet } from 'lucide-react'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuloCasaArtesaoNav } from '@/components/modulo-casa-artesao-nav'
import { ModuleCard, ModuleMetricCard } from '@/components/module/module-card'
import { ModuleGrid } from '@/components/module/module-grid'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { cache } from 'react'

export const revalidate = 300 // Revalidar cache a cada 5 minutos

type Produto = {
  id: string
  nome: string
  descricao: string | null
  preco: number | null
  quantidade: number | null
  artesao_id: string
  status: string | null
  created_at: string
}

type Artesao = {
  id: string
  nome: string
}

function formatarMoeda(valor: number | null | undefined) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor ?? 0))
}

const carregarArtesaos = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('casa_artesao_artesaos')
    .select('id, nome')
    .order('nome', { ascending: true })

  if (error) throw error
  return data || []
})

const carregarProdutosEstoque = cache(async (busca: string, statusFiltro: string, artesaoFiltro: string) => {
  const supabase = await createClient()

  let query = supabase
    .from('casa_artesao_produtos')
    .select('id, nome, descricao, preco, quantidade, artesao_id, status')
    .order('nome', { ascending: true })
    .limit(100)

  if (busca) {
    query = query.ilike('nome', `%${busca}%`)
  }

  if (statusFiltro) {
    query = query.eq('status', statusFiltro)
  }

  if (artesaoFiltro) {
    query = query.eq('artesao_id', artesaoFiltro)
  }

  const { data, error } = await query
  if (error) throw error

  return data || []
})

const calcularMetricasEstoque = cache(async () => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('casa_artesao_produtos')
    .select('quantidade, preco, status')

  if (error) throw error

  const produtos = data || []
  const totalItens = produtos.reduce((acc, produto) => acc + Number(produto.quantidade ?? 0), 0)
  const valorTotalEstoque = produtos.reduce(
    (acc, produto) => acc + (Number(produto.quantidade ?? 0) * Number(produto.preco ?? 0)),
    0
  )
  const produtosDisponiveis = produtos.filter(p => p.status === 'disponivel').length
  const produtosIndisponiveis = produtos.filter(p => p.status === 'indisponivel').length

  return {
    totalItens,
    valorTotalEstoque,
    produtosDisponiveis,
    produtosIndisponiveis
  }
})

export default async function CasaArtesaoEstoquePage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    busca?: string
    status?: string
    artesao_id?: string
  }>
}) {
  const params = await searchParams
  const busca = params.busca?.trim() || ''
  const statusFiltro = params.status?.trim() || ''
  const artesaoFiltro = params.artesao_id?.trim() || ''

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [produtos, artesaos, metricas] = await Promise.all([
    carregarProdutosEstoque(busca, statusFiltro, artesaoFiltro),
    carregarArtesaos(),
    calcularMetricasEstoque()
  ])

  function getNomeArtesao(artesaoId: string) {
    return artesaos.find((artesao) => artesao.id === artesaoId)?.nome || 'Artesão'
  }

  const totalValorEmEstoque = produtos.reduce(
    (acc, produto) => acc + Number(produto.preco ?? 0) * Number(produto.quantidade ?? 0),
    0
  );

  const produtosComEstoque = produtos.filter((produto) => Number(produto.quantidade ?? 0) > 0).length
  const produtosSemEstoque = produtos.filter((produto) => Number(produto.quantidade ?? 0) <= 0).length

  return (
    <ModuleLayout sidebar={<ModuloCasaArtesaoNav currentPath="/casa-artesao/estoque" />}>
      <ModuleHeader
        title="Estoque"
        description="Controle de produtos disponíveis, quantidades e valor total em estoque."
        eyebrow="Operação"
        icon={Boxes}
        accent="amber"
      />

          <ModuleGrid columns={4}>
            <ModuleMetricCard
              label="Produtos listados"
              value={produtos.length}
              icon={Boxes}
              accent="amber"
            />
            <ModuleMetricCard
              label="Unidades em estoque"
              value={metricas.totalItens}
              icon={PackageCheck}
              accent="emerald"
            />
            <ModuleMetricCard
              label="Produtos sem estoque"
              value={metricas.produtosIndisponiveis}
              icon={PackageX}
              accent="violet"
            />
            <ModuleMetricCard
              label="Valor total em estoque"
              value={formatarMoeda(metricas.valorTotalEstoque)}
              icon={Wallet}
              accent="blue"
            />
          </ModuleGrid>

          <ModuleCard>
            <form method="get" className="grid gap-4 md:grid-cols-4">
              <input
                type="text"
                name="busca"
                placeholder="Buscar por nome"
                defaultValue={busca}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />

              <select
                name="status"
                defaultValue={statusFiltro}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Todos os status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>

              <select
                name="artesao_id"
                defaultValue={artesaoFiltro}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Todos os artesãos</option>
                {artesaos.map((artesao) => (
                  <option key={artesao.id} value={artesao.id}>
                    {artesao.nome}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
              >
                Buscar
              </button>
            </form>

            {params.message && (
              <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {params.message}
              </p>
            )}
          </ModuleCard>

          <ModuleCard>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Posição de estoque
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Produtos, quantidades e valor acumulado
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                Sem estoque: {produtosSemEstoque}
              </div>
            </div>

            {produtos.length > 0 ? (
              <div className="mt-6 space-y-4">
                {produtos.map((produto) => {
                  const quantidade = Number(produto.quantidade ?? 0)
                  const preco = Number(produto.preco ?? 0)
                  const valorTotal = quantidade * preco

                  return (
                    <div
                      key={produto.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">
                              {produto.nome}
                            </h3>
                            <p className="text-sm text-slate-600">
                              Artesão: {getNomeArtesao(produto.artesao_id)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                produto.status === 'ativo'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {produto.status || 'ativo'}
                            </span>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                quantidade > 0
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {quantidade > 0 ? 'Com estoque' : 'Sem estoque'}
                            </span>
                          </div>

                          <div className="text-sm text-slate-700">
                            <p>
                              <span className="font-semibold">Preço unitário:</span>{' '}
                              {formatarMoeda(preco)}
                            </p>
                            <p>
                              <span className="font-semibold">Quantidade:</span>{' '}
                              {quantidade}
                            </p>
                            <p>
                              <span className="font-semibold">Valor total em estoque:</span>{' '}
                              {formatarMoeda(valorTotal)}
                            </p>
                            <p>
                              <span className="font-semibold">Descrição:</span>{' '}
                              {produto.descricao || '-'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`/casa-artesao/produtos?editar=${produto.id}`}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Editar no cadastro
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhum produto encontrado.
              </p>
            )}
          </ModuleCard>
    </ModuleLayout>
  )
}
