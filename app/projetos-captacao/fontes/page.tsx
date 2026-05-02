import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ModuloCaptacaoNav } from '@/components/modulo-captacao-nav'
import {
  ativarFonteRecurso,
  atualizarFonteRecurso,
  criarFonteRecurso,
  inativarFonteRecurso,
} from './actions'

type Fonte = {
  id: string
  nome: string
  orgao: string | null
  esfera: string | null
  area: string | null
  site_oficial: string | null
  descricao: string | null
  status: string | null
  created_at: string | null
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function statusClassName(status: string | null | undefined) {
  if (status === 'ativa') return 'bg-green-100 text-green-700'
  if (status === 'inativa') return 'bg-red-100 text-red-700'
  return 'bg-slate-200 text-slate-700'
}

function statusLabel(status: string | null | undefined) {
  if (status === 'ativa') return 'Ativa'
  if (status === 'inativa') return 'Inativa'
  return status || '-'
}

export default async function FontesRecursosPage({
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
  }>
}) {
  const params = await searchParams
  const busca = params.busca?.trim() || ''
  const modoNovo = params.novo === '1'
  const editarId = params.editar?.trim() || ''
  const esferaFiltro = params.esfera?.trim() || ''
  const areaFiltro = params.area?.trim() || ''
  const statusFiltro = params.status?.trim() || ''

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let fontesQuery = supabase
    .from('captacao_fontes')
    .select('id, nome, orgao, esfera, area, site_oficial, descricao, status, created_at')
    .order('nome', { ascending: true })

  if (busca) {
    fontesQuery = fontesQuery.or(
      `nome.ilike.%${busca}%,orgao.ilike.%${busca}%,descricao.ilike.%${busca}%`
    )
  }

  if (esferaFiltro) {
    fontesQuery = fontesQuery.eq('esfera', esferaFiltro)
  }

  if (areaFiltro) {
    fontesQuery = fontesQuery.eq('area', areaFiltro)
  }

  if (statusFiltro) {
    fontesQuery = fontesQuery.eq('status', statusFiltro)
  }

  const { data, error } = await fontesQuery

  if (error) {
    redirect(`/projetos-captacao/fontes?message=${encodeURIComponent(error.message)}`)
  }

  const fontes = (data ?? []) as Fonte[]

  const fonteEditando = editarId
    ? fontes.find((fonte) => fonte.id === editarId)
    : null

  const mostrarFormulario = modoNovo || !!fonteEditando

  const totalAtivas = fontes.filter((item) => item.status === 'ativa').length
  const totalFederais = fontes.filter((item) => item.esfera === 'Federal').length
  const totalEstaduais = fontes.filter((item) => item.esfera === 'Estadual').length

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCaptacaoNav currentPath="/projetos-captacao/fontes" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Fontes de Recursos
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Cadastre e organize órgãos, programas, portais oficiais e linhas de financiamento para projetos culturais e turísticos.
                </p>
              </div>

              {!mostrarFormulario && (
                <a
                  href="/projetos-captacao/fontes?novo=1"
                  className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Nova fonte
                </a>
              )}
            </div>
          </div>

          {mostrarFormulario && (
            <div className={cardClassName()}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    {fonteEditando ? 'Editar fonte' : 'Nova fonte'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Registre uma fonte de recurso para consulta da diretoria de projetos.
                  </p>
                </div>

                <a
                  href="/projetos-captacao/fontes"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Voltar para lista
                </a>
              </div>

              <form
                action={fonteEditando ? atualizarFonteRecurso : criarFonteRecurso}
                className="mt-6 grid gap-4"
              >
                {fonteEditando && (
                  <input type="hidden" name="id" value={fonteEditando.id} />
                )}

                <input
                  name="nome"
                  placeholder="Nome da fonte"
                  required
                  defaultValue={fonteEditando?.nome ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <input
                    name="orgao"
                    placeholder="Órgão"
                    defaultValue={fonteEditando?.orgao ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <select
                    name="esfera"
                    defaultValue={fonteEditando?.esfera ?? 'Federal'}
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
                    defaultValue={fonteEditando?.area ?? 'Cultura'}
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

                <input
                  name="site_oficial"
                  placeholder="Link oficial"
                  defaultValue={fonteEditando?.site_oficial ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <textarea
                  name="descricao"
                  placeholder="Descrição da fonte, observações e possibilidades de uso"
                  defaultValue={fonteEditando?.descricao ?? ''}
                  className="min-h-[130px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <select
                  name="status"
                  defaultValue={fonteEditando?.status ?? 'ativa'}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                >
                  <option value="ativa">Ativa</option>
                  <option value="inativa">Inativa</option>
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
                    {fonteEditando ? 'Atualizar fonte' : 'Salvar fonte'}
                  </button>

                  <a
                    href="/projetos-captacao/fontes"
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
              <p className="text-sm text-slate-500">Total de fontes</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {fontes.length}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Fontes ativas</p>
              <p className="mt-2 text-2xl font-bold text-green-700">
                {totalAtivas}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Federais</p>
              <p className="mt-2 text-2xl font-bold text-blue-700">
                {totalFederais}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Estaduais</p>
              <p className="mt-2 text-2xl font-bold text-violet-700">
                {totalEstaduais}
              </p>
            </div>
          </div>

          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Lista de fontes
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Consulte, filtre e atualize as fontes de recursos disponíveis.
                </p>
              </div>

              <form method="get" className="grid w-full max-w-5xl gap-2 md:grid-cols-5">
                <input
                  name="busca"
                  defaultValue={busca}
                  placeholder="Buscar fonte"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />

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
                  <option value="ativa">Ativa</option>
                  <option value="inativa">Inativa</option>
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

            {fontes.length > 0 ? (
              <div className="mt-6 space-y-4">
                {fontes.map((fonte) => (
                  <div
                    key={fonte.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {fonte.nome}
                          </h3>

                          <p className="mt-1 text-sm text-slate-600">
                            {fonte.orgao || 'Órgão não informado'} • {fonte.esfera || '-'} • {fonte.area || '-'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(
                              fonte.status
                            )}`}
                          >
                            {statusLabel(fonte.status)}
                          </span>

                          {fonte.esfera && (
                            <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                              {fonte.esfera}
                            </span>
                          )}

                          {fonte.area && (
                            <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                              {fonte.area}
                            </span>
                          )}
                        </div>

                        <p className="text-sm leading-6 text-slate-700">
                          {fonte.descricao || 'Sem descrição cadastrada.'}
                        </p>

                        {fonte.site_oficial && (
                          <a
                            href={fonte.site_oficial}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
                          >
                            Acessar site oficial
                            <ExternalLink size={15} />
                          </a>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/projetos-captacao/fontes?editar=${fonte.id}`}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Editar
                        </a>

                        {fonte.status === 'ativa' ? (
                          <form action={inativarFonteRecurso}>
                            <input type="hidden" name="id" value={fonte.id} />
                            <button
                              type="submit"
                              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                            >
                              Inativar
                            </button>
                          </form>
                        ) : (
                          <form action={ativarFonteRecurso}>
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
                Nenhuma fonte encontrada.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}