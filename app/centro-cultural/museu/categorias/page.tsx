import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModuloMuseuNav } from '@/components/modulo-museu-nav'
import {
  ativarCategoriaMuseu,
  atualizarCategoriaMuseu,
  criarCategoriaMuseu,
  inativarCategoriaMuseu,
} from './actions'

type Categoria = {
  id: string
  nome: string
  descricao: string | null
  status: string | null
  created_at: string | null
}

type Peca = {
  id: string
  nome: string
  numero_tombo: string | null
  status: string | null
  categoria_id: string | null
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

export default async function MuseuCategoriasPage({
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

  let categoriasQuery = supabase
    .from('museu_categorias')
    .select('id, nome, descricao, status, created_at')
    .order('nome', { ascending: true })

  if (busca) {
    categoriasQuery = categoriasQuery.ilike('nome', `%${busca}%`)
  }

  if (statusFiltro) {
    categoriasQuery = categoriasQuery.eq('status', statusFiltro)
  }

  const [
    { data: categoriasData, error: categoriasError },
    { data: pecasData, error: pecasError },
  ] = await Promise.all([
    categoriasQuery,
    supabase
      .from('museu_acervo')
      .select('id, nome, numero_tombo, status, categoria_id')
      .order('nome', { ascending: true }),
  ])

  if (categoriasError) {
    redirect(`/centro-cultural/museu/categorias?message=${encodeURIComponent(categoriasError.message)}`)
  }

  if (pecasError) {
    redirect(`/centro-cultural/museu/categorias?message=${encodeURIComponent(pecasError.message)}`)
  }

  const categorias = (categoriasData ?? []) as Categoria[]
  const pecas = (pecasData ?? []) as Peca[]

  const categoriaEditando = editarId
    ? categorias.find((categoria) => categoria.id === editarId)
    : null

  const mostrarFormulario = modoNovo || !!categoriaEditando

  function totalPecasDaCategoria(categoriaId: string) {
    return pecas.filter((peca) => peca.categoria_id === categoriaId).length
  }

  const pecasDaCategoria = categoriaEditando
    ? pecas.filter((peca) => peca.categoria_id === categoriaEditando.id)
    : []

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloMuseuNav currentPath="/centro-cultural/museu/categorias" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Categorias do Museu
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Organize o acervo em categorias e acompanhe as peças vinculadas.
                </p>
              </div>

              {!mostrarFormulario && (
                <a
                  href="/centro-cultural/museu/categorias?novo=1"
                  className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Nova categoria
                </a>
              )}
            </div>
          </div>

          {mostrarFormulario && (
            <div className={cardClassName()}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {categoriaEditando ? 'Editar categoria' : 'Nova categoria'}
                </h2>

                <a
                  href="/centro-cultural/museu/categorias"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Voltar para lista
                </a>
              </div>

              <form
                action={categoriaEditando ? atualizarCategoriaMuseu : criarCategoriaMuseu}
                className="mt-6 grid gap-4"
              >
                {categoriaEditando && (
                  <input type="hidden" name="id" value={categoriaEditando.id} />
                )}

                <input
                  name="nome"
                  placeholder="Nome da categoria"
                  required
                  defaultValue={categoriaEditando?.nome ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <textarea
                  name="descricao"
                  placeholder="Descrição da categoria"
                  defaultValue={categoriaEditando?.descricao ?? ''}
                  className="min-h-[110px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <select
                  name="status"
                  defaultValue={categoriaEditando?.status ?? 'ativa'}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                >
                  <option value="ativa">Ativa</option>
                  <option value="inativa">Inativa</option>
                </select>

                {categoriaEditando && totalPecasDaCategoria(categoriaEditando.id) > 0 && (
                  <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    Esta categoria possui peças vinculadas e não poderá ser inativada enquanto houver vínculo no acervo.
                  </p>
                )}

                {params.message && (
                  <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    {params.message}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                  >
                    {categoriaEditando ? 'Atualizar categoria' : 'Salvar categoria'}
                  </button>

                  <a
                    href="/centro-cultural/museu/categorias"
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
                  Lista de categorias
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Busque, filtre, edite, ative e inative categorias do museu.
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
                  <option value="ativa">Ativa</option>
                  <option value="inativa">Inativa</option>
                </select>

                <button
                  type="submit"
                  className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Filtrar
                </button>
              </form>
            </div>

            {!mostrarFormulario && params.message && (
              <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {params.message}
              </p>
            )}

            {categorias.length > 0 ? (
              <div className="mt-6 space-y-4">
                {categorias.map((categoria) => {
                  const totalPecas = totalPecasDaCategoria(categoria.id)
                  const possuiVinculo = totalPecas > 0

                  return (
                    <div
                      key={categoria.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">
                              {categoria.nome}
                            </h3>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                categoria.status === 'ativa'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {categoria.status || 'ativa'}
                            </span>

                            <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                              {totalPecas} peça(s)
                            </span>

                            {possuiVinculo && (
                              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                Com vínculo no acervo
                              </span>
                            )}
                          </div>

                          <div className="text-sm text-slate-700 space-y-1">
                            <p>
                              <span className="font-semibold">Descrição:</span>{' '}
                              {categoria.descricao || '-'}
                            </p>
                          </div>

                          {possuiVinculo && (
                            <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                              <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                                Ver peças vinculadas
                              </summary>

                              <div className="mt-4 space-y-2">
                                {pecas
                                  .filter((peca) => peca.categoria_id === categoria.id)
                                  .map((peca) => (
                                    <div
                                      key={peca.id}
                                      className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between"
                                    >
                                      <div>
                                        <p className="font-semibold text-slate-900">
                                          {peca.nome}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                          Tombo: {peca.numero_tombo || '-'} • Status: {peca.status || '-'}
                                        </p>
                                      </div>

                                      <a
                                        href={`/centro-cultural/museu/acervo/${peca.id}`}
                                        className="text-sm font-semibold text-violet-700"
                                      >
                                        Ver peça
                                      </a>
                                    </div>
                                  ))}
                              </div>
                            </details>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`/centro-cultural/museu/categorias?editar=${categoria.id}${
                              busca ? `&busca=${encodeURIComponent(busca)}` : ''
                            }${
                              statusFiltro ? `&status=${encodeURIComponent(statusFiltro)}` : ''
                            }`}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Editar
                          </a>

                          {categoria.status === 'ativa' ? (
                            <form action={inativarCategoriaMuseu}>
                              <input type="hidden" name="id" value={categoria.id} />
                              <button
                                type="submit"
                                disabled={possuiVinculo}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
                                  possuiVinculo
                                    ? 'cursor-not-allowed bg-slate-400'
                                    : 'bg-red-600 hover:bg-red-700'
                                }`}
                              >
                                Inativar
                              </button>
                            </form>
                          ) : (
                            <form action={ativarCategoriaMuseu}>
                              <input type="hidden" name="id" value={categoria.id} />
                              <button
                                type="submit"
                                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                              >
                                Ativar
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhuma categoria encontrada.
              </p>
            )}
          </div>

          {categoriaEditando && (
            <div className={cardClassName()}>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Peças vinculadas à categoria
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Categoria: {categoriaEditando.nome}
              </p>

              {pecasDaCategoria.length > 0 ? (
                <div className="mt-6 space-y-2">
                  {pecasDaCategoria.map((peca) => (
                    <div
                      key={peca.id}
                      className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {peca.nome}
                        </p>
                        <p className="text-xs text-slate-500">
                          Tombo: {peca.numero_tombo || '-'} • Status: {peca.status || '-'}
                        </p>
                      </div>

                      <a
                        href={`/centro-cultural/museu/acervo/${peca.id}`}
                        className="text-sm font-semibold text-violet-700"
                      >
                        Ver peça
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-600">
                  Nenhuma peça vinculada a esta categoria.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}