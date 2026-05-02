import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"
import { createClient } from '@/lib/supabase/server'
import { ModuloCasaArtesaoNav } from '@/components/modulo-casa-artesao-nav'
import {
  criarProduto,
  atualizarProduto,
  inativarProduto,
} from './actions'

type Produto = {
  id: string
  nome: string
  descricao: string | null
  preco: number
  quantidade: number
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

export default async function CasaArtesaoProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    busca?: string
    editar?: string
    novo?: string
    status?: string
  }>
}) {
  const params = await searchParams
  const busca = params.busca?.trim() || ''
  const editarId = params.editar?.trim() || ''
  const modoNovo = params.novo === '1'
  const statusFiltro = params.status?.trim() || ''

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let produtosQuery = supabase
    .from('casa_artesao_produtos')
    .select('*')
    .order('created_at', { ascending: false })

  if (busca) {
    produtosQuery = produtosQuery.ilike('nome', `%${busca}%`)
  }

  if (statusFiltro) {
    produtosQuery = produtosQuery.eq('status', statusFiltro)
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
    redirect(`/casa-artesao/produtos?message=${encodeURIComponent(produtosError.message)}`)
  }

  if (artesaosError) {
    redirect(`/casa-artesao/produtos?message=${encodeURIComponent(artesaosError.message)}`)
  }

  const produtos = (produtosData ?? []) as Produto[]
  const artesaos = (artesaosData ?? []) as Artesao[]

  const produtoEditando = editarId
    ? produtos.find((produto) => produto.id === editarId)
    : null

  const mostrarFormulario = modoNovo || !!produtoEditando

  function getNomeArtesao(artesaoId: string) {
    return artesaos.find((artesao) => artesao.id === artesaoId)?.nome || 'Artesão'
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCasaArtesaoNav currentPath="/casa-artesao/produtos" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Produtos
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Cadastro e gestão dos produtos vinculados aos artesãos.
                </p>
              </div>

              {!mostrarFormulario && (
                <a
                  href="/casa-artesao/produtos?novo=1"
                  className="inline-flex rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
                >
                  Novo produto
                </a>
              )}
            </div>
          </div>

          {mostrarFormulario && (
            <div className={cardClassName()}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900">
                  {produtoEditando ? 'Editar produto' : 'Novo produto'}
                </h2>

                <a
                  href="/casa-artesao/produtos"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Voltar para lista
                </a>
              </div>

              <form
                action={produtoEditando ? atualizarProduto : criarProduto}
                className="mt-6 grid gap-4"
              >
                {produtoEditando && (
                  <input type="hidden" name="id" value={produtoEditando.id} />
                )}

                <input
                  name="nome"
                  placeholder="Nome do produto"
                  required
                  defaultValue={produtoEditando?.nome ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <textarea
                  name="descricao"
                  placeholder="Descrição"
                  defaultValue={produtoEditando?.descricao ?? ''}
                  className="min-h-[110px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="preco"
                    type="number"
                    step="0.01"
                    placeholder="Preço"
                    required
                    defaultValue={produtoEditando?.preco ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <input
                    name="quantidade"
                    type="number"
                    placeholder="Quantidade em estoque"
                    required
                    defaultValue={produtoEditando?.quantidade ?? 0}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <select
                  name="artesao_id"
                  required
                  defaultValue={produtoEditando?.artesao_id ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                >
                  <option value="">Selecione o artesão</option>
                  {artesaos.map((artesao) => (
                    <option key={artesao.id} value={artesao.id}>
                      {artesao.nome}
                    </option>
                  ))}
                </select>

                <select
                  name="status"
                  defaultValue={produtoEditando?.status ?? 'ativo'}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>

                {params.message && (
                  <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    {params.message}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="rounded-2xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
                  >
                    {produtoEditando ? 'Atualizar produto' : 'Salvar produto'}
                  </button>

                  <a
                    href="/casa-artesao/produtos"
                    className="rounded-2xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancelar
                  </a>
                </div>
              </form>
            </div>
          )}

          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Lista de produtos
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Controle de produtos, preços e quantidades
                </p>
              </div>

              <form method="get" className="grid w-full max-w-4xl gap-2 md:grid-cols-3">
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

                <button
                  type="submit"
                  className="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
                >
                  Buscar
                </button>
              </form>
            </div>

            {params.message && !mostrarFormulario && (
              <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {params.message}
              </p>
            )}

            {produtos.length > 0 ? (
              <div className="mt-6 space-y-4">
                {produtos.map((produto) => (
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
                        </div>

                        <div className="text-sm text-slate-700">
                          <p>
                            <span className="font-semibold">Preço:</span>{' '}
                            {formatarMoeda(produto.preco)}
                          </p>
                          <p>
                            <span className="font-semibold">Quantidade:</span>{' '}
                            {produto.quantidade}
                          </p>
                          <p>
                            <span className="font-semibold">Descrição:</span>{' '}
                            {produto.descricao || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/casa-artesao/produtos?editar=${produto.id}${
                            busca ? `&busca=${encodeURIComponent(busca)}` : ''
                          }${
                            statusFiltro ? `&status=${encodeURIComponent(statusFiltro)}` : ''
                          }`}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Editar
                        </a>

                        {produto.status !== 'inativo' && (
                          <form action={inativarProduto}>
                            <input type="hidden" name="id" value={produto.id} />
                            <button
                              type="submit"
                              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                            >
                              Inativar
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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