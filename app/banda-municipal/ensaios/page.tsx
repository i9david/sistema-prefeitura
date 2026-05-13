import { redirect } from 'next/navigation'
import { Calendar, Plus } from 'lucide-react'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuleCard } from '@/components/module/module-card'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuloBandaMunicipalNav } from '@/components/modulo-banda-municipal-nav'
import {
  criarEnsaio,
  atualizarEnsaio,
  salvarPresencasEnsaio,
} from './actions'

type Ensaio = {
  id: string
  titulo: string
  data_ensaio: string
  horario_inicio: string
  horario_fim: string | null
  local: string | null
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

type Presenca = {
  musico_id: string
  status: string
  observacoes: string | null
}

function formatarData(data: string | null | undefined) {
  if (!data) return '-'
  const partes = data.split('-')
  if (partes.length !== 3) return data
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function badgeClass(status: string) {
  switch (status) {
    case 'agendado':
      return 'bg-blue-100 text-blue-700'
    case 'realizado':
      return 'bg-green-100 text-green-700'
    case 'cancelado':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-slate-200 text-slate-700'
  }
}

export default async function BandaEnsaiosPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    busca?: string
    editar?: string
    novo?: string
    ensaio_id?: string
    status?: string
  }>
}) {
  const params = await searchParams
  const busca = params.busca?.trim() || ''
  const editarId = params.editar?.trim() || ''
  const modoNovo = params.novo === '1'
  const ensaioIdSelecionado = params.ensaio_id?.trim() || ''
  const statusFiltro = params.status?.trim() || ''

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let ensaiosQuery = supabase
    .from('banda_municipal_ensaios')
    .select('*')
    .order('data_ensaio', { ascending: false })
    .order('horario_inicio', { ascending: false })

  if (busca) {
    ensaiosQuery = ensaiosQuery.or(`titulo.ilike.%${busca}%,local.ilike.%${busca}%`)
  }

  if (statusFiltro) {
    ensaiosQuery = ensaiosQuery.eq('status', statusFiltro)
  }

  const [
    { data: ensaiosData, error: ensaiosError },
    { data: musicosData, error: musicosError },
  ] = await Promise.all([
    ensaiosQuery,
    supabase
      .from('banda_municipal_musicos')
      .select('id, nome, instrumento_principal, status')
      .eq('status', 'ativo')
      .order('nome', { ascending: true }),
  ])

  if (ensaiosError) {
    redirect(`/banda-municipal/ensaios?message=${encodeURIComponent(ensaiosError.message)}`)
  }

  if (musicosError) {
    redirect(`/banda-municipal/ensaios?message=${encodeURIComponent(musicosError.message)}`)
  }

  const ensaios = (ensaiosData ?? []) as Ensaio[]
  const musicos = (musicosData ?? []) as Musico[]

  const ensaioEditando = editarId
    ? ensaios.find((ensaio) => ensaio.id === editarId)
    : null

  const mostrarFormulario = modoNovo || !!ensaioEditando

  const ensaioSelecionado = ensaioIdSelecionado
    ? ensaios.find((ensaio) => ensaio.id === ensaioIdSelecionado)
    : null

  const { data: presencasData, error: presencasError } = ensaioSelecionado
    ? await supabase
        .from('banda_municipal_ensaio_presencas')
        .select('musico_id, status, observacoes')
        .eq('ensaio_id', ensaioSelecionado.id)
    : { data: [], error: null as any }

  if (presencasError) {
    redirect(`/banda-municipal/ensaios?message=${encodeURIComponent(presencasError.message)}`)
  }

  const presencas = (presencasData ?? []) as Presenca[]

  function getStatusMusico(musicoId: string) {
    return presencas.find((item) => item.musico_id === musicoId)?.status || ''
  }

  function getObservacaoMusico(musicoId: string) {
    return presencas.find((item) => item.musico_id === musicoId)?.observacoes || ''
  }

  return (
    <ModuleLayout sidebar={<ModuloBandaMunicipalNav currentPath="/banda-municipal/ensaios" />}>
      <ModuleHeader
        title="Ensaios"
        eyebrow="Operação"
        description="Organização dos ensaios e frequência da banda."
        icon={Calendar}
        accent="violet"
        context="Agenda musical"
        action={
          !mostrarFormulario ? (
            <a href="/banda-municipal/ensaios?novo=1" className="btn-primary w-full justify-center md:w-auto">
              <Plus size={16} aria-hidden="true" />
              Novo ensaio
            </a>
          ) : null
        }
      />

          {mostrarFormulario && (
            <ModuleCard>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900">
                  {ensaioEditando ? 'Editar ensaio' : 'Novo ensaio'}
                </h2>

                <a
                  href="/banda-municipal/ensaios"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Voltar para lista
                </a>
              </div>

              <form
                action={ensaioEditando ? atualizarEnsaio : criarEnsaio}
                className="mt-6 grid gap-4"
              >
                {ensaioEditando && (
                  <input type="hidden" name="id" value={ensaioEditando.id} />
                )}

                <input
                  name="titulo"
                  placeholder="Título do ensaio"
                  required
                  defaultValue={ensaioEditando?.titulo ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <input
                    name="data_ensaio"
                    type="date"
                    required
                    defaultValue={ensaioEditando?.data_ensaio ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <input
                    name="horario_inicio"
                    type="time"
                    required
                    defaultValue={ensaioEditando?.horario_inicio ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <input
                    name="horario_fim"
                    type="time"
                    defaultValue={ensaioEditando?.horario_fim ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <input
                  name="local"
                  placeholder="Local do ensaio"
                  defaultValue={ensaioEditando?.local ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <textarea
                  name="repertorio"
                  placeholder="Repertório"
                  defaultValue={ensaioEditando?.repertorio ?? ''}
                  className="min-h-[110px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <textarea
                  name="observacoes"
                  placeholder="Observações"
                  defaultValue={ensaioEditando?.observacoes ?? ''}
                  className="min-h-[110px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <select
                  name="status"
                  required
                  defaultValue={ensaioEditando?.status ?? 'agendado'}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                >
                  <option value="agendado">Agendado</option>
                  <option value="realizado">Realizado</option>
                  <option value="cancelado">Cancelado</option>
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
                    {ensaioEditando ? 'Atualizar ensaio' : 'Salvar ensaio'}
                  </button>

                  <a
                    href="/banda-municipal/ensaios"
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
                  Lista de ensaios
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Agenda, histórico e chamada dos ensaios
                </p>
              </div>

              <form method="get" className="grid w-full max-w-4xl gap-2 md:grid-cols-3">
                <input
                  type="text"
                  name="busca"
                  placeholder="Buscar por título ou local"
                  defaultValue={busca}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />

                <select
                  name="status"
                  defaultValue={statusFiltro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todos os status</option>
                  <option value="agendado">Agendado</option>
                  <option value="realizado">Realizado</option>
                  <option value="cancelado">Cancelado</option>
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

            {ensaios.length > 0 ? (
              <div className="mt-6 space-y-4">
                {ensaios.map((ensaio) => (
                  <div
                    key={ensaio.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {ensaio.titulo}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {formatarData(ensaio.data_ensaio)}  {ensaio.horario_inicio}
                            {ensaio.horario_fim ? ` às ${ensaio.horario_fim}` : ''}
                          </p>
                          <p className="text-sm text-slate-600">
                            Local: {ensaio.local || '-'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(ensaio.status)}`}>
                            {ensaio.status}
                          </span>
                        </div>

                        <div className="text-sm text-slate-700">
                          <p>
                            <span className="font-semibold">Repertório:</span>{' '}
                            {ensaio.repertorio || '-'}
                          </p>
                          <p>
                            <span className="font-semibold">Observações:</span>{' '}
                            {ensaio.observacoes || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/banda-municipal/ensaios?editar=${ensaio.id}${
                            busca ? `&busca=${encodeURIComponent(busca)}` : ''
                          }${
                            statusFiltro ? `&status=${encodeURIComponent(statusFiltro)}` : ''
                          }`}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Editar
                        </a>

                        <a
                          href={`/banda-municipal/ensaios?ensaio_id=${ensaio.id}`}
                          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                        >
                          Chamada
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhum ensaio encontrado.
              </p>
            )}
          </ModuleCard>

          {ensaioSelecionado && (
            <ModuleCard>
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-slate-900">
                  Chamada do ensaio
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {ensaioSelecionado.titulo}  {formatarData(ensaioSelecionado.data_ensaio)}
                </p>
              </div>

              {musicos.length > 0 ? (
                <form action={salvarPresencasEnsaio} className="space-y-4">
                  <input type="hidden" name="ensaio_id" value={ensaioSelecionado.id} />

                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50">
                          <th className="px-4 py-3 text-left">Músico</th>
                          <th className="px-4 py-3 text-left">Instrumento</th>
                          <th className="px-4 py-3 text-left">Presença</th>
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
                                name={`status_${musico.id}`}
                                defaultValue={getStatusMusico(musico.id)}
                                className="w-full rounded-xl border px-3 py-2"
                              >
                                <option value="">Selecione</option>
                                <option value="presente">Presente</option>
                                <option value="faltou">Faltou</option>
                                <option value="justificado">Justificado</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                name={`observacoes_${musico.id}`}
                                defaultValue={getObservacaoMusico(musico.id)}
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
                      Salvar chamada
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-slate-600">
                  Nenhum músico ativo encontrado.
                </p>
              )}
            </ModuleCard>
          )}
    </ModuleLayout>
  )
}
