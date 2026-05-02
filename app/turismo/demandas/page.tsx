import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModuloTurismoNav } from '@/components/modulo-turismo-nav'
import {
  atualizarDemandaTurismo,
  concluirDemandaTurismo,
  criarDemandaTurismo,
  reabrirDemandaTurismo,
} from './actions'

type PontoTuristico = {
  id: string
  nome: string
  status: string | null
}

type PontoRelacionado =
  | { id: string; nome: string }
  | { id: string; nome: string }[]
  | null

type Demanda = {
  id: string
  ponto_id: string | null
  titulo: string
  descricao: string | null
  prioridade: string | null
  status: string | null
  responsavel: string | null
  prazo: string | null
  created_at: string | null
  pontos: PontoRelacionado
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function getPontoNome(ponto: PontoRelacionado) {
  if (!ponto) return 'Sem ponto vinculado'
  if (Array.isArray(ponto)) return ponto[0]?.nome ?? 'Sem ponto vinculado'
  return ponto.nome
}

function formatarData(data: string | null | undefined) {
  if (!data) return '-'
  const somenteData = data.slice(0, 10)
  const partes = somenteData.split('-')
  if (partes.length !== 3) return data
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function prioridadeLabel(valor: string | null | undefined) {
  if (valor === 'baixa') return 'Baixa'
  if (valor === 'media') return 'Média'
  if (valor === 'alta') return 'Alta'
  if (valor === 'urgente') return 'Urgente'
  return valor || '-'
}

function prioridadeClassName(valor: string | null | undefined) {
  if (valor === 'baixa') return 'bg-slate-200 text-slate-700'
  if (valor === 'media') return 'bg-blue-100 text-blue-700'
  if (valor === 'alta') return 'bg-amber-100 text-amber-700'
  if (valor === 'urgente') return 'bg-red-100 text-red-700'
  return 'bg-slate-200 text-slate-700'
}

function statusLabel(valor: string | null | undefined) {
  if (valor === 'pendente') return 'Pendente'
  if (valor === 'em_andamento') return 'Em andamento'
  if (valor === 'concluida') return 'Concluída'
  if (valor === 'cancelada') return 'Cancelada'
  return valor || '-'
}

function statusClassName(valor: string | null | undefined) {
  if (valor === 'pendente') return 'bg-amber-100 text-amber-700'
  if (valor === 'em_andamento') return 'bg-blue-100 text-blue-700'
  if (valor === 'concluida') return 'bg-green-100 text-green-700'
  if (valor === 'cancelada') return 'bg-red-100 text-red-700'
  return 'bg-slate-200 text-slate-700'
}

export default async function TurismoDemandasPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    busca?: string
    novo?: string
    editar?: string
    status?: string
    prioridade?: string
    ponto_id?: string
  }>
}) {
  const params = await searchParams
  const busca = params.busca?.trim() || ''
  const modoNovo = params.novo === '1'
  const editarId = params.editar?.trim() || ''
  const statusFiltro = params.status?.trim() || ''
  const prioridadeFiltro = params.prioridade?.trim() || ''
  const pontoFiltro = params.ponto_id?.trim() || ''

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: pontosData, error: pontosError } = await supabase
    .from('turismo_pontos')
    .select('id, nome, status')
    .order('nome', { ascending: true })

  if (pontosError) {
    redirect(`/turismo/demandas?message=${encodeURIComponent(pontosError.message)}`)
  }

  let demandasQuery = supabase
    .from('turismo_demandas')
    .select(`
      id,
      ponto_id,
      titulo,
      descricao,
      prioridade,
      status,
      responsavel,
      prazo,
      created_at,
      pontos:turismo_pontos (
        id,
        nome
      )
    `)
    .order('created_at', { ascending: false })

  if (busca) {
    demandasQuery = demandasQuery.or(
      `titulo.ilike.%${busca}%,descricao.ilike.%${busca}%,responsavel.ilike.%${busca}%`
    )
  }

  if (statusFiltro) {
    demandasQuery = demandasQuery.eq('status', statusFiltro)
  }

  if (prioridadeFiltro) {
    demandasQuery = demandasQuery.eq('prioridade', prioridadeFiltro)
  }

  if (pontoFiltro) {
    demandasQuery = demandasQuery.eq('ponto_id', pontoFiltro)
  }

  const { data: demandasData, error: demandasError } = await demandasQuery

  if (demandasError) {
    redirect(`/turismo/demandas?message=${encodeURIComponent(demandasError.message)}`)
  }

  const pontos = (pontosData ?? []) as PontoTuristico[]
  const demandas = (demandasData ?? []) as Demanda[]

  const demandaEditando = editarId
    ? demandas.find((demanda) => demanda.id === editarId)
    : null

  const mostrarFormulario = modoNovo || !!demandaEditando

  const totalPendentes = demandas.filter((item) => item.status === 'pendente').length
  const totalAndamento = demandas.filter((item) => item.status === 'em_andamento').length
  const totalConcluidas = demandas.filter((item) => item.status === 'concluida').length
  const totalUrgentes = demandas.filter((item) => item.prioridade === 'urgente').length

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloTurismoNav currentPath="/turismo/demandas" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Demandas do Turismo
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Controle de melhorias, sinalização, limpeza, acesso, infraestrutura e ações ligadas aos pontos turísticos.
                </p>
              </div>

              {!mostrarFormulario && (
                <a
                  href="/turismo/demandas?novo=1"
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Nova demanda
                </a>
              )}
            </div>
          </div>

          {mostrarFormulario && (
            <div className={cardClassName()}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    {demandaEditando ? 'Editar demanda' : 'Nova demanda'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Registre uma necessidade ou melhoria relacionada ao turismo.
                  </p>
                </div>

                <a
                  href="/turismo/demandas"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Voltar para lista
                </a>
              </div>

              <form
                action={demandaEditando ? atualizarDemandaTurismo : criarDemandaTurismo}
                className="mt-6 grid gap-4"
              >
                {demandaEditando && (
                  <input type="hidden" name="id" value={demandaEditando.id} />
                )}

                <input
                  name="titulo"
                  placeholder="Título da demanda"
                  required
                  defaultValue={demandaEditando?.titulo ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <select
                  name="ponto_id"
                  defaultValue={demandaEditando?.ponto_id ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                >
                  <option value="">Sem ponto vinculado</option>
                  {pontos
                    .filter((ponto) => ponto.status !== 'inativo')
                    .map((ponto) => (
                      <option key={ponto.id} value={ponto.id}>
                        {ponto.nome}
                      </option>
                    ))}
                </select>

                <textarea
                  name="descricao"
                  placeholder="Descrição da demanda"
                  defaultValue={demandaEditando?.descricao ?? ''}
                  className="min-h-[120px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    name="prioridade"
                    defaultValue={demandaEditando?.prioridade ?? 'media'}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>

                  <select
                    name="status"
                    defaultValue={demandaEditando?.status ?? 'pendente'}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="em_andamento">Em andamento</option>
                    <option value="concluida">Concluída</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="responsavel"
                    placeholder="Responsável"
                    defaultValue={demandaEditando?.responsavel ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <input
                    name="prazo"
                    type="date"
                    defaultValue={demandaEditando?.prazo ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                {params.message && (
                  <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    {params.message}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    {demandaEditando ? 'Atualizar demanda' : 'Salvar demanda'}
                  </button>

                  <a
                    href="/turismo/demandas"
                    className="rounded-2xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancelar
                  </a>
                </div>
              </form>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Pendentes</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalPendentes}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Em andamento</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalAndamento}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Concluídas</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalConcluidas}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Urgentes</p>
              <p className="mt-2 text-2xl font-bold text-red-700">
                {totalUrgentes}
              </p>
            </div>
          </div>

          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Lista de demandas
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Busque, filtre, edite e acompanhe o andamento das demandas.
                </p>
              </div>

              <form method="get" className="grid w-full max-w-6xl gap-2 md:grid-cols-5">
                <input
                  name="busca"
                  defaultValue={busca}
                  placeholder="Buscar demanda"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />

                <select
                  name="ponto_id"
                  defaultValue={pontoFiltro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todos os pontos</option>
                  {pontos.map((ponto) => (
                    <option key={ponto.id} value={ponto.id}>
                      {ponto.nome}
                    </option>
                  ))}
                </select>

                <select
                  name="prioridade"
                  defaultValue={prioridadeFiltro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todas prioridades</option>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>

                <select
                  name="status"
                  defaultValue={statusFiltro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todos status</option>
                  <option value="pendente">Pendente</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="concluida">Concluída</option>
                  <option value="cancelada">Cancelada</option>
                </select>

                <button
                  type="submit"
                  className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
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

            {demandas.length > 0 ? (
              <div className="mt-6 space-y-4">
                {demandas.map((demanda) => (
                  <div
                    key={demanda.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {demanda.titulo}
                          </h3>
                          <p className="text-sm text-slate-600">
                            Ponto turístico: {getPontoNome(demanda.pontos)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${prioridadeClassName(
                              demanda.prioridade
                            )}`}
                          >
                            {prioridadeLabel(demanda.prioridade)}
                          </span>

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(
                              demanda.status
                            )}`}
                          >
                            {statusLabel(demanda.status)}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-slate-700">
                          <p>
                            <span className="font-semibold">Responsável:</span>{' '}
                            {demanda.responsavel || '-'}
                          </p>
                          <p>
                            <span className="font-semibold">Prazo:</span>{' '}
                            {formatarData(demanda.prazo)}
                          </p>
                          <p>
                            <span className="font-semibold">Descrição:</span>{' '}
                            {demanda.descricao || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/turismo/demandas?editar=${demanda.id}`}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Editar
                        </a>

                        {demanda.status !== 'concluida' ? (
                          <form action={concluirDemandaTurismo}>
                            <input type="hidden" name="id" value={demanda.id} />
                            <button
                              type="submit"
                              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                            >
                              Concluir
                            </button>
                          </form>
                        ) : (
                          <form action={reabrirDemandaTurismo}>
                            <input type="hidden" name="id" value={demanda.id} />
                            <button
                              type="submit"
                              className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
                            >
                              Reabrir
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
                Nenhuma demanda encontrada.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}