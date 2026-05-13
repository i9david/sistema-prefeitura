import { redirect } from 'next/navigation'
import { ClipboardCheck, FileCheck2, FileWarning, Plus, SearchCheck } from 'lucide-react'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuloCaptacaoNav } from '@/components/modulo-captacao-nav'
import { ModuleCard, ModuleMetricCard } from '@/components/module/module-card'
import { ModuleGrid } from '@/components/module/module-grid'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { atualizarAnalise, criarAnalise } from './actions'

type Projeto = {
  id: string
  nome: string
  status: string | null
  area: string | null
}

type Oportunidade = {
  id: string
  titulo: string
  status: string | null
  orgao: string | null
}

type Analise = {
  id: string
  projeto_id: string | null
  oportunidade_id: string | null
  parecer: string | null
  viabilidade: string | null
  documentos_pendentes: string | null
  proximo_passo: string | null
  responsavel_analise: string | null
  status: string | null
  created_at: string | null
}

function formatarData(data: string | null | undefined) {
  if (!data) return '-'
  const somenteData = data.slice(0, 10)
  const partes = somenteData.split('-')
  if (partes.length !== 3) return data
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function viabilidadeLabel(valor: string | null | undefined) {
  if (valor === 'viavel') return 'Viável'
  if (valor === 'inviavel') return 'Inviável'
  if (valor === 'ajustar') return 'Precisa ajustar'
  if (valor === 'em_analise') return 'Em análise'
  return valor || '-'
}

function viabilidadeClassName(valor: string | null | undefined) {
  if (valor === 'viavel') return 'bg-green-100 text-green-700'
  if (valor === 'inviavel') return 'bg-red-100 text-red-700'
  if (valor === 'ajustar') return 'bg-amber-100 text-amber-700'
  if (valor === 'em_analise') return 'bg-blue-100 text-blue-700'
  return 'bg-slate-200 text-slate-700'
}

function statusLabel(valor: string | null | undefined) {
  if (valor === 'em_analise') return 'Em análise'
  if (valor === 'pendente') return 'Pendente'
  if (valor === 'aprovada') return 'Aprovada'
  if (valor === 'reprovada') return 'Reprovada'
  if (valor === 'concluida') return 'Concluída'
  return valor || '-'
}

function statusClassName(valor: string | null | undefined) {
  if (valor === 'em_analise') return 'bg-blue-100 text-blue-700'
  if (valor === 'pendente') return 'bg-amber-100 text-amber-700'
  if (valor === 'aprovada') return 'bg-green-100 text-green-700'
  if (valor === 'reprovada') return 'bg-red-100 text-red-700'
  if (valor === 'concluida') return 'bg-slate-800 text-white'
  return 'bg-slate-200 text-slate-700'
}

export default async function AnalisesCaptacaoPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    novo?: string
    editar?: string
    status?: string
    viabilidade?: string
  }>
}) {
  const params = await searchParams
  const modoNovo = params.novo === '1'
  const editarId = params.editar?.trim() || ''
  const statusFiltro = params.status?.trim() || ''
  const viabilidadeFiltro = params.viabilidade?.trim() || ''

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: projetosData },
    { data: oportunidadesData },
  ] = await Promise.all([
    supabase
      .from('captacao_projetos')
      .select('id, nome, status, area')
      .order('nome', { ascending: true }),
    supabase
      .from('captacao_oportunidades')
      .select('id, titulo, status, orgao')
      .order('titulo', { ascending: true }),
  ])

  let analisesQuery = supabase
    .from('captacao_analises')
    .select(`
      id,
      projeto_id,
      oportunidade_id,
      parecer,
      viabilidade,
      documentos_pendentes,
      proximo_passo,
      responsavel_analise,
      status,
      created_at
    `)
    .order('created_at', { ascending: false })

  if (statusFiltro) {
    analisesQuery = analisesQuery.eq('status', statusFiltro)
  }

  if (viabilidadeFiltro) {
    analisesQuery = analisesQuery.eq('viabilidade', viabilidadeFiltro)
  }

  const { data: analisesData, error } = await analisesQuery

  if (error) {
    redirect(`/projetos-captacao/analises?message=${encodeURIComponent(error.message)}`)
  }

  const projetos = (projetosData ?? []) as Projeto[]
  const oportunidades = (oportunidadesData ?? []) as Oportunidade[]
  const analises = (analisesData ?? []) as unknown as Analise[]
  const projetosPorId = new Map(projetos.map((projeto) => [projeto.id, projeto]))
  const oportunidadesPorId = new Map(
    oportunidades.map((oportunidade) => [oportunidade.id, oportunidade])
  )

  function getProjeto(analise: Analise) {
    if (!analise.projeto_id) return null
    return projetosPorId.get(analise.projeto_id) ?? null
  }

  function getOportunidade(analise: Analise) {
    if (!analise.oportunidade_id) return null
    return oportunidadesPorId.get(analise.oportunidade_id) ?? null
  }

  const analiseEditando = editarId
    ? analises.find((item) => item.id === editarId)
    : null

  const mostrarFormulario = modoNovo || !!analiseEditando

  const totalEmAnalise = analises.filter((item) => item.status === 'em_analise').length
  const totalViaveis = analises.filter((item) => item.viabilidade === 'viavel').length
  const totalAjustar = analises.filter((item) => item.viabilidade === 'ajustar').length
  const totalInviaveis = analises.filter((item) => item.viabilidade === 'inviavel').length

  return (
    <ModuleLayout sidebar={<ModuloCaptacaoNav currentPath="/projetos-captacao/analises" />}>
      <ModuleHeader
        title="Análise Técnica"
        eyebrow="Operação"
        description="Avaliação técnica dos projetos, pendências, viabilidade, pareceres e próximos passos."
        icon={ClipboardCheck}
        accent="violet"
        context="Pareceres e viabilidade"
        action={
          !mostrarFormulario && (
            <a href="/projetos-captacao/analises?novo=1" className="btn-primary w-full justify-center md:w-auto">
              <Plus size={16} aria-hidden="true" />
              Nova análise
            </a>
          )
        }
      />

          {mostrarFormulario && (
            <ModuleCard>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    {analiseEditando ? 'Editar análise' : 'Nova análise'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Registre o parecer da diretoria de projetos.
                  </p>
                </div>

                <a
                  href="/projetos-captacao/analises"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Voltar para lista
                </a>
              </div>

              <form
                action={analiseEditando ? atualizarAnalise : criarAnalise}
                className="mt-6 grid gap-4"
              >
                {analiseEditando && (
                  <input type="hidden" name="id" value={analiseEditando.id} />
                )}

                {!analiseEditando && (
                  <>
                    <select
                      name="projeto_id"
                      required
                      defaultValue=""
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    >
                      <option value="">Selecione o projeto</option>
                      {projetos.map((projeto) => (
                        <option key={projeto.id} value={projeto.id}>
                          {projeto.nome}
                        </option>
                      ))}
                    </select>

                    <select
                      name="oportunidade_id"
                      defaultValue=""
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    >
                      <option value="">Sem oportunidade vinculada</option>
                      {oportunidades.map((oportunidade) => (
                        <option key={oportunidade.id} value={oportunidade.id}>
                          {oportunidade.titulo}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                <textarea
                  name="parecer"
                  placeholder="Parecer técnico"
                  defaultValue={analiseEditando?.parecer ?? ''}
                  className="min-h-[130px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    name="viabilidade"
                    defaultValue={analiseEditando?.viabilidade ?? 'em_analise'}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="em_analise">Em análise</option>
                    <option value="viavel">Viável</option>
                    <option value="ajustar">Precisa ajustar</option>
                    <option value="inviavel">Inviável</option>
                  </select>

                  <select
                    name="status"
                    defaultValue={analiseEditando?.status ?? 'em_analise'}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="em_analise">Em análise</option>
                    <option value="pendente">Pendente</option>
                    <option value="aprovada">Aprovada</option>
                    <option value="reprovada">Reprovada</option>
                    <option value="concluida">Concluída</option>
                  </select>
                </div>

                <textarea
                  name="documentos_pendentes"
                  placeholder="Documentos pendentes"
                  defaultValue={analiseEditando?.documentos_pendentes ?? ''}
                  className="min-h-[100px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <textarea
                  name="proximo_passo"
                  placeholder="Próximo passo"
                  defaultValue={analiseEditando?.proximo_passo ?? ''}
                  className="min-h-[100px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <input
                  name="responsavel_analise"
                  placeholder="Responsável pela análise"
                  defaultValue={analiseEditando?.responsavel_analise ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

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
                    {analiseEditando ? 'Atualizar análise' : 'Salvar análise'}
                  </button>

                  <a
                    href="/projetos-captacao/analises"
                    className="rounded-2xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancelar
                  </a>
                </div>
              </form>
            </ModuleCard>
          )}

          <ModuleGrid columns={4}>
            <ModuleMetricCard label="Total de análises" value={analises.length} icon={ClipboardCheck} accent="violet" />
            <ModuleMetricCard label="Em análise" value={totalEmAnalise} icon={SearchCheck} accent="violet" />
            <ModuleMetricCard label="Viáveis" value={totalViaveis} icon={FileCheck2} accent="violet" />
            <ModuleMetricCard label="Precisam ajustar" value={totalAjustar} icon={FileWarning} accent="violet" />
          </ModuleGrid>

          <ModuleCard>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Lista de análises
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Acompanhe pareceres, viabilidade e próximos passos.
                </p>
              </div>

              <form method="get" className="grid w-full max-w-2xl gap-2 md:grid-cols-3">
                <select
                  name="viabilidade"
                  defaultValue={viabilidadeFiltro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todas viabilidades</option>
                  <option value="em_analise">Em análise</option>
                  <option value="viavel">Viável</option>
                  <option value="ajustar">Precisa ajustar</option>
                  <option value="inviavel">Inviável</option>
                </select>

                <select
                  name="status"
                  defaultValue={statusFiltro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todos status</option>
                  <option value="em_analise">Em análise</option>
                  <option value="pendente">Pendente</option>
                  <option value="aprovada">Aprovada</option>
                  <option value="reprovada">Reprovada</option>
                  <option value="concluida">Concluída</option>
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

            {analises.length > 0 ? (
              <div className="mt-6 space-y-4">
                {analises.map((analise) => {
                  const projeto = getProjeto(analise)
                  const oportunidade = getOportunidade(analise)

                  return (
                    <div
                      key={analise.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {projeto?.nome || 'Projeto não informado'}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            Oportunidade: {oportunidade?.titulo || 'Sem oportunidade vinculada'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${viabilidadeClassName(
                              analise.viabilidade
                            )}`}
                          >
                            {viabilidadeLabel(analise.viabilidade)}
                          </span>

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(
                              analise.status
                            )}`}
                          >
                            {statusLabel(analise.status)}
                          </span>

                          <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                            {formatarData(analise.created_at)}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-slate-700">
                          <p>
                            <span className="font-semibold">Responsável:</span>{' '}
                            {analise.responsavel_analise || '-'}
                          </p>

                          <p>
                            <span className="font-semibold">Parecer:</span>{' '}
                            {analise.parecer || '-'}
                          </p>

                          <p>
                            <span className="font-semibold">Pendências:</span>{' '}
                            {analise.documentos_pendentes || '-'}
                          </p>

                          <p>
                            <span className="font-semibold">Próximo passo:</span>{' '}
                            {analise.proximo_passo || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/projetos-captacao/analises?editar=${analise.id}`}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Editar
                        </a>
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhuma análise encontrada.
              </p>
            )}
          </ModuleCard>
    </ModuleLayout>
  )
}
