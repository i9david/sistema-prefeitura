import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModuloCasaArtesaoNav } from '@/components/modulo-casa-artesao-nav'

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

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function formatarMoeda(valor: number | null | undefined) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor ?? 0))
}

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

  let produtosQuery = supabase
    .from('casa_artesao_produtos')
    .select('*')
    .order('nome', { ascending: true })

  if (busca) {
    produtosQuery = produtosQuery.ilike('nome', `%${busca}%`)
  }

  if (statusFiltro) {
    produtosQuery = produtosQuery.eq('status', statusFiltro)
  }

  if (artesaoFiltro) {
    produtosQuery = produtosQuery.eq('artesao_id', artesaoFiltro)
  }

  const [
    { data: produtosData, error: produtosError },
    { data: artesaosData, error: artesaosError },
  ] = await Promise.all([
    produtosQuery,
    supabase
      .from('casa_artesao_artesaos')
      .select('id, nome')
      .order('nome', { ascending: true }),
  ])

  if (produtosError) {
    redirect(`/casa-artesao/estoque?message=${encodeURIComponent(produtosError.message)}`)
  }

  if (artesaosError) {
    redirect(`/casa-artesao/estoque?message=${encodeURIComponent(artesaosError.message)}`)
  }

  const produtos = (produtosData ?? []) as Produto[]
  const artesaos = (artesaosData ?? []) as Artesao[]

  function getNomeArtesao(artesaoId: string) {
    return artesaos.find((artesao) => artesao.id === artesaoId)?.nome || 'Artesão'
  }

  const totalItens = produtos.reduce((acc, produto) => acc + Number(produto.quantidade ?? 0), 0)
  const valorTotalEstoque = produtos.reduce(
    (acc, produto) => acc + Number(produto.preco ?? 0) * Number(produto.quantidade ?? 0),
    0
  )
  const produtosComEstoque = produtos.filter((produto) => Number(produto.quantidade ?? 0) > 0).length
  const produtosSemEstoque = produtos.filter((produto) => Number(produto.quantidade ?? 0) <= 0).length

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCasaArtesaoNav currentPath="/casa-artesao/estoque" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Estoque
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Controle de produtos disponíveis, quantidades e valor total em estoque.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Produtos listados</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {produtos.length}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Unidades em estoque</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {totalItens}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Produtos com estoque</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {produtosComEstoque}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Valor total em estoque</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {formatarMoeda(valorTotalEstoque)}
              </p>
            </div>
          </div>

          <div className={cardClassName()}>
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
          </div>

          <div className={cardClassName()}>
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
          </div>
        </section>
      </div>
    </main>
  )
}