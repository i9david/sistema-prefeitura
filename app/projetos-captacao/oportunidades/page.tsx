import { redirect } from 'next/navigation'
import { ExternalLink, Sparkles, FilePlus2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ModuloCaptacaoNav } from '@/components/modulo-captacao-nav'
import {
  alterarStatusOportunidadeCaptacao,
  atualizarOportunidadeCaptacao,
  criarOportunidadeCaptacao,
} from './actions'
import {
  analisarEditalComIA,
  gerarProjetoAutomatico,
} from './ia-actions'

type Fonte = {
  id: string
  nome: string
  orgao: string | null
  status: string | null
}

type Oportunidade = {
  id: string
  titulo: string
  orgao: string | null
  esfera: string | null
  area: string | null
  tipo: string | null
  valor_disponivel: number | null
  prazo_inscricao: string | null
  link_oficial: string | null
  resumo: string | null
  documentos_exigidos: string | null
  quem_pode_participar: string | null
  status: string | null
  fonte_id: string | null
  created_at: string | null
  texto_edital: string | null
  resumo_ia: string | null
  requisitos_ia: string | null
  documentos_ia: string | null
  publico_ia: string | null
  valor_ia: string | null
  prazo_ia: string | null
  elegibilidade_prefeitura: string | null
  score_prefeitura: number | null
  recomendacao_ia: string | null
  fontes?: {
    id: string
    nome: string
    orgao: string | null
  } | null
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function formatarMoeda(valor: number | null | undefined) {
  if (valor === null || valor === undefined) return '-'

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

function formatarData(data: string | null | undefined) {
  if (!data) return '-'

  const somenteData = data.slice(0, 10)
  const partes = somenteData.split('-')

  if (partes.length !== 3) return data

  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function statusLabel(valor: string | null | undefined) {
  if (valor === 'aberta') return 'Aberta'
  if (valor === 'em_analise') return 'Em análise'
  if (valor === 'cadastrada') return 'Cadastrada'
  if (valor === 'enviada') return 'Enviada'
  if (valor === 'encerrada') return 'Encerrada'
  if (valor === 'aprovada') return 'Aprovada'
  if (valor === 'reprovada') return 'Reprovada'
  return valor || '-'
}

function statusClassName(valor: string | null | undefined) {
  if (valor === 'aberta') return 'bg-green-100 text-green-700'
  if (valor === 'em_analise') return 'bg-blue-100 text-blue-700'
  if (valor === 'cadastrada') return 'bg-violet-100 text-violet-700'
  if (valor === 'enviada') return 'bg-indigo-100 text-indigo-700'
  if (valor === 'encerrada') return 'bg-slate-200 text-slate-700'
  if (valor === 'aprovada') return 'bg-emerald-100 text-emerald-700'
  if (valor === 'reprovada') return 'bg-red-100 text-red-700'
  return 'bg-slate-200 text-slate-700'
}

function elegibilidadeClassName(valor: string | null | undefined) {
  if (valor === 'sim') return 'bg-green-100 text-green-700'
  if (valor === 'nao') return 'bg-red-100 text-red-700'
  if (valor === 'precisa_validar') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-200 text-slate-700'
}

function elegibilidadeLabel(valor: string | null | undefined) {
  if (valor === 'sim') return 'Prefeitura pode participar'
  if (valor === 'nao') return 'Prefeitura não elegível'
  if (valor === 'precisa_validar') return 'Precisa validar'
  return 'Sem análise IA'
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

export default async function OportunidadesCaptacaoPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    busca?: string
    novo?: string
    editar?: string
    esfera?: string
    area?: string
    status?: string
    fonte_id?: string
  }>
}) {
  const params = await searchParams
  const busca = params.busca?.trim() || ''
  const modoNovo = params.novo === '1'
  const editarId = params.editar?.trim() || ''
  const esferaFiltro = params.esfera?.trim() || ''
  const areaFiltro = params.area?.trim() || ''
  const statusFiltro = params.status?.trim() || ''
  const fonteFiltro = params.fonte_id?.trim() || ''

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: fontesData } = await supabase
    .from('captacao_fontes')
    .select('id, nome, orgao, status')
    .order('nome', { ascending: true })

  let oportunidadesQuery = supabase
    .from('captacao_oportunidades')
    .select(`
      id,
      titulo,
      orgao,
      esfera,
      area,
      tipo,
      valor_disponivel,
      prazo_inscricao,
      link_oficial,
      resumo,
      documentos_exigidos,
      quem_pode_participar,
      status,
      fonte_id,
      created_at,
      texto_edital,
      resumo_ia,
      requisitos_ia,
      documentos_ia,
      publico_ia,
      valor_ia,
      prazo_ia,
      elegibilidade_prefeitura,
      score_prefeitura,
      recomendacao_ia,
      fontes:captacao_fontes (
        id,
        nome,
        orgao
      )
    `)
    .order('prazo_inscricao', { ascending: true, nullsFirst: false })

  if (busca) {
    oportunidadesQuery = oportunidadesQuery.or(
      `titulo.ilike.%${busca}%,orgao.ilike.%${busca}%,resumo.ilike.%${busca}%,tipo.ilike.%${busca}%`
    )
  }

  if (esferaFiltro) oportunidadesQuery = oportunidadesQuery.eq('esfera', esferaFiltro)
  if (areaFiltro) oportunidadesQuery = oportunidadesQuery.eq('area', areaFiltro)
  if (statusFiltro) oportunidadesQuery = oportunidadesQuery.eq('status', statusFiltro)
  if (fonteFiltro) oportunidadesQuery = oportunidadesQuery.eq('fonte_id', fonteFiltro)

  const { data: oportunidadesData, error } = await oportunidadesQuery

  if (error) {
    redirect(`/projetos-captacao/oportunidades?message=${encodeURIComponent(error.message)}`)
  }

  const fontes = (fontesData ?? []) as Fonte[]
  const oportunidades = (oportunidadesData ?? []) as unknown as Oportunidade[]

  const oportunidadeEditando = editarId
    ? oportunidades.find((item) => item.id === editarId)
    : null

  const mostrarFormulario = modoNovo || !!oportunidadeEditando

  const oportunidadesAbertas = oportunidades.filter((item) => item.status === 'aberta').length
  const oportunidadesFederais = oportunidades.filter((item) => item.esfera === 'Federal').length
  const oportunidadesComIA = oportunidades.filter((item) => item.resumo_ia).length
  const valorTotal = oportunidades.reduce(
    (acc, item) => acc + Number(item.valor_disponivel || 0),
    0
  )

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCaptacaoNav currentPath="/projetos-captacao/oportunidades" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Oportunidades
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Monitore editais, chamadas públicas, programas, prazos e oportunidades de captação.
                </p>
              </div>

              {!mostrarFormulario && (
                <a
                  href="/projetos-captacao/oportunidades?novo=1"
                  className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Nova oportunidade
                </a>
              )}
            </div>
          </div>

          {mostrarFormulario && (
            <div className={cardClassName()}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    {oportunidadeEditando ? 'Editar oportunidade' : 'Nova oportunidade'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Registre dados oficiais da oportunidade encontrada.
                  </p>
                </div>

                <a
                  href="/projetos-captacao/oportunidades"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Voltar para lista
                </a>
              </div>

              <form
                action={
                  oportunidadeEditando
                    ? atualizarOportunidadeCaptacao
                    : criarOportunidadeCaptacao
                }
                className="mt-6 grid gap-4"
              >
                {oportunidadeEditando && (
                  <input type="hidden" name="id" value={oportunidadeEditando.id} />
                )}

                <input
                  name="titulo"
                  placeholder="Título da oportunidade"
                  required
                  defaultValue={oportunidadeEditando?.titulo ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <input
                    name="orgao"
                    placeholder="Órgão responsável"
                    defaultValue={oportunidadeEditando?.orgao ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <select
                    name="esfera"
                    defaultValue={oportunidadeEditando?.esfera ?? 'Federal'}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="Federal">Federal</option>
                    <option value="Estadual">Estadual</option>
                    <option value="Municipal">Municipal</option>
                    <option value="Privada">Privada</option>
                    <option value="Sistema S">Sistema S</option>
                    <option value="Outros">Outros</option>
                  </select>

                  <select
                    name="area"
                    defaultValue={oportunidadeEditando?.area ?? 'Cultura'}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="Cultura">Cultura</option>
                    <option value="Turismo">Turismo</option>
                    <option value="Integrado">Integrado</option>
                    <option value="Infraestrutura">Infraestrutura</option>
                    <option value="Patrimônio">Patrimônio</option>
                    <option value="Eventos">Eventos</option>
                    <option value="Formação">Formação</option>
                  </select>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <input
                    name="tipo"
                    placeholder="Tipo: edital, chamamento, programa..."
                    defaultValue={oportunidadeEditando?.tipo ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <input
                    name="valor_disponivel"
                    placeholder="Valor disponível"
                    defaultValue={oportunidadeEditando?.valor_disponivel ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <input
                    name="prazo_inscricao"
                    type="date"
                    defaultValue={oportunidadeEditando?.prazo_inscricao ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <select
                  name="fonte_id"
                  defaultValue={oportunidadeEditando?.fonte_id ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                >
                  <option value="">Sem fonte vinculada</option>
                  {fontes
                    .filter((fonte) => fonte.status !== 'inativa')
                    .map((fonte) => (
                      <option key={fonte.id} value={fonte.id}>
                        {fonte.nome}
                      </option>
                    ))}
                </select>

                <input
                  name="link_oficial"
                  placeholder="Link oficial"
                  defaultValue={oportunidadeEditando?.link_oficial ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <textarea
                  name="resumo"
                  placeholder="Resumo da oportunidade"
                  defaultValue={oportunidadeEditando?.resumo ?? ''}
                  className="min-h-[120px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <textarea
                  name="quem_pode_participar"
                  placeholder="Quem pode participar"
                  defaultValue={oportunidadeEditando?.quem_pode_participar ?? ''}
                  className="min-h-[100px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <textarea
                  name="documentos_exigidos"
                  placeholder="Documentos exigidos"
                  defaultValue={oportunidadeEditando?.documentos_exigidos ?? ''}
                  className="min-h-[100px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <textarea
                  name="texto_edital"
                  placeholder="Cole aqui o texto completo do edital para análise com IA"
                  defaultValue={oportunidadeEditando?.texto_edital ?? ''}
                  className="min-h-[180px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <select
                  name="status"
                  defaultValue={oportunidadeEditando?.status ?? 'aberta'}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                >
                  <option value="aberta">Aberta</option>
                  <option value="em_analise">Em análise</option>
                  <option value="cadastrada">Cadastrada</option>
                  <option value="enviada">Enviada</option>
                  <option value="encerrada">Encerrada</option>
                  <option value="aprovada">Aprovada</option>
                  <option value="reprovada">Reprovada</option>
                </select>

                {params.message && (
                  <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    {params.message}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                  >
                    {oportunidadeEditando ? 'Atualizar oportunidade' : 'Salvar oportunidade'}
                  </button>

                  <a
                    href="/projetos-captacao/oportunidades"
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
              <p className="text-sm text-slate-500">Total de oportunidades</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {oportunidades.length}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Abertas</p>
              <p className="mt-2 text-2xl font-bold text-green-700">
                {oportunidadesAbertas}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Federais</p>
              <p className="mt-2 text-2xl font-bold text-blue-700">
                {oportunidadesFederais}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Analisadas por IA</p>
              <p className="mt-2 text-2xl font-bold text-violet-700">
                {oportunidadesComIA}
              </p>
            </div>
          </div>

          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Lista de oportunidades
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Filtre, acompanhe e use IA para analisar editais e gerar projetos.
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
                  <option value="Infraestrutura">Infraestrutura</option>
                  <option value="Patrimônio">Patrimônio</option>
                  <option value="Eventos">Eventos</option>
                  <option value="Formação">Formação</option>
                </select>

                <select
                  name="status"
                  defaultValue={statusFiltro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todos status</option>
                  <option value="aberta">Aberta</option>
                  <option value="em_analise">Em análise</option>
                  <option value="cadastrada">Cadastrada</option>
                  <option value="enviada">Enviada</option>
                  <option value="encerrada">Encerrada</option>
                  <option value="aprovada">Aprovada</option>
                  <option value="reprovada">Reprovada</option>
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

            {oportunidades.length > 0 ? (
              <div className="mt-6 space-y-4">
                {oportunidades.map((oportunidade) => (
                  <div
                    key={oportunidade.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {oportunidade.titulo}
                          </h3>

                          <p className="mt-1 text-sm text-slate-600">
                            {oportunidade.orgao || 'Órgão não informado'} • {oportunidade.esfera || '-'} • {oportunidade.area || '-'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(
                              oportunidade.status
                            )}`}
                          >
                            {statusLabel(oportunidade.status)}
                          </span>

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${prazoClassName(
                              oportunidade.prazo_inscricao
                            )}`}
                          >
                            {prazoLabel(oportunidade.prazo_inscricao)}
                          </span>

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${elegibilidadeClassName(
                              oportunidade.elegibilidade_prefeitura
                            )}`}
                          >
                            {elegibilidadeLabel(oportunidade.elegibilidade_prefeitura)}
                          </span>

                          {typeof oportunidade.score_prefeitura === 'number' && (
                            <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                              Score IA: {oportunidade.score_prefeitura}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 text-sm text-slate-700">
                          <p>
                            <span className="font-semibold">Fonte:</span>{' '}
                            {oportunidade.fontes?.nome || 'Sem fonte vinculada'}
                          </p>

                          <p>
                            <span className="font-semibold">Tipo:</span>{' '}
                            {oportunidade.tipo || '-'}
                          </p>

                          <p>
                            <span className="font-semibold">Valor disponível:</span>{' '}
                            {formatarMoeda(oportunidade.valor_disponivel)}
                          </p>

                          <p>
                            <span className="font-semibold">Prazo:</span>{' '}
                            {formatarData(oportunidade.prazo_inscricao)}
                          </p>

                          <p>
                            <span className="font-semibold">Resumo:</span>{' '}
                            {oportunidade.resumo || '-'}
                          </p>
                        </div>

                        {oportunidade.resumo_ia && (
                          <div className="rounded-3xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
                            <p className="font-bold">Análise da IA</p>
                            <p className="mt-2">
                              <span className="font-semibold">Resumo:</span>{' '}
                              {oportunidade.resumo_ia}
                            </p>
                            <p className="mt-1">
                              <span className="font-semibold">Requisitos:</span>{' '}
                              {oportunidade.requisitos_ia || '-'}
                            </p>
                            <p className="mt-1">
                              <span className="font-semibold">Documentos:</span>{' '}
                              {oportunidade.documentos_ia || '-'}
                            </p>
                            <p className="mt-1">
                              <span className="font-semibold">Recomendação:</span>{' '}
                              {oportunidade.recomendacao_ia || '-'}
                            </p>
                          </div>
                        )}

                        {oportunidade.link_oficial && (
                          <a
                            href={oportunidade.link_oficial}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
                          >
                            Acessar link oficial
                            <ExternalLink size={15} />
                          </a>
                        )}
                      </div>

                      <div className="flex min-w-[220px] flex-col gap-2">
                        <a
                          href={`/projetos-captacao/oportunidades?editar=${oportunidade.id}`}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Editar
                        </a>

                        <form action={analisarEditalComIA}>
                          <input type="hidden" name="id" value={oportunidade.id} />
                          <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                          >
                            <Sparkles size={16} />
                            Analisar com IA
                          </button>
                        </form>

                        <form action={gerarProjetoAutomatico}>
                          <input type="hidden" name="id" value={oportunidade.id} />
                          <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                          >
                            <FilePlus2 size={16} />
                            Gerar projeto
                          </button>
                        </form>

                        {oportunidade.status !== 'encerrada' && (
                          <form action={alterarStatusOportunidadeCaptacao}>
                            <input type="hidden" name="id" value={oportunidade.id} />
                            <input type="hidden" name="status" value="encerrada" />
                            <button
                              type="submit"
                              className="w-full rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                              Encerrar
                            </button>
                          </form>
                        )}

                        {oportunidade.status !== 'enviada' && (
                          <form action={alterarStatusOportunidadeCaptacao}>
                            <input type="hidden" name="id" value={oportunidade.id} />
                            <input type="hidden" name="status" value="enviada" />
                            <button
                              type="submit"
                              className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                              Marcar enviada
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
                Nenhuma oportunidade encontrada.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}