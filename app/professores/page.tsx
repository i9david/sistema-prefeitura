import { redirect } from 'next/navigation'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuloCentroCulturalNav } from '@/components/modulo-centro-cultural-nav'
import { exigirPermissaoPagina } from '@/lib/seguranca-paginas'
import { PageEmptyState, PageFilters, PageList, PageShell } from '@/components/page-shell'
import {
  FormActions,
  FormField,
  FormMessage,
  SelectInput,
  TextInput,
} from '@/components/form'
import {
  ativarProfessor,
  atualizarProfessor,
  criarProfessor,
  inativarProfessor,
} from './actions'

type ModalidadeRelacionada =
  | { id: string; nome: string }
  | { id: string; nome: string }[]
  | null

type VinculoProfessor = {
  id: string
  professor_id: string
  funcao: string | null
  modalidades: ModalidadeRelacionada
}

type Professor = {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  status: string
  created_at: string
}

type AulaProfessor = {
  id: string
  nome: string
  dia_semana: string
  horario_inicio: string
  horario_fim: string
  status: string
}

type AulaRelacionada = AulaProfessor | AulaProfessor[] | null

type VinculoAulaProfessor = {
  id: string
  professor_id: string
  aulas: AulaRelacionada
}

type UsuarioSistema = {
  id: string
  nome: string
  email: string
  professor_id: string | null
  status: string
}

function getModalidadeNome(modalidades: ModalidadeRelacionada) {
  if (!modalidades) return 'Modalidade'
  if (Array.isArray(modalidades)) return modalidades[0]?.nome ?? 'Modalidade'
  return modalidades.nome
}

function getAulaRelacionada(aulas: AulaRelacionada) {
  if (!aulas) return null
  if (Array.isArray(aulas)) return aulas[0] ?? null
  return aulas
}

function formatarTelefone(valor: string | null | undefined) {
  const numeros = String(valor ?? '').replace(/\D/g, '').slice(0, 11)

  if (!numeros) return '-'

  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d+)/, '$1-$2')
  }

  return numeros
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d+)/, '$1-$2')
}

function cardClassName() {
  return 'ui-card p-5'
}

export default async function ProfessoresPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    busca?: string
    editar?: string
    novo?: string
    modalidade?: string
    status?: string
  }>
}) {
  await exigirPermissaoPagina('Centro Cultural', 'Professores', 'visualizar')

  const params = await searchParams
  const busca = params.busca?.trim() || ''
  const editarId = params.editar?.trim() || ''
  const modoNovo = params.novo === '1'
  const modalidadeFiltro = params.modalidade?.trim() || ''
  const statusFiltro = params.status?.trim() || ''

  const supabase = await createClient()

  let query = supabase
    .from('professores')
    .select('id, nome, email, telefone, status, created_at')
    .order('created_at', { ascending: false })

  if (busca) {
    query = query.ilike('nome', `%${busca}%`)
  }

  if (statusFiltro) {
    query = query.eq('status', statusFiltro)
  }

  const { data: professoresData, error } = await query

  if (error) {
    redirect(`/professores?message=${encodeURIComponent(error.message)}`)
  }

  const professores = (professoresData ?? []) as Professor[]

  const { data: vinculosData, error: erroVinculos } = await supabase
    .from('modalidade_professores')
    .select(`
      id,
      professor_id,
      funcao,
      modalidades!modalidade_professores_modalidade_id_fkey ( id, nome )
    `)

  if (erroVinculos) {
    redirect(`/professores?message=${encodeURIComponent(erroVinculos.message)}`)
  }

  const { data: modalidadesData, error: erroModalidades } = await supabase
    .from('modalidades')
    .select('id, nome, status')
    .eq('status', 'ativa')
    .order('nome', { ascending: true })

  if (erroModalidades) {
    redirect(`/professores?message=${encodeURIComponent(erroModalidades.message)}`)
  }

  const { data: aulasData, error: erroAulas } = await supabase
    .from('aula_professores')
    .select(`
      id,
      professor_id,
      aula_id
    `)
    .order('professor_id', { ascending: true })

  if (erroAulas) {
    redirect(`/professores?message=${encodeURIComponent(erroAulas.message)}`)
  }

  const aulaProfessorIds = Array.from(
    new Set(
      ((aulasData ?? []) as any[])
        .map((vinculo) => vinculo.aula_id)
        .filter(Boolean)
    )
  )

  const { data: aulasDetalhesData, error: erroAulasDetalhes } =
    aulaProfessorIds.length > 0
      ? await supabase
          .from('aulas')
          .select(`
            id,
            nome,
            dia_semana,
            horario_inicio,
            horario_fim,
            status
          `)
          .in('id', aulaProfessorIds)
      : { data: [], error: null }

  if (erroAulasDetalhes) {
    redirect(`/professores?message=${encodeURIComponent(erroAulasDetalhes.message)}`)
  }

  const { data: usuariosData, error: erroUsuarios } = await supabase
    .from('administrativo_usuarios')
    .select('id, nome, email, professor_id, status')

  if (erroUsuarios) {
    redirect(`/professores?message=${encodeURIComponent(erroUsuarios.message)}`)
  }

  const vinculos = (vinculosData ?? []) as VinculoProfessor[]
  const aulasVinculosRaw = (aulasData ?? []) as any[]
  const aulasDetalhes = new Map(
    ((aulasDetalhesData ?? []) as any[]).map((aula) => [aula.id, aula])
  )
  
  const aulas = aulasVinculosRaw.map((vinculo) => {
    const aulaDetalhes = aulasDetalhes.get(vinculo.aula_id)
    return {
      id: vinculo.id,
      professor_id: vinculo.professor_id,
      aulas: aulaDetalhes || null,
    }
  })

  const usuariosSistema = (usuariosData ?? []) as UsuarioSistema[]
  const modalidades = modalidadesData ?? []

  const professoresFiltrados = professores.filter((professor) => {
    if (!modalidadeFiltro) return true

    const modalidadesDoProfessor = vinculos
      .filter((vinculo) => vinculo.professor_id === professor.id)
      .map((vinculo) => {
        const rel = vinculo.modalidades
        if (!rel) return ''
        if (Array.isArray(rel)) return rel[0]?.id ?? ''
        return rel.id
      })

    return modalidadesDoProfessor.includes(modalidadeFiltro)
  })

  const professorEditando = editarId
    ? professores.find((professor) => professor.id === editarId)
    : null

  const mostrarFormulario = modoNovo || !!professorEditando

  function modalidadesDoProfessor(professorId: string) {
    return vinculos
      .filter((vinculo) => vinculo.professor_id === professorId)
      .map((vinculo) => {
        const nomeModalidade = getModalidadeNome(vinculo.modalidades)
        const funcao = vinculo.funcao ? ` (${vinculo.funcao})` : ''
        return `${nomeModalidade}${funcao}`
      })
  }

  function modalidadeIdsDoProfessor(professorId: string) {
    return vinculos
      .filter((vinculo) => vinculo.professor_id === professorId)
      .map((vinculo) => {
        const rel = vinculo.modalidades
        if (!rel) return ''
        if (Array.isArray(rel)) return rel[0]?.id ?? ''
        return rel.id
      })
      .filter(Boolean)
  }

  function turmasDoProfessor(professorId: string) {
    return aulas
      .filter((vinculo) => vinculo.professor_id === professorId)
      .map((vinculo) => getAulaRelacionada(vinculo.aulas))
      .filter((aula): aula is AulaProfessor => Boolean(aula))
      .sort((aulaAtual, proximaAula) => aulaAtual.nome.localeCompare(proximaAula.nome))
  }

  function usuarioDoProfessor(professorId: string) {
    return usuariosSistema.find((usuario) => usuario.professor_id === professorId) || null
  }

  return (
    <PageShell
      nav={<ModuloCentroCulturalNav currentPath="/professores" />}
      title="Professores"
      subtitle="Cadastre, vincule modalidades e acompanhe as turmas dos professores do Centro Cultural."
      primaryAction={
        !mostrarFormulario
          ? { label: 'Novo professor', href: '/professores?novo=1' }
          : null
      }
    >

          {mostrarFormulario && (
            <div className={cardClassName()}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {professorEditando ? 'Editar professor' : 'Novo professor'}
                </h2>

                <a
                  href="/professores"
                  className="btn-secondary"
                >
                  Voltar para lista
                </a>
              </div>

              <form
                action={professorEditando ? atualizarProfessor : criarProfessor}
                className="mt-6 grid gap-4"
              >
                {professorEditando && (
                  <input type="hidden" name="id" value={professorEditando.id} />
                )}

                <FormField label="Nome do professor">
                  <TextInput
                    name="nome"
                    placeholder="Nome completo"
                    required
                    defaultValue={professorEditando?.nome ?? ''}
                  />
                </FormField>

                <FormField label="E-mail de login">
                  <TextInput
                    name="email"
                    type="email"
                    placeholder="professor@email.com"
                    required
                    defaultValue={professorEditando?.email ?? ''}
                  />
                </FormField>

                <FormField label="Telefone">
                  <TextInput
                    name="telefone"
                    placeholder="(64) 99999-9999"
                    defaultValue={professorEditando?.telefone ?? ''}
                  />
                </FormField>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Modalidades vinculadas
                  </label>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {modalidades.map((modalidade) => {
                      const selecionada = professorEditando
                        ? modalidadeIdsDoProfessor(professorEditando.id).includes(modalidade.id)
                        : false

                      return (
                        <label
                          key={modalidade.id}
                          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <input
                            type="checkbox"
                            name="modalidade_ids"
                            value={modalidade.id}
                            defaultChecked={selecionada}
                          />
                          <span className="text-sm font-medium text-slate-700">
                            {modalidade.nome}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                <FormField label="Status">
                  <SelectInput
                    name="status"
                    required
                    defaultValue={professorEditando?.status ?? 'ativo'}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </SelectInput>
                </FormField>

                <FormMessage>{params.message}</FormMessage>

                <FormActions>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {professorEditando ? 'Atualizar professor' : 'Salvar professor'}
                  </button>

                  <a
                    href="/professores"
                    className="btn-secondary"
                  >
                    Cancelar
                  </a>
                </FormActions>
              </form>
            </div>
          )}

          <PageFilters>
              <form method="get" className="grid w-full max-w-4xl gap-2 md:grid-cols-4">
                <TextInput
                  type="text"
                  name="busca"
                  placeholder="Buscar por nome"
                  defaultValue={busca}
                />

                <SelectInput
                  name="modalidade"
                  defaultValue={modalidadeFiltro}
                >
                  <option value="">Todas as modalidades</option>
                  {modalidades.map((modalidade) => (
                    <option key={modalidade.id} value={modalidade.id}>
                      {modalidade.nome}
                    </option>
                  ))}
                </SelectInput>

                <SelectInput
                  name="status"
                  defaultValue={statusFiltro}
                >
                  <option value="">Todos os status</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </SelectInput>

                <button
                  type="submit"
                  className="btn-primary"
                >
                  Buscar
                </button>
              </form>

            {params.message && !mostrarFormulario && (
              <div className="mt-4">
                <FormMessage>{params.message}</FormMessage>
              </div>
            )}
          </PageFilters>

          <PageList
            title="Lista de professores"
            subtitle="Busque, filtre, edite, ative e inative registros."
            meta={
              <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                Registros: {professoresFiltrados.length}
              </div>
            }
          >
            {professoresFiltrados.length > 0 ? (
              <div className="space-y-4">
                {professoresFiltrados.map((professor) => {
                  const modalidadesProfessor = modalidadesDoProfessor(professor.id)
                  const turmasProfessor = turmasDoProfessor(professor.id)
                  const usuarioVinculado = usuarioDoProfessor(professor.id)

                  return (
                    <div
                      key={professor.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">
                              {professor.nome}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {professor.email || '-'}
                            </p>
                            <p className="text-sm text-slate-600">
                              {formatarTelefone(professor.telefone)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                professor.status === 'ativo'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {professor.status}
                            </span>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                usuarioVinculado
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {usuarioVinculado ? 'Usuário vinculado' : 'Sem usuário vinculado'}
                            </span>
                          </div>

                          <div>
                            <p className="mb-2 text-sm font-semibold text-slate-700">
                              Modalidades
                            </p>

                            {modalidadesProfessor.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {modalidadesProfessor.map((modalidade, index) => (
                                  <span
                                    key={`${professor.id}-${index}`}
                                    className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                                  >
                                    {modalidade}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500">
                                Sem modalidades vinculadas
                              </p>
                            )}
                          </div>

                          <div>
                            <p className="mb-2 text-sm font-semibold text-slate-700">
                              Turmas vinculadas
                            </p>

                            {turmasProfessor.length > 0 ? (
                              <div className="space-y-2">
                                {turmasProfessor.map((turma) => (
                                  <div
                                    key={turma.id}
                                    className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700"
                                  >
                                    <span className="font-semibold text-slate-900">
                                      {turma.nome}
                                    </span>{' '}
                                     {turma.dia_semana}  {turma.horario_inicio} às {turma.horario_fim}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500">
                                Sem turmas vinculadas
                              </p>
                            )}
                          </div>

                          {usuarioVinculado && (
                            <div>
                              <p className="mb-1 text-sm font-semibold text-slate-700">
                                Usuário do sistema
                              </p>
                              <p className="text-sm text-slate-600">
                                {usuarioVinculado.nome}  {usuarioVinculado.email}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`/professores?editar=${professor.id}${
                              busca ? `&busca=${encodeURIComponent(busca)}` : ''
                            }${
                              modalidadeFiltro
                                ? `&modalidade=${encodeURIComponent(modalidadeFiltro)}`
                                : ''
                            }${
                              statusFiltro
                                ? `&status=${encodeURIComponent(statusFiltro)}`
                                : ''
                            }`}
                            className="btn-secondary py-2"
                          >
                            Editar
                          </a>

                          {professor.status === 'ativo' ? (
                            <form action={inativarProfessor}>
                              <input type="hidden" name="id" value={professor.id} />
                              <button
                                type="submit"
                                className="btn-danger py-2"
                              >
                                Inativar
                              </button>
                            </form>
                          ) : (
                            <form action={ativarProfessor}>
                              <input type="hidden" name="id" value={professor.id} />
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
                  )
                })}
              </div>
            ) : (
              <PageEmptyState>
                Nenhum professor encontrado.
              </PageEmptyState>
            )}
          </PageList>
    </PageShell>
  )
}
