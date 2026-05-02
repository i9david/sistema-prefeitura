import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModuloBandaMunicipalNav } from '@/components/modulo-banda-municipal-nav'
import {
  criarApresentacao,
  atualizarApresentacao,
  salvarParticipantesApresentacao,
} from './actions'

type Apresentacao = {
  id: string
  titulo: string
  data_apresentacao: string
  horario: string | null
  local: string | null
  evento: string | null
  repertorio: string | null
  observacoes: string | null
  status: string
  created_at: string
}

type Musico = {
  id: string
  nome: string
  instrumento_principal: string
  status: string
}

type Participacao = {
  musico_id: string
  confirmado: boolean
  observacoes: string | null
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

function badgeClass(status: string) {
  switch (status) {
    case 'agendada':
      return 'bg-blue-100 text-blue-700'
    case 'realizada':
      return 'bg-green-100 text-green-700'
    case 'cancelada':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-slate-200 text-slate-700'
  }
}

export default async function BandaApresentacoesPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    busca?: string
    editar?: string
    novo?: string
    apresentacao_id?: string
    status?: string
  }>
}) {
  const params = await searchParams
  const busca = params.busca?.trim() || ''
  const editarId = params.editar?.trim() || ''
  const modoNovo = params.novo === '1'
  const apresentacaoIdSelecionada = params.apresentacao_id?.trim() || ''
  const statusFiltro = params.status?.trim() || ''

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let apresentacoesQuery = supabase
    .from('banda_municipal_apresentacoes')
    .select('*')
    .order('data_apresentacao', { ascending: false })

  if (busca) {
    apresentacoesQuery = apresentacoesQuery.or(`titulo.ilike.%${busca}%,local.ilike.%${busca}%,evento.ilike.%${busca}%`)
  }

  if (statusFiltro) {
    apresentacoesQuery = apresentacoesQuery.eq('status', statusFiltro)
  }

  const [
    { data: apresentacoesData, error: apresentacoesError },
    { data: musicosData, error: musicosError },
  ] = await Promise.all([
    apresentacoesQuery,
    supabase
      .from('banda_municipal_musicos')
      .select('id, nome, instrumento_principal, status')
      .eq('status', 'ativo')
      .order('nome', { ascending: true }),
  ])

  if (apresentacoesError) {
    redirect(`/banda-municipal/apresentacoes?message=${encodeURIComponent(apresentacoesError.message)}`)
  }

  if (musicosError) {
    redirect(`/banda-municipal/apresentacoes?message=${encodeURIComponent(musicosError.message)}`)
  }

  const apresentacoes = (apresentacoesData ?? []) as Apresentacao[]
  const musicos = (musicosData ?? []) as Musico[]

  const apresentacaoEditando = editarId
    ? apresentacoes.find((item) => item.id === editarId)
    : null

  const mostrarFormulario = modoNovo || !!apresentacaoEditando

  const apresentacaoSelecionada = apresentacaoIdSelecionada
    ? apresentacoes.find((item) => item.id === apresentacaoIdSelecionada)
    : null

  const { data: participantesData, error: participantesError } = apresentacaoSelecionada
    ? await supabase
        .from('banda_municipal_apresentacao_musicos')
        .select('musico_id, confirmado, observacoes')
        .eq('apresentacao_id', apresentacaoSelecionada.id)
    : { data: [], error: null as any }

  if (participantesError) {
    redirect(`/banda-municipal/apresentacoes?message=${encodeURIComponent(participantesError.message)}`)
  }

  const participantes = (participantesData ?? []) as Participacao[]

  function getConfirmado(musicoId: string) {
    return participantes.find((item) => item.musico_id === musicoId)?.confirmado ?? false
  }

  function getObservacao(musicoId: string) {
    return participantes.find((item) => item.musico_id === musicoId)?.observacoes || ''
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloBandaMunicipalNav currentPath="/banda-municipal/apresentacoes" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Apresentações
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Agenda e histórico de apresentações da Banda Municipal.
                </p>
              </div>

              {!mostrarFormulario && (
                <a
                  href="/banda-municipal/apresentacoes?novo=1"
                  className="inline-flex rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Nova apresentação
                </a>
              )}
            </div>
          </div>

          {mostrarFormulario && (
            <div className={cardClassName()}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900">
                  {apresentacaoEditando ? 'Editar apresentação' : 'Nova apresentação'}
                </h2>

                <a
                  href="/banda-municipal/apresentacoes"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Voltar para lista
                </a>
              </div>

              <form
                action={apresentacaoEditando ? atualizarApresentacao : criarApresentacao}
                className="mt-6 grid gap-4"
              >
                {apresentacaoEditando && (
                  <input type="hidden" name="id" value={apresentacaoEditando.id} />
                )}

                <input
                  name="titulo"
                  placeholder="Título da apresentação"
                  required
                  defaultValue={apresentacaoEditando?.titulo ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="data_apresentacao"
                    type="date"
                    required
                    defaultValue={apresentacaoEditando?.data_apresentacao ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <input
                    name="horario"
                    placeholder="Horário"
                    defaultValue={apresentacaoEditando?.horario ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="local"
                    placeholder="Local"
                    defaultValue={apresentacaoEditando?.local ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <input
                    name="evento"
                    placeholder="Evento"
                    defaultValue={apresentacaoEditando?.evento ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <textarea
                  name="repertorio"
                  placeholder="Repertório"
                  defaultValue={apresentacaoEditando?.repertorio ?? ''}
                  className="min-h-[110px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <textarea
                  name="observacoes"
                  placeholder="Observações"
                  defaultValue={apresentacaoEditando?.observacoes ?? ''}
                  className="min-h-[110px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <select
                  name="status"
                  required
                  defaultValue={apresentacaoEditando?.status ?? 'agendada'}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                >
                  <option value="agendada">Agendada</option>
                  <option value="realizada">Realizada</option>
                  <option value="cancelada">Cancelada</option>
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
                    {apresentacaoEditando ? 'Atualizar apresentação' : 'Salvar apresentação'}
                  </button>

                  <a
                    href="/banda-municipal/apresentacoes"
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
                  Lista de apresentações
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Agenda oficial e histórico da Banda Municipal
                </p>
              </div>

              <form method="get" className="grid w-full max-w-4xl gap-2 md:grid-cols-3">
                <input
                  type="text"
                  name="busca"
                  placeholder="Buscar por título, local ou evento"
                  defaultValue={busca}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />

                <select
                  name="status"
                  defaultValue={statusFiltro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todos os status</option>
                  <option value="agendada">Agendada</option>
                  <option value="realizada">Realizada</option>
                  <option value="cancelada">Cancelada</option>
                </select>

                <button
                  type="submit"
                  className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
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

            {apresentacoes.length > 0 ? (
              <div className="mt-6 space-y-4">
                {apresentacoes.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {item.titulo}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {formatarData(item.data_apresentacao)}
                            {item.horario ? ` • ${item.horario}` : ''}
                          </p>
                          <p className="text-sm text-slate-600">
                            Local: {item.local || '-'}
                          </p>
                          <p className="text-sm text-slate-600">
                            Evento: {item.evento || '-'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(item.status)}`}>
                            {item.status}
                          </span>
                        </div>

                        <div className="text-sm text-slate-700">
                          <p>
                            <span className="font-semibold">Repertório:</span>{' '}
                            {item.repertorio || '-'}
                          </p>
                          <p>
                            <span className="font-semibold">Observações:</span>{' '}
                            {item.observacoes || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/banda-municipal/apresentacoes?editar=${item.id}${
                            busca ? `&busca=${encodeURIComponent(busca)}` : ''
                          }${
                            statusFiltro ? `&status=${encodeURIComponent(statusFiltro)}` : ''
                          }`}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Editar
                        </a>

                        <a
                          href={`/banda-municipal/apresentacoes?apresentacao_id=${item.id}`}
                          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                        >
                          Participantes
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhuma apresentação encontrada.
              </p>
            )}
          </div>

          {apresentacaoSelecionada && (
            <div className={cardClassName()}>
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-slate-900">
                  Participantes da apresentação
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {apresentacaoSelecionada.titulo} • {formatarData(apresentacaoSelecionada.data_apresentacao)}
                </p>
              </div>

              {musicos.length > 0 ? (
                <form action={salvarParticipantesApresentacao} className="space-y-4">
                  <input type="hidden" name="apresentacao_id" value={apresentacaoSelecionada.id} />

                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50">
                          <th className="px-4 py-3 text-left">Músico</th>
                          <th className="px-4 py-3 text-left">Instrumento</th>
                          <th className="px-4 py-3 text-left">Confirmado</th>
                          <th className="px-4 py-3 text-left">Observação</th>
                        </tr>
                      </thead>

                      <tbody>
                        {musicos.map((musico) => (
                          <tr key={musico.id} className="border-b">
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {musico.nome}
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              {musico.instrumento_principal}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                name={`confirmado_${musico.id}`}
                                defaultValue={getConfirmado(musico.id) ? '1' : '0'}
                                className="w-full rounded-xl border px-3 py-2"
                              >
                                <option value="0">Não</option>
                                <option value="1">Sim</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                name={`observacoes_${musico.id}`}
                                defaultValue={getObservacao(musico.id)}
                                placeholder="Observação"
                                className="w-full rounded-xl border px-3 py-2"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="rounded-2xl bg-green-600 px-6 py-3 text-white"
                    >
                      Salvar participantes
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-slate-600">
                  Nenhum músico ativo encontrado.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}