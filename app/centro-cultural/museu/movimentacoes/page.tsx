import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"
import { createClient } from '@/lib/supabase/server'
import { ModuloMuseuNav } from '@/components/modulo-museu-nav'
import {
  criarMovimentacaoMuseu,
  atualizarMovimentacaoMuseu,
  excluirMovimentacaoMuseu,
} from './actions'

type Peca = {
  id: string
  nome: string
  numero_tombo: string | null
  status: string | null
}

type PecaRelacionada =
  | { id: string; nome: string; numero_tombo: string | null }
  | { id: string; nome: string; numero_tombo: string | null }[]
  | null

type Movimentacao = {
  id: string
  acervo_id: string | null
  tipo: string | null
  descricao: string | null
  data_movimentacao: string | null
  responsavel: string | null
  nova_localizacao: string | null
  novo_status_operacional: string | null
  created_at: string | null
  acervo: PecaRelacionada
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function formatarData(data: string | null | undefined) {
  if (!data) return '-'
  const partes = data.split('-')
  if (partes.length !== 3) return data
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function getPecaNome(acervo: PecaRelacionada) {
  if (!acervo) return 'Peça não encontrada'
  if (Array.isArray(acervo)) return acervo[0]?.nome ?? 'Peça não encontrada'
  return acervo.nome
}

function getPecaTombo(acervo: PecaRelacionada) {
  if (!acervo) return '-'
  if (Array.isArray(acervo)) return acervo[0]?.numero_tombo ?? '-'
  return acervo.numero_tombo ?? '-'
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

const tiposMovimentacao = [
  'entrada',
  'saída',
  'manutenção',
  'restauração',
  'transferência',
]

const statusOperacionais = [
  { value: 'em_exposicao', label: 'Em exposição' },
  { value: 'em_reserva', label: 'Em reserva' },
  { value: 'em_manutencao', label: 'Em manutenção' },
  { value: 'em_restauracao', label: 'Em restauração' },
  { value: 'emprestada', label: 'Emprestada' },
  { value: 'indisponivel', label: 'Indisponível' },
]

export default async function MuseuMovimentacoesPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    busca?: string
    editar?: string
    novo?: string
    tipo?: string
    acervo_id?: string
  }>
}) {
  const params = await searchParams
  const busca = params.busca?.trim() || ''
  const editarId = params.editar?.trim() || ''
  const modoNovo = params.novo === '1'
  const tipoFiltro = params.tipo?.trim() || ''
  const acervoFiltro = params.acervo_id?.trim() || ''

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: pecasData, error: pecasError } = await supabase
    .from('museu_acervo')
    .select('id, nome, numero_tombo, status')
    .order('nome', { ascending: true })

  if (pecasError) {
    redirect(`/centro-cultural/museu/movimentacoes?message=${encodeURIComponent(pecasError.message)}`)
  }

  let movimentacoesQuery = supabase
    .from('museu_movimentacoes')
    .select(`
      id,
      acervo_id,
      tipo,
      descricao,
      data_movimentacao,
      responsavel,
      nova_localizacao,
      novo_status_operacional,
      created_at,
      acervo:museu_acervo (
        id,
        nome,
        numero_tombo
      )
    `)
    .order('data_movimentacao', { ascending: false })
    .order('created_at', { ascending: false })

  if (tipoFiltro) {
    movimentacoesQuery = movimentacoesQuery.eq('tipo', tipoFiltro)
  }

  if (acervoFiltro) {
    movimentacoesQuery = movimentacoesQuery.eq('acervo_id', acervoFiltro)
  }

  const { data: movimentacoesData, error: movimentacoesError } = await movimentacoesQuery

  if (movimentacoesError) {
    redirect(`/centro-cultural/museu/movimentacoes?message=${encodeURIComponent(movimentacoesError.message)}`)
  }

  const pecas = (pecasData ?? []) as Peca[]
  let movimentacoes = (movimentacoesData ?? []) as Movimentacao[]

  if (busca) {
    const termo = busca.toLowerCase()
    movimentacoes = movimentacoes.filter((item) => {
      const nome = getPecaNome(item.acervo).toLowerCase()
      const tombo = getPecaTombo(item.acervo).toLowerCase()
      const responsavel = String(item.responsavel ?? '').toLowerCase()
      const descricao = String(item.descricao ?? '').toLowerCase()
      const tipo = String(item.tipo ?? '').toLowerCase()
      const localizacao = String(item.nova_localizacao ?? '').toLowerCase()
      const status = String(item.novo_status_operacional ?? '').toLowerCase()

      return (
        nome.includes(termo) ||
        tombo.includes(termo) ||
        responsavel.includes(termo) ||
        descricao.includes(termo) ||
        tipo.includes(termo) ||
        localizacao.includes(termo) ||
        status.includes(termo)
      )
    })
  }

  const movimentacaoEditando = editarId
    ? movimentacoes.find((item) => item.id === editarId)
    : null

  const mostrarFormulario = modoNovo || !!movimentacaoEditando

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloMuseuNav currentPath="/centro-cultural/museu/movimentacoes" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Movimentações do Museu
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Controle de entradas, saídas, manutenções, restaurações e transferências.
                </p>
              </div>

              {!mostrarFormulario && (
                <a
                  href="/centro-cultural/museu/movimentacoes?novo=1"
                  className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Nova movimentação
                </a>
              )}
            </div>
          </div>

          {mostrarFormulario && (
            <div className={cardClassName()}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {movimentacaoEditando ? 'Editar movimentação' : 'Nova movimentação'}
                </h2>

                <a
                  href="/centro-cultural/museu/movimentacoes"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Voltar para lista
                </a>
              </div>

              <form
                action={movimentacaoEditando ? atualizarMovimentacaoMuseu : criarMovimentacaoMuseu}
                className="mt-6 grid gap-4"
              >
                {movimentacaoEditando && (
                  <input type="hidden" name="id" value={movimentacaoEditando.id} />
                )}

                <select
                  name="acervo_id"
                  required
                  defaultValue={movimentacaoEditando?.acervo_id ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                >
                  <option value="">Selecione a peça</option>
                  {pecas
                    .filter((peca) => peca.status !== 'inativo')
                    .map((peca) => (
                      <option key={peca.id} value={peca.id}>
                        {peca.nome} {peca.numero_tombo ? `• ${peca.numero_tombo}` : ''}
                      </option>
                    ))}
                </select>

                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    name="tipo"
                    required
                    defaultValue={movimentacaoEditando?.tipo ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="">Selecione o tipo</option>
                    {tiposMovimentacao.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>

                  <input
                    name="data_movimentacao"
                    type="date"
                    required
                    defaultValue={movimentacaoEditando?.data_movimentacao ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <input
                  name="responsavel"
                  placeholder="Responsável pela movimentação"
                  defaultValue={movimentacaoEditando?.responsavel ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="nova_localizacao"
                    placeholder="Nova localização da peça"
                    defaultValue={movimentacaoEditando?.nova_localizacao ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <select
                    name="novo_status_operacional"
                    defaultValue={movimentacaoEditando?.novo_status_operacional ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="">Selecione o novo status operacional</option>
                    {statusOperacionais.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  name="descricao"
                  placeholder="Descrição da movimentação"
                  defaultValue={movimentacaoEditando?.descricao ?? ''}
                  className="min-h-[110px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

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
                    {movimentacaoEditando ? 'Atualizar movimentação' : 'Salvar movimentação'}
                  </button>

                  <a
                    href="/centro-cultural/museu/movimentacoes"
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
                  Histórico de movimentações
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Consulte, filtre e acompanhe as movimentações do acervo.
                </p>
              </div>

              <form method="get" className="grid w-full max-w-5xl gap-2 md:grid-cols-4">
                <input
                  type="text"
                  name="busca"
                  placeholder="Buscar por peça, tombo, tipo, responsável, local ou status"
                  defaultValue={busca}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />

                <select
                  name="acervo_id"
                  defaultValue={acervoFiltro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todas as peças</option>
                  {pecas.map((peca) => (
                    <option key={peca.id} value={peca.id}>
                      {peca.nome}
                    </option>
                  ))}
                </select>

                <select
                  name="tipo"
                  defaultValue={tipoFiltro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todos os tipos</option>
                  {tiposMovimentacao.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
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

            {movimentacoes.length > 0 ? (
              <div className="mt-6 space-y-4">
                {movimentacoes.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {getPecaNome(item.acervo)}
                          </h3>
                          <p className="text-sm text-slate-600">
                            Tombo: {getPecaTombo(item.acervo)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                            {item.tipo || '-'}
                          </span>
                        </div>

                        <div className="text-sm text-slate-700 space-y-1">
                          <p>
                            <span className="font-semibold">Data:</span>{' '}
                            {formatarData(item.data_movimentacao)}
                          </p>
                          <p>
                            <span className="font-semibold">Responsável:</span>{' '}
                            {item.responsavel || '-'}
                          </p>
                          <p>
                            <span className="font-semibold">Nova localização:</span>{' '}
                            {item.nova_localizacao || '-'}
                          </p>
                          <p>
                            <span className="font-semibold">Novo status operacional:</span>{' '}
                            {getStatusOperacionalLabel(item.novo_status_operacional)}
                          </p>
                          <p>
                            <span className="font-semibold">Descrição:</span>{' '}
                            {item.descricao || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/centro-cultural/museu/movimentacoes?editar=${item.id}${
                            busca ? `&busca=${encodeURIComponent(busca)}` : ''
                          }${
                            acervoFiltro ? `&acervo_id=${encodeURIComponent(acervoFiltro)}` : ''
                          }${
                            tipoFiltro ? `&tipo=${encodeURIComponent(tipoFiltro)}` : ''
                          }`}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Editar
                        </a>

                        <form action={excluirMovimentacaoMuseu}>
                          <input type="hidden" name="id" value={item.id} />
                          <button
                            type="submit"
                            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                          >
                            Excluir
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhuma movimentação encontrada.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}