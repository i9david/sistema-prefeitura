import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModuloCaptacaoNav } from '@/components/modulo-captacao-nav'
import {
  atualizarProjetoCaptacao,
  criarProjetoCaptacao,
  mudarStatusProjetoCaptacao,
} from './actions'

type Projeto = {
  id: string
  nome: string
  area: string | null
  tipo: string | null
  descricao: string | null
  justificativa: string | null
  publico_beneficiado: string | null
  local_execucao: string | null
  valor_estimado: number | null
  prioridade: string | null
  status: string | null
  responsavel: string | null
  prazo_desejado: string | null
  observacoes: string | null
  created_at: string | null
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

function areaLabel(valor: string | null | undefined) {
  if (valor === 'cultura') return 'Cultura'
  if (valor === 'turismo') return 'Turismo'
  if (valor === 'integrado') return 'Integrado'
  return valor || '-'
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
  if (valor === 'ideia') return 'Ideia'
  if (valor === 'em_analise') return 'Em análise'
  if (valor === 'em_elaboracao') return 'Em elaboração'
  if (valor === 'aguardando_edital') return 'Aguardando edital'
  if (valor === 'inscrito') return 'Inscrito'
  if (valor === 'aprovado') return 'Aprovado'
  if (valor === 'reprovado') return 'Reprovado'
  if (valor === 'em_execucao') return 'Em execução'
  if (valor === 'concluido') return 'Concluído'
  return valor || '-'
}

function statusClassName(valor: string | null | undefined) {
  if (valor === 'ideia') return 'bg-slate-200 text-slate-700'
  if (valor === 'em_analise') return 'bg-blue-100 text-blue-700'
  if (valor === 'em_elaboracao') return 'bg-violet-100 text-violet-700'
  if (valor === 'aguardando_edital') return 'bg-amber-100 text-amber-700'
  if (valor === 'inscrito') return 'bg-indigo-100 text-indigo-700'
  if (valor === 'aprovado') return 'bg-green-100 text-green-700'
  if (valor === 'reprovado') return 'bg-red-100 text-red-700'
  if (valor === 'em_execucao') return 'bg-emerald-100 text-emerald-700'
  if (valor === 'concluido') return 'bg-slate-800 text-white'
  return 'bg-slate-200 text-slate-700'
}

export default async function ProjetosCaptacaoProjetosPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    busca?: string
    novo?: string
    editar?: string
    area?: string
    status?: string
    prioridade?: string
  }>
}) {
  const params = await searchParams
  const busca = params.busca?.trim() || ''
  const modoNovo = params.novo === '1'
  const editarId = params.editar?.trim() || ''
  const areaFiltro = params.area?.trim() || ''
  const statusFiltro = params.status?.trim() || ''
  const prioridadeFiltro = params.prioridade?.trim() || ''

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let projetosQuery = supabase
    .from('captacao_projetos')
    .select(`
      id,
      nome,
      area,
      tipo,
      descricao,
      justificativa,
      publico_beneficiado,
      local_execucao,
      valor_estimado,
      prioridade,
      status,
      responsavel,
      prazo_desejado,
      observacoes,
      created_at
    `)
    .order('created_at', { ascending: false })

  if (busca) {
    projetosQuery = projetosQuery.or(
      `nome.ilike.%${busca}%,descricao.ilike.%${busca}%,tipo.ilike.%${busca}%,responsavel.ilike.%${busca}%`
    )
  }

  if (areaFiltro) {
    projetosQuery = projetosQuery.eq('area', areaFiltro)
  }

  if (statusFiltro) {
    projetosQuery = projetosQuery.eq('status', statusFiltro)
  }

  if (prioridadeFiltro) {
    projetosQuery = projetosQuery.eq('prioridade', prioridadeFiltro)
  }

  const { data, error } = await projetosQuery

  if (error) {
    redirect(`/projetos-captacao/projetos?message=${encodeURIComponent(error.message)}`)
  }

  const projetos = (data ?? []) as Projeto[]

  const projetoEditando = editarId
    ? projetos.find((projeto) => projeto.id === editarId)
    : null

  const mostrarFormulario = modoNovo || !!projetoEditando

  const totalIdeias = projetos.filter((item) => item.status === 'ideia').length
  const totalAnalise = projetos.filter((item) => item.status === 'em_analise').length
  const totalAprovados = projetos.filter((item) => item.status === 'aprovado').length
  const valorTotal = projetos.reduce((acc, item) => acc + Number(item.valor_estimado || 0), 0)

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCaptacaoNav currentPath="/projetos-captacao/projetos" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Projetos
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Cadastre ideias, propostas e projetos para análise técnica e busca de recursos.
                </p>
              </div>

              {!mostrarFormulario && (
                <a
                  href="/projetos-captacao/projetos?novo=1"
                  className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Novo projeto
                </a>
              )}
            </div>
          </div>

          {mostrarFormulario && (
            <div className={cardClassName()}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    {projetoEditando ? 'Editar projeto' : 'Novo projeto'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Preencha as informações para análise da diretoria de projetos.
                  </p>
                </div>

                <a
                  href="/projetos-captacao/projetos"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Voltar para lista
                </a>
              </div>

              <form
                action={projetoEditando ? atualizarProjetoCaptacao : criarProjetoCaptacao}
                className="mt-6 grid gap-4"
              >
                {projetoEditando && (
                  <input type="hidden" name="id" value={projetoEditando.id} />
                )}

                <input
                  name="nome"
                  placeholder="Nome do projeto"
                  required
                  defaultValue={projetoEditando?.nome ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <select
                    name="area"
                    defaultValue={projetoEditando?.area ?? 'cultura'}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="cultura">Cultura</option>
                    <option value="turismo">Turismo</option>
                    <option value="integrado">Integrado</option>
                  </select>

                  <input
                    name="tipo"
                    placeholder="Tipo: obra, evento, formação..."
                    defaultValue={projetoEditando?.tipo ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <input
                    name="valor_estimado"
                    placeholder="Valor estimado"
                    defaultValue={projetoEditando?.valor_estimado ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <textarea
                  name="descricao"
                  placeholder="Descrição resumida do projeto"
                  defaultValue={projetoEditando?.descricao ?? ''}
                  className="min-h-[110px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <textarea
                  name="justificativa"
                  placeholder="Justificativa"
                  defaultValue={projetoEditando?.justificativa ?? ''}
                  className="min-h-[110px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <textarea
                    name="publico_beneficiado"
                    placeholder="Público beneficiado"
                    defaultValue={projetoEditando?.publico_beneficiado ?? ''}
                    className="min-h-[100px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <textarea
                    name="observacoes"
                    placeholder="Observações"
                    defaultValue={projetoEditando?.observacoes ?? ''}
                    className="min-h-[100px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="local_execucao"
                    placeholder="Local de execução"
                    defaultValue={projetoEditando?.local_execucao ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <input
                    name="responsavel"
                    placeholder="Responsável interno"
                    defaultValue={projetoEditando?.responsavel ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <select
                    name="prioridade"
                    defaultValue={projetoEditando?.prioridade ?? 'media'}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>

                  <select
                    name="status"
                    defaultValue={projetoEditando?.status ?? 'ideia'}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="ideia">Ideia</option>
                    <option value="em_analise">Em análise</option>
                    <option value="em_elaboracao">Em elaboração</option>
                    <option value="aguardando_edital">Aguardando edital</option>
                    <option value="inscrito">Inscrito</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="reprovado">Reprovado</option>
                    <option value="em_execucao">Em execução</option>
                    <option value="concluido">Concluído</option>
                  </select>

                  <input
                    name="prazo_desejado"
                    type="date"
                    defaultValue={projetoEditando?.prazo_desejado ?? ''}
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
                    className="rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                  >
                    {projetoEditando ? 'Atualizar projeto' : 'Salvar projeto'}
                  </button>

                  <a
                    href="/projetos-captacao/projetos"
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
              <p className="text-sm text-slate-500">Total de projetos</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {projetos.length}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Ideias</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalIdeias}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Em análise</p>
              <p className="mt-2 text-2xl font-bold text-blue-700">
                {totalAnalise}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Valor estimado total</p>
              <p className="mt-2 text-2xl font-bold text-green-700">
                {formatarMoeda(valorTotal)}
              </p>
            </div>
          </div>

          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Lista de projetos
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Busque, filtre, edite e acompanhe os projetos cadastrados.
                </p>
              </div>

              <form method="get" className="grid w-full max-w-5xl gap-2 md:grid-cols-5">
                <input
                  name="busca"
                  defaultValue={busca}
                  placeholder="Buscar projeto"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />

                <select
                  name="area"
                  defaultValue={areaFiltro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todas áreas</option>
                  <option value="cultura">Cultura</option>
                  <option value="turismo">Turismo</option>
                  <option value="integrado">Integrado</option>
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
                  <option value="ideia">Ideia</option>
                  <option value="em_analise">Em análise</option>
                  <option value="em_elaboracao">Em elaboração</option>
                  <option value="aguardando_edital">Aguardando edital</option>
                  <option value="inscrito">Inscrito</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="reprovado">Reprovado</option>
                  <option value="em_execucao">Em execução</option>
                  <option value="concluido">Concluído</option>
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

            {projetos.length > 0 ? (
              <div className="mt-6 space-y-4">
                {projetos.map((projeto) => (
                  <div
                    key={projeto.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {projeto.nome}
                          </h3>

                          <p className="mt-1 text-sm text-slate-600">
                            {areaLabel(projeto.area)} • {projeto.tipo || 'Tipo não informado'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                            {areaLabel(projeto.area)}
                          </span>

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${prioridadeClassName(
                              projeto.prioridade
                            )}`}
                          >
                            {prioridadeLabel(projeto.prioridade)}
                          </span>

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(
                              projeto.status
                            )}`}
                          >
                            {statusLabel(projeto.status)}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-slate-700">
                          <p>
                            <span className="font-semibold">Valor estimado:</span>{' '}
                            {formatarMoeda(projeto.valor_estimado)}
                          </p>

                          <p>
                            <span className="font-semibold">Responsável:</span>{' '}
                            {projeto.responsavel || '-'}
                          </p>

                          <p>
                            <span className="font-semibold">Prazo desejado:</span>{' '}
                            {formatarData(projeto.prazo_desejado)}
                          </p>

                          <p>
                            <span className="font-semibold">Descrição:</span>{' '}
                            {projeto.descricao || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/projetos-captacao/projetos?editar=${projeto.id}`}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Editar
                        </a>

                        <form action={mudarStatusProjetoCaptacao}>
                          <input type="hidden" name="id" value={projeto.id} />
                          <input type="hidden" name="status" value="em_analise" />
                          <button
                            type="submit"
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            Enviar para análise
                          </button>
                        </form>

                        <form action={mudarStatusProjetoCaptacao}>
                          <input type="hidden" name="id" value={projeto.id} />
                          <input type="hidden" name="status" value="aprovado" />
                          <button
                            type="submit"
                            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                          >
                            Aprovar
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhum projeto encontrado.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}