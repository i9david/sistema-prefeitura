import Link from 'next/link'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModuloMuseuNav } from '@/components/modulo-museu-nav'
import {
  ativarPecaAcervo,
  atualizarPecaAcervo,
  criarPecaAcervo,
  inativarPecaAcervo,
} from './actions'

type Categoria = {
  id: string
  nome: string
  status: string | null
}

type CategoriaRelacionada =
  | { id: string; nome: string }
  | { id: string; nome: string }[]
  | null

type PecaAcervo = {
  id: string
  nome: string
  descricao: string | null
  categoria_id: string | null
  numero_tombo: string | null
  origem: string | null
  data_aquisicao: string | null
  estado_conservacao: string | null
  localizacao: string | null
  localizacao_atual: string | null
  status: string | null
  status_operacional: string | null
  foto_url: string | null
  created_at: string | null
  categorias: CategoriaRelacionada
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function getCategoriaNome(categoria: CategoriaRelacionada) {
  if (!categoria) return 'Sem categoria'
  if (Array.isArray(categoria)) return categoria[0]?.nome ?? 'Sem categoria'
  return categoria.nome
}

function formatarData(data: string | null | undefined) {
  if (!data) return '-'
  const partes = data.split('-')
  if (partes.length !== 3) return data
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function getStatusOperacionalLabel(valor: string | null | undefined) {
  switch (valor) {
    case 'em_exposicao':
      return 'Em exposição'
    case 'em_reserva':
      return 'Em reserva'
    case 'em_manutencao':
      return 'Em manutenção'
    case 'em_restauracao':
      return 'Em restauração'
    case 'emprestada':
      return 'Emprestada'
    case 'indisponivel':
      return 'Indisponível'
    default:
      return valor || '-'
  }
}

function getStatusOperacionalClass(valor: string | null | undefined) {
  switch (valor) {
    case 'em_exposicao':
      return 'bg-green-100 text-green-700'
    case 'em_reserva':
      return 'bg-slate-200 text-slate-700'
    case 'em_manutencao':
      return 'bg-amber-100 text-amber-700'
    case 'em_restauracao':
      return 'bg-orange-100 text-orange-700'
    case 'emprestada':
      return 'bg-blue-100 text-blue-700'
    case 'indisponivel':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-slate-200 text-slate-700'
  }
}

const statusOperacionais = [
  { value: 'em_exposicao', label: 'Em exposição' },
  { value: 'em_reserva', label: 'Em reserva' },
  { value: 'em_manutencao', label: 'Em manutenção' },
  { value: 'em_restauracao', label: 'Em restauração' },
  { value: 'emprestada', label: 'Emprestada' },
  { value: 'indisponivel', label: 'Indisponível' },
]

export default async function MuseuAcervoPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    busca?: string
    editar?: string
    novo?: string
    status?: string
    categoria_id?: string
    status_operacional?: string
  }>
}) {
  const params = await searchParams
  const busca = params.busca?.trim() || ''
  const editarId = params.editar?.trim() || ''
  const modoNovo = params.novo === '1'
  const statusFiltro = params.status?.trim() || ''
  const categoriaFiltro = params.categoria_id?.trim() || ''
  const statusOperacionalFiltro = params.status_operacional?.trim() || ''

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: categoriasData, error: categoriasError } = await supabase
    .from('museu_categorias')
    .select('id, nome, status')
    .order('nome', { ascending: true })

  if (categoriasError) {
    redirect(`/centro-cultural/museu/acervo?message=${encodeURIComponent(categoriasError.message)}`)
  }

  let acervoQuery = supabase
    .from('museu_acervo')
    .select(`
      id,
      nome,
      descricao,
      categoria_id,
      numero_tombo,
      origem,
      data_aquisicao,
      estado_conservacao,
      localizacao,
      localizacao_atual,
      status,
      status_operacional,
      foto_url,
      created_at,
      categorias:museu_categorias (
        id,
        nome
      )
    `)
    .order('nome', { ascending: true })

  if (busca) {
    acervoQuery = acervoQuery.or(
      `nome.ilike.%${busca}%,numero_tombo.ilike.%${busca}%,origem.ilike.%${busca}%,localizacao_atual.ilike.%${busca}%`
    )
  }

  if (statusFiltro) {
    acervoQuery = acervoQuery.eq('status', statusFiltro)
  }

  if (categoriaFiltro) {
    acervoQuery = acervoQuery.eq('categoria_id', categoriaFiltro)
  }

  if (statusOperacionalFiltro) {
    acervoQuery = acervoQuery.eq('status_operacional', statusOperacionalFiltro)
  }

  const { data: acervoData, error: acervoError } = await acervoQuery

  if (acervoError) {
    redirect(`/centro-cultural/museu/acervo?message=${encodeURIComponent(acervoError.message)}`)
  }

  const categorias = (categoriasData ?? []) as Categoria[]
  const acervo = (acervoData ?? []) as PecaAcervo[]

  const pecaEditando = editarId
    ? acervo.find((item) => item.id === editarId)
    : null

  const mostrarFormulario = modoNovo || !!pecaEditando

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloMuseuNav currentPath="/centro-cultural/museu/acervo" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Acervo do Museu
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Cadastro, controle e organização das peças do museu.
                </p>
              </div>

              {!mostrarFormulario && (
                <a
                  href="/centro-cultural/museu/acervo?novo=1"
                  className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Nova peça
                </a>
              )}
            </div>
          </div>

          {mostrarFormulario && (
            <div className={cardClassName()}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {pecaEditando ? 'Editar peça' : 'Nova peça'}
                </h2>

                <a
                  href="/centro-cultural/museu/acervo"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Voltar para lista
                </a>
              </div>

              <form
                action={pecaEditando ? atualizarPecaAcervo : criarPecaAcervo}
                className="mt-6 grid gap-4"
              >
                {pecaEditando && (
                  <input type="hidden" name="id" value={pecaEditando.id} />
                )}

                <input
                  name="nome"
                  placeholder="Nome da peça"
                  required
                  defaultValue={pecaEditando?.nome ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <textarea
                  name="descricao"
                  placeholder="Descrição da peça"
                  defaultValue={pecaEditando?.descricao ?? ''}
                  className="min-h-[110px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    name="categoria_id"
                    required
                    defaultValue={pecaEditando?.categoria_id ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="" disabled>
                      Selecione a categoria
                    </option>
                    {categorias
                      .filter((categoria) => categoria.status !== 'inativa')
                      .map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </option>
                      ))}
                  </select>

                  <input
                    name="numero_tombo"
                    placeholder="Número de tombo"
                    defaultValue={pecaEditando?.numero_tombo ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="origem"
                    placeholder="Origem da peça"
                    defaultValue={pecaEditando?.origem ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <input
                    name="data_aquisicao"
                    type="date"
                    defaultValue={pecaEditando?.data_aquisicao ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="estado_conservacao"
                    placeholder="Estado de conservação"
                    defaultValue={pecaEditando?.estado_conservacao ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <input
                    name="localizacao"
                    placeholder="Localização da peça"
                    defaultValue={pecaEditando?.localizacao ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Foto da peça
                  </label>
                  <input
                    type="file"
                    name="foto"
                    accept="image/*"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <select
                  name="status"
                  defaultValue={pecaEditando?.status ?? 'ativo'}
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
                    className="rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                  >
                    {pecaEditando ? 'Atualizar peça' : 'Salvar peça'}
                  </button>

                  <a
                    href="/centro-cultural/museu/acervo"
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
                  Lista do acervo
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Busque, filtre, edite, ative e inative peças do museu.
                </p>
              </div>

              <form method="get" className="grid w-full max-w-6xl gap-2 md:grid-cols-5">
                <input
                  type="text"
                  name="busca"
                  placeholder="Buscar por nome, tombo, origem ou localização"
                  defaultValue={busca}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />

                <select
                  name="categoria_id"
                  defaultValue={categoriaFiltro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todas as categorias</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>

                <select
                  name="status_operacional"
                  defaultValue={statusOperacionalFiltro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todos os status operacionais</option>
                  {statusOperacionais.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>

                <select
                  name="status"
                  defaultValue={statusFiltro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todos os status de cadastro</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
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

            {acervo.length > 0 ? (
              <div className="mt-6 space-y-4">
                {acervo.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex gap-4">
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                          {item.foto_url ? (
                            <img
                              src={item.foto_url}
                              alt={item.nome}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                              Sem foto
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">
                              {item.nome}
                            </h3>
                            <p className="text-sm text-slate-600">
                              Categoria: {getCategoriaNome(item.categorias)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                item.status === 'ativo'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {item.status || 'ativo'}
                            </span>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusOperacionalClass(
                                item.status_operacional
                              )}`}
                            >
                              {getStatusOperacionalLabel(item.status_operacional)}
                            </span>
                          </div>

                          <div className="text-sm text-slate-700 space-y-1">
                            <p>
                              <span className="font-semibold">Tombo:</span>{' '}
                              {item.numero_tombo || '-'}
                            </p>
                            <p>
                              <span className="font-semibold">Origem:</span>{' '}
                              {item.origem || '-'}
                            </p>
                            <p>
                              <span className="font-semibold">Data de aquisição:</span>{' '}
                              {formatarData(item.data_aquisicao)}
                            </p>
                            <p>
                              <span className="font-semibold">Estado de conservação:</span>{' '}
                              {item.estado_conservacao || '-'}
                            </p>
                            <p>
                              <span className="font-semibold">Localização de cadastro:</span>{' '}
                              {item.localizacao || '-'}
                            </p>
                            <p>
                              <span className="font-semibold">Localização atual:</span>{' '}
                              {item.localizacao_atual || item.localizacao || '-'}
                            </p>
                            <p>
                              <span className="font-semibold">Descrição:</span>{' '}
                              {item.descricao || '-'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/centro-cultural/museu/acervo/${item.id}`}
                          className="rounded-xl border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                        >
                          Ver peça
                        </Link>

                        <a
                          href={`/centro-cultural/museu/acervo?editar=${item.id}${
                            busca ? `&busca=${encodeURIComponent(busca)}` : ''
                          }${
                            categoriaFiltro
                              ? `&categoria_id=${encodeURIComponent(categoriaFiltro)}`
                              : ''
                          }${
                            statusOperacionalFiltro
                              ? `&status_operacional=${encodeURIComponent(statusOperacionalFiltro)}`
                              : ''
                          }${
                            statusFiltro ? `&status=${encodeURIComponent(statusFiltro)}` : ''
                          }`}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Editar
                        </a>

                        {item.status === 'ativo' ? (
                          <form action={inativarPecaAcervo}>
                            <input type="hidden" name="id" value={item.id} />
                            <button
                              type="submit"
                              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                            >
                              Inativar
                            </button>
                          </form>
                        ) : (
                          <form action={ativarPecaAcervo}>
                            <input type="hidden" name="id" value={item.id} />
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
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhuma peça encontrada.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}