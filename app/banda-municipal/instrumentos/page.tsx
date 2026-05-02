import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModuloBandaMunicipalNav } from '@/components/modulo-banda-municipal-nav'
import {
  criarInstrumento,
  atualizarInstrumento,
} from './actions'

type Musico = {
  id: string
  nome: string
  status: string
}

type Instrumento = {
  id: string
  nome: string
  tipo: string
  marca: string | null
  modelo: string | null
  numero_patrimonio: string | null
  numero_serie: string | null
  estado_conservacao: string
  status: string
  musico_id: string | null
  data_aquisicao: string | null
  observacoes: string | null
  created_at: string
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

function estadoBadgeClass(estado: string) {
  switch (estado) {
    case 'otimo':
      return 'bg-green-100 text-green-700'
    case 'bom':
      return 'bg-emerald-100 text-emerald-700'
    case 'regular':
      return 'bg-amber-100 text-amber-700'
    case 'manutencao':
      return 'bg-orange-100 text-orange-700'
    case 'inservivel':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-slate-200 text-slate-700'
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'disponivel':
      return 'bg-green-100 text-green-700'
    case 'em_uso':
      return 'bg-blue-100 text-blue-700'
    case 'manutencao':
      return 'bg-orange-100 text-orange-700'
    case 'baixado':
      return 'bg-slate-200 text-slate-700'
    default:
      return 'bg-slate-200 text-slate-700'
  }
}

export default async function BandaInstrumentosPage({
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

  const [{ data: instrumentosData, error }, { data: musicosData, error: erroMusicos }] =
    await Promise.all([
      (() => {
        let query = supabase
          .from('banda_municipal_instrumentos')
          .select('*')
          .order('created_at', { ascending: false })

        if (busca) {
          query = query.or(`nome.ilike.%${busca}%,tipo.ilike.%${busca}%,marca.ilike.%${busca}%`)
        }

        if (statusFiltro) {
          query = query.eq('status', statusFiltro)
        }

        return query
      })(),
      supabase
        .from('banda_municipal_musicos')
        .select('id, nome, status')
        .eq('status', 'ativo')
        .order('nome', { ascending: true }),
    ])

  if (error) {
    redirect(`/banda-municipal/instrumentos?message=${encodeURIComponent(error.message)}`)
  }

  if (erroMusicos) {
    redirect(`/banda-municipal/instrumentos?message=${encodeURIComponent(erroMusicos.message)}`)
  }

  const instrumentos = (instrumentosData ?? []) as Instrumento[]
  const musicos = (musicosData ?? []) as Musico[]

  const instrumentoEditando = editarId
    ? instrumentos.find((instrumento) => instrumento.id === editarId)
    : null

  const mostrarFormulario = modoNovo || !!instrumentoEditando

  function getNomeMusico(musicoId: string | null) {
    if (!musicoId) return '-'
    return musicos.find((musico) => musico.id === musicoId)?.nome || '-'
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloBandaMunicipalNav currentPath="/banda-municipal/instrumentos" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Instrumentos
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Controle patrimonial e operacional dos instrumentos.
                </p>
              </div>

              {!mostrarFormulario && (
                <a
                  href="/banda-municipal/instrumentos?novo=1"
                  className="inline-flex rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Novo instrumento
                </a>
              )}
            </div>
          </div>

          {mostrarFormulario && (
            <div className={cardClassName()}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900">
                  {instrumentoEditando ? 'Editar instrumento' : 'Novo instrumento'}
                </h2>

                <a
                  href="/banda-municipal/instrumentos"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Voltar para lista
                </a>
              </div>

              <form
                action={instrumentoEditando ? atualizarInstrumento : criarInstrumento}
                className="mt-6 grid gap-4"
              >
                {instrumentoEditando && (
                  <input type="hidden" name="id" value={instrumentoEditando.id} />
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="nome"
                    placeholder="Nome do instrumento"
                    required
                    defaultValue={instrumentoEditando?.nome ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <input
                    name="tipo"
                    placeholder="Tipo do instrumento"
                    required
                    defaultValue={instrumentoEditando?.tipo ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="marca"
                    placeholder="Marca"
                    defaultValue={instrumentoEditando?.marca ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <input
                    name="modelo"
                    placeholder="Modelo"
                    defaultValue={instrumentoEditando?.modelo ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="numero_patrimonio"
                    placeholder="Número de patrimônio"
                    defaultValue={instrumentoEditando?.numero_patrimonio ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <input
                    name="numero_serie"
                    placeholder="Número de série"
                    defaultValue={instrumentoEditando?.numero_serie ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <select
                    name="estado_conservacao"
                    required
                    defaultValue={instrumentoEditando?.estado_conservacao ?? 'bom'}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="otimo">Ótimo</option>
                    <option value="bom">Bom</option>
                    <option value="regular">Regular</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="inservivel">Inservível</option>
                  </select>

                  <select
                    name="status"
                    required
                    defaultValue={instrumentoEditando?.status ?? 'disponivel'}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="em_uso">Em uso</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="baixado">Baixado</option>
                  </select>

                  <select
                    name="musico_id"
                    defaultValue={instrumentoEditando?.musico_id ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="">Sem responsável</option>
                    {musicos.map((musico) => (
                      <option key={musico.id} value={musico.id}>
                        {musico.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  name="data_aquisicao"
                  type="date"
                  defaultValue={instrumentoEditando?.data_aquisicao ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <textarea
                  name="observacoes"
                  placeholder="Observações"
                  defaultValue={instrumentoEditando?.observacoes ?? ''}
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
                    {instrumentoEditando ? 'Atualizar instrumento' : 'Salvar instrumento'}
                  </button>

                  <a
                    href="/banda-municipal/instrumentos"
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
                  Lista de instrumentos
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Controle de patrimônio, estado e responsável atual
                </p>
              </div>

              <form method="get" className="grid w-full max-w-4xl gap-2 md:grid-cols-3">
                <input
                  type="text"
                  name="busca"
                  placeholder="Buscar por nome, tipo ou marca"
                  defaultValue={busca}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />

                <select
                  name="status"
                  defaultValue={statusFiltro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todos os status</option>
                  <option value="disponivel">Disponível</option>
                  <option value="em_uso">Em uso</option>
                  <option value="manutencao">Manutenção</option>
                  <option value="baixado">Baixado</option>
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

            {instrumentos.length > 0 ? (
              <div className="mt-6 space-y-4">
                {instrumentos.map((instrumento) => (
                  <div
                    key={instrumento.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {instrumento.nome}
                          </h3>
                          <p className="text-sm text-slate-600">
                            Tipo: {instrumento.tipo}
                          </p>
                          <p className="text-sm text-slate-600">
                            Marca/Modelo: {[instrumento.marca, instrumento.modelo].filter(Boolean).join(' / ') || '-'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(instrumento.status)}`}>
                            {instrumento.status}
                          </span>

                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${estadoBadgeClass(instrumento.estado_conservacao)}`}>
                            {instrumento.estado_conservacao}
                          </span>
                        </div>

                        <div className="text-sm text-slate-700">
                          <p>
                            <span className="font-semibold">Patrimônio:</span>{' '}
                            {instrumento.numero_patrimonio || '-'}
                          </p>
                          <p>
                            <span className="font-semibold">Série:</span>{' '}
                            {instrumento.numero_serie || '-'}
                          </p>
                          <p>
                            <span className="font-semibold">Responsável:</span>{' '}
                            {getNomeMusico(instrumento.musico_id)}
                          </p>
                          <p>
                            <span className="font-semibold">Aquisição:</span>{' '}
                            {formatarData(instrumento.data_aquisicao)}
                          </p>
                          <p>
                            <span className="font-semibold">Observações:</span>{' '}
                            {instrumento.observacoes || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/banda-municipal/instrumentos?editar=${instrumento.id}${
                            busca ? `&busca=${encodeURIComponent(busca)}` : ''
                          }${
                            statusFiltro ? `&status=${encodeURIComponent(statusFiltro)}` : ''
                          }`}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Editar
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhum instrumento encontrado.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}