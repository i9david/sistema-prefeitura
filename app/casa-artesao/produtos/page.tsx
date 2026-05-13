import { redirect } from 'next/navigation'
import { Package, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuloCasaArtesaoNav } from '@/components/modulo-casa-artesao-nav'
import { ModuleCard } from '@/components/module/module-card'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import {
  criarProduto,
  atualizarProduto,
  inativarProduto,
} from './actions'
import { cache } from 'react'

export const revalidate = 300 // Revalidar cache a cada 5 minutos
const PAGE_SIZE = 15

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

const carregarProdutos = cache(async (busca: string, statusFiltro: string, page: number = 1) => {
  const supabase = await createClient()
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('casa_artesao_produtos')
    .select('id, nome, descricao, preco, quantidade, artesao_id, status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (busca) {
    query = query.ilike('nome', `%${busca}%`)
  }

  if (statusFiltro) {
    query = query.eq('status', statusFiltro)
  }

  const { data, error, count } = await query
  if (error) throw error

  return {
    data: data || [],
    total: count || 0,
    totalPages: Math.ceil((count || 0) / PAGE_SIZE)
  }
})

export default async function CasaArtesaoProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    busca?: string
    editar?: string
    novo?: string
    status?: string
    page?: string
  }>
}) {
  const params = await searchParams
  const busca = params.busca?.trim() || ''
  const editarId = params.editar?.trim() || ''
  const modoNovo = params.novo === '1'
  const statusFiltro = params.status?.trim() || ''
  const page = parseInt(params.page || '1', 10)

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [produtosResult, artesaos] = await Promise.all([
    carregarProdutos(busca, statusFiltro, page),
    carregarArtesaos()
  ])

  const { data: produtos, total, totalPages } = produtosResult

  const produtoEditando = editarId
    ? produtos.find((produto) => produto.id === editarId)
    : null

  const mostrarFormulario = modoNovo || !!produtoEditando

  function getNomeArtesao(artesaoId: string) {
    return artesaos.find((artesao) => artesao.id === artesaoId)?.nome || 'ArtesÃ£o'
  }

  // Construir URL para navegaÃ§Ã£o preservando filtros
  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams()
    if (busca) params.set('busca', busca)
    if (statusFiltro) params.set('status', statusFiltro)
    params.set('page', String(p))
    return `/casa-artesao/produtos?${params.toString()}`
  }

  return (
    <ModuleLayout sidebar={<ModuloCasaArtesaoNav currentPath="/casa-artesao/produtos" />}>
      <ModuleHeader
        title="Produtos"
        description="Cadastro e gestÃ£o dos produtos vinculados aos artesÃ£os."
        eyebrow="Cadastros"
        icon={Package}
        accent="amber"
        action={
          !mostrarFormulario && (
            <a
              href="/casa-artesao/produtos?novo=1"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              <Plus size={16} aria-hidden="true" />
              Novo produto
            </a>
          )
        }
      />

          {mostrarFormulario && (
            <ModuleCard>
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
                  placeholder="Descriï¿½ï¿½o"
                  defaultValue={produtoEditando?.descricao ?? ''}
                  className="min-h-[110px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="preco"
                    type="number"
                    step="0.01"
                    placeholder="Preï¿½o"
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
                  <option value="">Selecione o artesï¿½o</option>
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
            </ModuleCard>
          )}

          <ModuleCard>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Lista de produtos
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Controle de produtos, preï¿½os e quantidades
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
              <div className="space-y-6">
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
                            Artesï¿½o: {getNomeArtesao(produto.artesao_id)}
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
                            <span className="font-semibold">Preï¿½o:</span>{' '}
                            {formatarMoeda(produto.preco)}
                          </p>
                          <p>
                            <span className="font-semibold">Quantidade:</span>{' '}
                            {produto.quantidade}
                          </p>
                          <p>
                            <span className="font-semibold">Descriï¿½ï¿½o:</span>{' '}
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
                          }${page > 1 ? `&page=${page}` : ''}`}
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
                <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                  <div className="text-sm text-slate-600">
                    Mostrando {(page - 1) * PAGE_SIZE + 1} a {Math.min(page * PAGE_SIZE, total)} de {total} produtos
                  </div>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <a
                        href={buildPageUrl(page - 1)}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                      >
                        <ChevronLeft size={16} />
                        Anterior
                      </a>
                    )}
                    {page < totalPages && (
                      <a
                        href={buildPageUrl(page + 1)}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                      >
                        PrÃ³ximo
                        <ChevronRight size={16} />
                      </a>
                    )}
                  </div>
                </div>
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
