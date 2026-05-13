import { redirect } from 'next/navigation'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { InputTelefone } from '@/components/InputTelefone'
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
  ativarAluno,
  atualizarAluno,
  criarAluno,
  inativarAluno,
} from './actions'

type Relacao<T> = T | T[] | null

type Pessoa = {
  id: string
  nome: string
  telefone: string | null
  data_nascimento: string | null
}

type ModalidadeRelacionada = {
  id: string
  nome: string
}

type ProfessorRelacionado = {
  id: string
  nome: string
}

type AulaProfessorRelacionada = {
  id: string
  aula_id: string
  professor_id: string
}

type AulaRelacionada = {
  id: string
  nome: string
  modalidade_id: string
  dia_semana: string
  horario_inicio: string
  horario_fim: string
  status: string
  modalidades: Relacao<ModalidadeRelacionada>
}

type Matricula = {
  id: string
  aluno_id: string
  status: string
  data_inicio: string
  data_fim: string | null
  aula_id: string
}

type Aluno = {
  id: string
  pessoa_id: string | null
  nome: string
  telefone: string | null
  data_nascimento: string | null
  aula_id: string
  status: string
  biometria_cadastrada: boolean
}

type AulaOpcao = AulaRelacionada

type Frequencia = {
  aluno_id: string
  status: string
  data_aula: string
}

function cardClassName() {
  return 'ui-card p-5'
}

function normalizarRelacao<T>(relacao: Relacao<T>) {
  if (!relacao) return null
  if (Array.isArray(relacao)) return relacao[0] ?? null
  return relacao
}

function getMatriculasAtivas(aluno: Aluno, matriculasByAlunoId: Map<string, Matricula[]>) {
  return matriculasByAlunoId.get(aluno.id)?.filter((matricula) => matricula.status === 'ativo') ?? []
}

function getAulasAtivas(
  aluno: Aluno,
  matriculasByAlunoId: Map<string, Matricula[]>,
  aulasById: Map<string, AulaRelacionada>
) {
  const aulasMatriculas = getMatriculasAtivas(aluno, matriculasByAlunoId)
    .map((matricula) => aulasById.get(matricula.aula_id))
    .filter((aula): aula is AulaRelacionada => Boolean(aula))

  if (aulasMatriculas.length > 0) return aulasMatriculas

  const aulaLegada = aulasById.get(aluno.aula_id) ?? null
  return aulaLegada ? [aulaLegada] : []
}

function getAula(
  aluno: Aluno,
  matriculasByAlunoId: Map<string, Matricula[]>,
  aulasById: Map<string, AulaRelacionada>
) {
  return getAulasAtivas(aluno, matriculasByAlunoId, aulasById)[0] ?? null
}

function getPessoa(aluno: Aluno, pessoasById: Map<string, Pessoa>) {
  if (!aluno.pessoa_id) return null
  return pessoasById.get(aluno.pessoa_id) ?? null
}

function getModalidade(aula: AulaRelacionada | null) {
  return normalizarRelacao(aula?.modalidades ?? null)
}

function getProfessores(aula: AulaRelacionada | null, aulaProfessores: AulaProfessorRelacionada[], professores: ProfessorRelacionado[]) {
  if (!aula) return []

  const professorIds = aulaProfessores
    .filter((vinculo) => vinculo.aula_id === aula.id)
    .map((vinculo) => vinculo.professor_id)
  
  return professores.filter((professor) => professorIds.includes(professor.id))
}

function getProfessoresAulas(aulas: AulaRelacionada[], aulaProfessores: AulaProfessorRelacionada[], professores: ProfessorRelacionado[]) {
  const professoresPorId = new Map<string, ProfessorRelacionado>()

  aulas.forEach((aula) => {
    getProfessores(aula, aulaProfessores, professores).forEach((professor) => {
      professoresPorId.set(professor.id, professor)
    })
  })

  return Array.from(professoresPorId.values())
}

function aulaAtendeFiltros(aula: AulaRelacionada, filtros: {
  aulaId: string
  modalidadeId: string
  professorId: string
}, aulaProfessores: AulaProfessorRelacionada[], professores: ProfessorRelacionado[]) {
  if (filtros.aulaId && aula.id !== filtros.aulaId) return false
  if (filtros.modalidadeId && aula.modalidade_id !== filtros.modalidadeId) return false
  if (
    filtros.professorId &&
    !getProfessores(aula, aulaProfessores, professores).some((professor) => professor.id === filtros.professorId)
  ) {
    return false
  }

  return true
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

function formatarData(data: string | null | undefined) {
  if (!data) return '-'
  const partes = data.split('-')
  if (partes.length !== 3) return data
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function getDescricaoAula(aula: AulaOpcao) {
  const modalidadeNome = getModalidade(aula)?.nome ?? 'Sem modalidade'
  return `${aula.nome} • ${modalidadeNome} • ${aula.dia_semana} • ${aula.horario_inicio} às ${aula.horario_fim}`
}

function contarPresencas(frequencias: Frequencia[], alunoId: string) {
  return frequencias.filter(
    (frequencia) =>
      frequencia.aluno_id === alunoId &&
      String(frequencia.status).toLowerCase() === 'presente'
  ).length
}

function contarFaltas(frequencias: Frequencia[], alunoId: string) {
  return frequencias.filter((frequencia) => {
    if (frequencia.aluno_id !== alunoId) return false
    const status = String(frequencia.status).toLowerCase()
    return status === 'faltou' || status === 'falta'
  }).length
}

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    busca?: string
    editar?: string
    novo?: string
    aula_id?: string
    modalidade_id?: string
    professor_id?: string
    status?: string
  }>
}) {
  await exigirPermissaoPagina('Centro Cultural', 'Alunos', 'visualizar')

  const params = await searchParams
  const busca = params.busca?.trim() || ''
  const editarId = params.editar?.trim() || ''
  const modoNovo = params.novo === '1'
  const aulaFiltro = params.aula_id?.trim() || ''
  const modalidadeFiltro = params.modalidade_id?.trim() || ''
  const professorFiltro = params.professor_id?.trim() || ''
  const statusFiltro = params.status?.trim() || ''

  const supabase = await createClient()

  const [
    { data: aulasData, error: aulasError },
    { data: modalidadesData, error: modalidadesError },
    { data: professoresData, error: professoresError },
    { data: aulaProfessoresData, error: aulaProfessoresError },
  ] = await Promise.all([
    supabase
      .from('aulas')
      .select(`
        id,
        nome,
        modalidade_id,
        dia_semana,
        horario_inicio,
        horario_fim,
        status,
        modalidades!aulas_modalidade_id_fkey ( id, nome )
      `)
      .eq('status', 'ativa')
      .order('nome', { ascending: true }),
    supabase
      .from('modalidades')
      .select('id, nome')
      .eq('status', 'ativa')
      .order('nome', { ascending: true }),
    supabase
      .from('professores')
      .select('id, nome')
      .eq('status', 'ativo')
      .order('nome', { ascending: true }),
    supabase
      .from('aula_professores')
      .select('id, aula_id, professor_id'),
  ])

  if (aulasError) {
    redirect(`/alunos?message=${encodeURIComponent(aulasError.message)}`)
  }

  if (modalidadesError) {
    redirect(`/alunos?message=${encodeURIComponent(modalidadesError.message)}`)
  }

  if (professoresError) {
    redirect(`/alunos?message=${encodeURIComponent(professoresError.message)}`)
  }

  if (aulaProfessoresError) {
    redirect(`/alunos?message=${encodeURIComponent(aulaProfessoresError.message)}`)
  }

  const aulas = (aulasData ?? []) as unknown as AulaOpcao[]
  const modalidades = (modalidadesData ?? []) as ModalidadeRelacionada[]
  const professores = (professoresData ?? []) as ProfessorRelacionado[]
  const aulaProfessores = (aulaProfessoresData ?? []) as AulaProfessorRelacionada[]

  const { data: alunosData, error } = await supabase
    .from('alunos')
    .select('id, pessoa_id, nome, telefone, data_nascimento, aula_id, status, biometria_cadastrada')
    .order('nome', { ascending: true })

  if (error) {
    redirect(`/alunos?message=${encodeURIComponent(error.message)}`)
  }

  const alunosBrutos = (alunosData ?? []) as Aluno[]
  const alunoIdsBrutos = alunosBrutos.map((aluno) => aluno.id)
  const pessoaIds = Array.from(
    new Set(alunosBrutos.map((aluno) => aluno.pessoa_id).filter(Boolean) as string[])
  )

  const { data: pessoasData, error: pessoasError } =
    pessoaIds.length > 0
      ? await supabase
          .from('pessoas')
          .select('id, nome, telefone, data_nascimento')
          .in('id', pessoaIds)
      : { data: [], error: null }

  if (pessoasError) {
    redirect(`/alunos?message=${encodeURIComponent(pessoasError.message)}`)
  }

  const { data: alunoMatriculasData, error: alunoMatriculasError } =
    alunoIdsBrutos.length > 0
      ? await supabase
          .from('aluno_matriculas')
          .select('id, aluno_id, status, data_inicio, data_fim, aula_id')
          .in('aluno_id', alunoIdsBrutos)
      : { data: [], error: null }

  if (alunoMatriculasError) {
    redirect(`/alunos?message=${encodeURIComponent(alunoMatriculasError.message)}`)
  }

  const pessoas = (pessoasData ?? []) as Pessoa[]
  const matriculas = (alunoMatriculasData ?? []) as Matricula[]
  const pessoasById = new Map(pessoas.map((pessoa) => [pessoa.id, pessoa]))
  const aulasById = new Map((aulas as AulaRelacionada[]).map((aula) => [aula.id, aula]))
  const matriculasByAlunoId = new Map<string, Matricula[]>()

  matriculas.forEach((matricula) => {
    const itens = matriculasByAlunoId.get(matricula.aluno_id) ?? []
    itens.push(matricula)
    matriculasByAlunoId.set(matricula.aluno_id, itens)
  })

  const aulasFiltradasIds = aulas
    .filter((aula) => {
      const professoresDaAula = getProfessores(aula, aulaProfessores, professores)

      if (aulaFiltro && aula.id !== aulaFiltro) return false
      if (modalidadeFiltro && aula.modalidade_id !== modalidadeFiltro) return false
      if (
        professorFiltro &&
        !professoresDaAula.some((professor) => professor.id === professorFiltro)
      ) {
        return false
      }

      return true
    })
    .map((aula) => aula.id)

  const alunos =
    aulaFiltro || modalidadeFiltro || professorFiltro
      ? alunosBrutos.filter((aluno) => {
          if (aulasFiltradasIds.length === 0) return false

          return getAulasAtivas(aluno, matriculasByAlunoId, aulasById).some(
            (aula) =>
              aulasFiltradasIds.includes(aula.id) &&
              aulaAtendeFiltros(
                aula,
                {
                  aulaId: aulaFiltro,
                  modalidadeId: modalidadeFiltro,
                  professorId: professorFiltro,
                },
                aulaProfessores,
                professores
              )
          )
        })
      : alunosBrutos
  const alunoIds = alunos.map((aluno) => aluno.id)

  const { data: frequenciasData, error: frequenciasError } =
    alunoIds.length > 0
      ? await supabase
          .from('frequencias')
          .select('aluno_id, status, data_aula')
          .in('aluno_id', alunoIds)
      : { data: [], error: null }

  if (frequenciasError) {
    redirect(`/alunos?message=${encodeURIComponent(frequenciasError.message)}`)
  }

  const frequencias = (frequenciasData ?? []) as Frequencia[]

  const alunoEditando = editarId
    ? alunos.find((aluno) => aluno.id === editarId)
    : null
  const pessoaEditando = alunoEditando ? getPessoa(alunoEditando, pessoasById) : null
  const aulaEditando = alunoEditando
    ? getAula(alunoEditando, matriculasByAlunoId, aulasById)
    : null

  const mostrarFormulario = modoNovo || !!alunoEditando

  const totalAtivos = alunos.filter((aluno) => aluno.status === 'ativo').length
  const totalInativos = alunos.filter((aluno) => aluno.status === 'inativo').length
  const totalPresencas = frequencias.filter(
    (frequencia) => String(frequencia.status).toLowerCase() === 'presente'
  ).length
  const totalFaltas = frequencias.filter((frequencia) => {
    const status = String(frequencia.status).toLowerCase()
    return status === 'faltou' || status === 'falta'
  }).length

  const relatorioProfessores = professores
    .map((professor) => {
      const alunosDoProfessor = alunos.filter((aluno) =>
        getAulasAtivas(aluno, matriculasByAlunoId, aulasById).some((aula) =>
          getProfessores(aula, aulaProfessores, professores).some((item) => item.id === professor.id)
        )
      )

      return {
        professor,
        total: alunosDoProfessor.length,
        ativos: alunosDoProfessor.filter((aluno) => aluno.status === 'ativo').length,
        presencas: alunosDoProfessor.reduce(
          (total, aluno) => total + contarPresencas(frequencias, aluno.id),
          0
        ),
      }
    })
    .filter((item) => item.total > 0)

  return (
    <PageShell
      nav={<ModuloCentroCulturalNav currentPath="/alunos" />}
      title="Alunos"
      subtitle="Cadastro integrado com pessoas, modalidades, professores e frequência."
      primaryAction={
        !mostrarFormulario ? { label: 'Novo aluno', href: '/alunos?novo=1' } : null
      }
    >

          <div className="grid gap-4 md:grid-cols-4">
            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Alunos filtrados</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{alunos.length}</p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Ativos</p>
              <p className="mt-2 text-3xl font-bold text-green-700">{totalAtivos}</p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Inativos</p>
              <p className="mt-2 text-3xl font-bold text-red-700">{totalInativos}</p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Presenças / faltas</p>
              <p className="mt-2 text-3xl font-bold text-blue-700">
                {totalPresencas}/{totalFaltas}
              </p>
            </div>
          </div>

          {mostrarFormulario && (
            <div className={cardClassName()}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {alunoEditando ? 'Editar aluno' : 'Novo aluno'}
                </h2>

                <a
                  href="/alunos"
                  className="btn-secondary"
                >
                  Voltar para lista
                </a>
              </div>

              <form
                action={alunoEditando ? atualizarAluno : criarAluno}
                className="mt-6 grid gap-4"
              >
                {alunoEditando && (
                  <input type="hidden" name="id" value={alunoEditando.id} />
                )}

                <FormField label="Nome completo">
                  <TextInput
                    name="nome"
                    placeholder="Nome completo do aluno"
                    required
                    defaultValue={alunoEditando?.nome ?? pessoaEditando?.nome ?? ''}
                  />
                </FormField>

                <div className="grid gap-4 md:grid-cols-2">
                  <InputTelefone
                    label="Telefone"
                    prefix="Tel."
                    defaultValue={alunoEditando?.telefone ?? pessoaEditando?.telefone ?? ''}
                  />

                  <FormField label="Data de nascimento">
                    <TextInput
                      name="data_nascimento"
                      type="date"
                      defaultValue={
                        alunoEditando?.data_nascimento ??
                        pessoaEditando?.data_nascimento ??
                        ''
                      }
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Turma / modalidade">
                    <SelectInput
                      name="aula_id"
                      required
                      defaultValue={aulaEditando?.id ?? alunoEditando?.aula_id ?? ''}
                    >
                      <option value="" disabled>
                        Selecione a turma
                      </option>
                      {aulas.map((aula) => (
                        <option key={aula.id} value={aula.id}>
                          {getDescricaoAula(aula)}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>

                  <FormField label="Status">
                    <SelectInput
                      name="status"
                      required
                      defaultValue={alunoEditando?.status ?? 'ativo'}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </SelectInput>
                  </FormField>
                </div>

                <FormMessage>{params.message}</FormMessage>

                <FormActions>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {alunoEditando ? 'Atualizar aluno' : 'Salvar aluno'}
                  </button>

                  <a
                    href="/alunos"
                    className="btn-secondary"
                  >
                    Cancelar
                  </a>
                </FormActions>
              </form>
            </div>
          )}

          <PageFilters>
              <form method="get" className="grid w-full max-w-6xl gap-2 md:grid-cols-6">
                <TextInput
                  type="text"
                  name="busca"
                  placeholder="Buscar por nome"
                  defaultValue={busca}
                />

                <SelectInput
                  name="modalidade_id"
                  defaultValue={modalidadeFiltro}
                >
                  <option value="">Todas modalidades</option>
                  {modalidades.map((modalidade) => (
                    <option key={modalidade.id} value={modalidade.id}>
                      {modalidade.nome}
                    </option>
                  ))}
                </SelectInput>

                <SelectInput
                  name="professor_id"
                  defaultValue={professorFiltro}
                >
                  <option value="">Todos professores</option>
                  {professores.map((professor) => (
                    <option key={professor.id} value={professor.id}>
                      {professor.nome}
                    </option>
                  ))}
                </SelectInput>

                <SelectInput
                  name="aula_id"
                  defaultValue={aulaFiltro}
                >
                  <option value="">Todas as turmas</option>
                  {aulas.map((aula) => (
                    <option key={aula.id} value={aula.id}>
                      {aula.nome}
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
            title="Lista de alunos"
            subtitle="Busque, filtre, edite, ative e inative registros."
            meta={
              <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                Registros: {alunos.length}
              </div>
            }
          >
            {alunos.length > 0 ? (
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Nome</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Telefone</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Modalidade</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Professor</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Turma</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Presenças</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {alunos.map((aluno) => {
                      const aulasAtivas = getAulasAtivas(aluno, matriculasByAlunoId, aulasById)
                      const pessoa = getPessoa(aluno, pessoasById)
                      const professoresDasAulas = getProfessoresAulas(aulasAtivas, aulaProfessores, professores)
                      const presencas = contarPresencas(frequencias, aluno.id)
                      const faltas = contarFaltas(frequencias, aluno.id)

                      return (
                        <tr key={aluno.id} className="bg-slate-50">
                          <td className="rounded-l-2xl px-4 py-4 font-medium text-slate-900">
                            <div>{aluno.nome || pessoa?.nome}</div>
                            <div className="text-xs font-normal text-slate-500">
                              Nascimento: {formatarData(aluno.data_nascimento ?? pessoa?.data_nascimento)}
                            </div>
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {formatarTelefone(aluno.telefone ?? pessoa?.telefone)}
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {aulasAtivas.length > 0 ? (
                              <div className="space-y-1">
                                {aulasAtivas.map((aulaAtiva) => (
                                  <div key={aulaAtiva.id}>
                                    {getModalidade(aulaAtiva)?.nome ?? 'Sem modalidade'}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {professoresDasAulas.length > 0
                              ? professoresDasAulas.map((professor) => professor.nome).join(', ')
                              : '-'}
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {aulasAtivas.length > 0 ? (
                              <div className="space-y-2">
                                {aulasAtivas.map((aulaAtiva) => {
                                  const professoresDaAula = getProfessores(aulaAtiva, aulaProfessores, professores)

                                  return (
                                    <div key={aulaAtiva.id} className="rounded-xl bg-white px-3 py-2">
                                      <div className="font-medium text-slate-900">
                                        {aulaAtiva.nome}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        {aulaAtiva.dia_semana} • {aulaAtiva.horario_inicio} às {aulaAtiva.horario_fim}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        {professoresDaAula.length > 0
                                          ? professoresDaAula.map((professor) => professor.nome).join(', ')
                                          : 'Sem professor'}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {presencas} presença(s), {faltas} falta(s)
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                aluno.status === 'ativo'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {aluno.status}
                            </span>
                          </td>

                          <td className="rounded-r-2xl px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <a
                                href={`/alunos?editar=${aluno.id}`}
                                className="btn-secondary py-2"
                              >
                                Editar
                              </a>

                              <a
                                href={`/alunos/biometria/${aluno.id}`}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                              >
                                Biometria
                              </a>

                              {aluno.status === 'ativo' ? (
                                <form action={inativarAluno}>
                                  <input type="hidden" name="id" value={aluno.id} />
                                  <button
                                    type="submit"
                                    className="btn-danger py-2"
                                  >
                                    Inativar
                                  </button>
                                </form>
                              ) : (
                                <form action={ativarAluno}>
                                  <input type="hidden" name="id" value={aluno.id} />
                                  <button
                                    type="submit"
                                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                                  >
                                    Ativar
                                  </button>
                                </form>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <PageEmptyState>
                Nenhum aluno encontrado.
              </PageEmptyState>
            )}
          </PageList>

          <PageList
            title="Relatório por professor"
            subtitle="Resumo dos alunos vinculados às turmas de cada professor."
            meta={
              <a
                href="/relatorios"
                className="btn-secondary"
              >
                Relatórios detalhados
              </a>
            }
          >

            {relatorioProfessores.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {relatorioProfessores.map((item) => (
                  <div key={item.professor.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="font-bold text-slate-900">{item.professor.nome}</h3>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500">Alunos</p>
                        <p className="text-xl font-bold text-slate-900">{item.total}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Ativos</p>
                        <p className="text-xl font-bold text-green-700">{item.ativos}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Presenças</p>
                        <p className="text-xl font-bold text-blue-700">{item.presencas}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <PageEmptyState>
                Nenhum professor encontrado para os filtros atuais.
              </PageEmptyState>
            )}
          </PageList>
    </PageShell>
  )
}
