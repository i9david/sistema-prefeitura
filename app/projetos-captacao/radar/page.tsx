import { redirect } from 'next/navigation'
import { ExternalLink, Radar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ModuloCaptacaoNav } from '@/components/modulo-captacao-nav'
import {
  aprovarCapturaRadar,
  ignorarCapturaRadar,
  reabrirCapturaRadar,
  ativarFonteRadar,
  inativarFonteRadar,
} from './actions'

type FonteRadar = {
  id: string
  nome: string
  orgao: string | null
  esfera: string | null
  area: string | null
  url_monitoramento: string
  status: string | null
  ultima_verificacao: string | null
  observacoes: string | null
  created_at: string | null
}

type CapturaRadar = {
  id: string
  fonte_id: string | null
  titulo: string
  orgao: string | null
  esfera: string | null
  area: string | null
  link_oficial: string | null
  resumo: string | null
  prazo_inscricao: string | null
  status: string | null
  hash_unico: string | null
  created_at: string | null
  fontes?: {
    id: string
    nome: string
    orgao: string | null
  } | null
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function formatarData(data: string | null | undefined) {
  if (!data) return '-'

  const somenteData = data.slice(0, 10)
  const partes = somenteData.split('-')

  if (partes.length !== 3) return data

  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function formatarDataHora(data: string | null | undefined) {
  if (!data) return '-'

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data))
}

function statusCapturaLabel(status: string | null | undefined) {
  if (status === 'aguardando_revisao') return 'Aguardando revisão'
  if (status === 'aprovada') return 'Aprovada'
  if (status === 'ignorada') return 'Ignorada'
  return status || '-'
}

function statusCapturaClassName(status: string | null | undefined) {
  if (status === 'aguardando_revisao') return 'bg-amber-100 text-amber-700'
  if (status === 'aprovada') return 'bg-green-100 text-green-700'
  if (status === 'ignorada') return 'bg-slate-200 text-slate-700'
  return 'bg-slate-200 text-slate-700'
}

function statusFonteLabel(status: string | null | undefined) {
  if (status === 'ativa') return 'Ativa'
  if (status === 'inativa') return 'Inativa'
  return status || '-'
}

function statusFonteClassName(status: string | null | undefined) {
  if (status === 'ativa') return 'bg-green-100 text-green-700'
  if (status === 'inativa') return 'bg-red-100 text-red-700'
  return 'bg-slate-200 text-slate-700'
}

function prazoClassName(data: string | null | undefined) {
  if (!data) return 'bg-slate-200 text-slate-700'

  const hoje = new Date()
  const prazo = new Date(`${data}T23:59:59`)
  const diff = prazo.getTime() - hoje.getTime()
  const dias = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (dias < 0) return 'bg-red-100 text-red-700'
  if (dias <= 7) return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}

function prazoLabel(data: string | null | undefined) {
  if (!data) return 'Sem prazo'

  const hoje = new Date()
  const prazo = new Date(`${data}T23:59:59`)
  const diff = prazo.getTime() - hoje.getTime()
  const dias = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (dias < 0) return 'Prazo encerrado'
  if (dias === 0) return 'Encerra hoje'
  if (dias === 1) return 'Encerra amanhã'

  return `${dias} dias restantes`
}

export default async function RadarAutomaticoPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    status?: string
    fonte_id?: string
    esfera?: string
    area?: string
    busca?: string
  }>
}) {
  const params = await searchParams

  const statusFiltro = params.status?.trim() || ''
  const fonteFiltro = params.fonte_id?.trim() || ''
  const esferaFiltro = params.esfera?.trim() || ''
  const areaFiltro = params.area?.trim() || ''
  const busca = params.busca?.trim() || ''

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: fontesData, error: fontesError } = await supabase
    .from('captacao_radar_fontes')
    .select(`
      id,
      nome,
      orgao,
      esfera,
      area,
      url_monitoramento,
      status,
      ultima_verificacao,
      observacoes,
      created_at
    `)
    .order('nome', { ascending: true })

  if (fontesError) {
    redirect(`/projetos-captacao/radar?message=${encodeURIComponent(fontesError.message)}`)
  }

  let capturasQuery = supabase
    .from('captacao_radar_capturas')
    .select(`
      id,
      fonte_id,
      titulo,
      orgao,
      esfera,
      area,
      link_oficial,
      resumo,
      prazo_inscricao,
      status,
      hash_unico,
      created_at,
      fontes:captacao_radar_fontes (
        id,
        nome,
        orgao
      )
    `)
    .order('created_at', { ascending: false })

  if (statusFiltro) {
    capturasQuery = capturasQuery.eq('status', statusFiltro)
  }

  if (fonteFiltro) {
    capturasQuery = capturasQuery.eq('fonte_id', fonteFiltro)
  }

  if (esferaFiltro) {
    capturasQuery = capturasQuery.eq('esfera', esferaFiltro)
  }

  if (areaFiltro) {
    capturasQuery = capturasQuery.eq('area', areaFiltro)
  }

  if (busca) {
    capturasQuery = capturasQuery.or(
      `titulo.ilike.%${busca}%,orgao.ilike.%${busca}%,resumo.ilike.%${busca}%`
    )
  }

  const { data: capturasData, error: capturasError } = await capturasQuery

  if (capturasError) {
    redirect(`/projetos-captacao/radar?message=${encodeURIComponent(capturasError.message)}`)
  }

  const fontes = (fontesData ?? []) as FonteRadar[]
  const capturas = (capturasData ?? []) as unknown as CapturaRadar[]

  const fontesAtivas = fontes.filter((item) => item.status === 'ativa').length
  const aguardandoRevisao = capturas.filter((item) => item.status === 'aguardando_revisao').length
  const aprovadas = capturas.filter((item) => item.status === 'aprovada').length
  const ignoradas = capturas.filter((item) => item.status === 'ignorada').length

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCaptacaoNav currentPath="/projetos-captacao/radar" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Radar Automático
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Monitore fontes oficiais, revise oportunidades capturadas e aprove apenas o que for útil para a carteira de projetos.
                </p>
              </div>

              <div className="rounded-3xl bg-violet-50 p-4 text-violet-700">
                <Radar size={34} />
              </div>
            </div>
          </div>

          {params.message && (
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
              {params.message}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Fontes monitoradas</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {fontes.length}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Fontes ativas</p>
              <p className="mt-2 text-2xl font-bold text-green-700">
                {fontesAtivas}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Aguardando revisão</p>
              <p className="mt-2 text-2xl font-bold text-amber-700">
                {aguardandoRevisao}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Aprovadas</p>
              <p className="mt-2 text-2xl font-bold text-green-700">
                {aprovadas}
              </p>
            </div>
          </div>

          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Atualização automática
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  O botão abaixo será ligado à rota automática de busca. Nesta etapa, a tela já está pronta para receber as capturas.
                </p>
              </div>

              <a
                href="/api/projetos-captacao/radar/atualizar"
                className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Atualizar oportunidades
              </a>
            </div>

            <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
              As oportunidades capturadas entram como <strong>aguardando revisão</strong>. Depois de revisar, você pode aprovar para enviar ao módulo de Oportunidades ou ignorar.
            </div>
          </div>

          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Fontes monitoradas
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Fontes oficiais utilizadas pelo radar de oportunidades.
                </p>
              </div>
            </div>

            {fontes.length > 0 ? (
              <div className="mt-6 space-y-4">
                {fontes.map((fonte) => (
                  <div
                    key={fonte.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {fonte.nome}
                        </h3>

                        <p className="mt-1 text-sm text-slate-600">
                          {fonte.orgao || '-'} • {fonte.esfera || '-'} • {fonte.area || '-'}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusFonteClassName(
                              fonte.status
                            )}`}
                          >
                            {statusFonteLabel(fonte.status)}
                          </span>

                          <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                            Última verificação: {formatarDataHora(fonte.ultima_verificacao)}
                          </span>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-slate-700">
                          {fonte.observacoes || 'Sem observações.'}
                        </p>

                        <a
                          href={fonte.url_monitoramento}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
                        >
                          Acessar fonte oficial
                          <ExternalLink size={15} />
                        </a>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {fonte.status === 'ativa' ? (
                          <form action={inativarFonteRadar}>
                            <input type="hidden" name="id" value={fonte.id} />
                            <button
                              type="submit"
                              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                            >
                              Inativar
                            </button>
                          </form>
                        ) : (
                          <form action={ativarFonteRadar}>
                            <input type="hidden" name="id" value={fonte.id} />
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
                Nenhuma fonte cadastrada no radar.
              </p>
            )}
          </div>

          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Capturas do radar
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Revise as oportunidades encontradas automaticamente.
                </p>
              </div>

              <form method="get" className="grid w-full max-w-6xl gap-2 md:grid-cols-6">
                <input
                  name="busca"
                  defaultValue={busca}
                  placeholder="Buscar"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />

                <select
                  name="fonte_id"
                  defaultValue={fonteFiltro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todas fontes</option>
                  {fontes.map((fonte) => (
                    <option key={fonte.id} value={fonte.id}>
                      {fonte.nome}
                    </option>
                  ))}
                </select>

                <select
                  name="esfera"
                  defaultValue={esferaFiltro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todas esferas</option>
                  <option value="Federal">Federal</option>
                  <option value="Estadual">Estadual</option>
                  <option value="Municipal">Municipal</option>
                  <option value="Privada">Privada</option>
                  <option value="Sistema S">Sistema S</option>
                  <option value="Outros">Outros</option>
                </select>

                <select
                  name="area"
                  defaultValue={areaFiltro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todas áreas</option>
                  <option value="Cultura">Cultura</option>
                  <option value="Turismo">Turismo</option>
                  <option value="Integrado">Integrado</option>
                </select>

                <select
                  name="status"
                  defaultValue={statusFiltro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todos status</option>
                  <option value="aguardando_revisao">Aguardando revisão</option>
                  <option value="aprovada">Aprovada</option>
                  <option value="ignorada">Ignorada</option>
                </select>

                <button
                  type="submit"
                  className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Filtrar
                </button>
              </form>
            </div>

            {capturas.length > 0 ? (
              <div className="mt-6 space-y-4">
                {capturas.map((captura) => (
                  <div
                    key={captura.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {captura.titulo}
                          </h3>

                          <p className="mt-1 text-sm text-slate-600">
                            {captura.orgao || 'Órgão não informado'} • {captura.esfera || '-'} • {captura.area || '-'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusCapturaClassName(
                              captura.status
                            )}`}
                          >
                            {statusCapturaLabel(captura.status)}
                          </span>

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${prazoClassName(
                              captura.prazo_inscricao
                            )}`}
                          >
                            {prazoLabel(captura.prazo_inscricao)}
                          </span>

                          <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                            Capturada em {formatarData(captura.created_at)}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-slate-700">
                          <p>
                            <span className="font-semibold">Fonte:</span>{' '}
                            {captura.fontes?.nome || 'Sem fonte vinculada'}
                          </p>

                          <p>
                            <span className="font-semibold">Prazo:</span>{' '}
                            {formatarData(captura.prazo_inscricao)}
                          </p>

                          <p>
                            <span className="font-semibold">Resumo:</span>{' '}
                            {captura.resumo || '-'}
                          </p>
                        </div>

                        {captura.link_oficial && (
                          <a
                            href={captura.link_oficial}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
                          >
                            Acessar link oficial
                            <ExternalLink size={15} />
                          </a>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {captura.status !== 'aprovada' && (
                          <form action={aprovarCapturaRadar}>
                            <input type="hidden" name="id" value={captura.id} />
                            <button
                              type="submit"
                              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                            >
                              Aprovar
                            </button>
                          </form>
                        )}

                        {captura.status !== 'ignorada' && (
                          <form action={ignorarCapturaRadar}>
                            <input type="hidden" name="id" value={captura.id} />
                            <button
                              type="submit"
                              className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                              Ignorar
                            </button>
                          </form>
                        )}

                        {captura.status !== 'aguardando_revisao' && (
                          <form action={reabrirCapturaRadar}>
                            <input type="hidden" name="id" value={captura.id} />
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
                Nenhuma captura encontrada.
              </p>
            )}

            {ignoradas > 0 && (
              <p className="mt-4 text-xs text-slate-500">
                Capturas ignoradas neste filtro: {ignoradas}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}