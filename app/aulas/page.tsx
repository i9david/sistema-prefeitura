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
  ativarAula,
  atualizarAula,
  criarAula,
  inativarAula,
} from './actions'

const diasSemana = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
]

type ModalidadeRelacionada =
  | { id: string; nome: string }
  | { id: string; nome: string }[]
  | null

type ProfessorRelacionado =
  | { id: string; nome: string }
  | { id: string; nome: string }[]
  | null

type AulaProfessorRelacionada = {
  id: string
  aula_id: string
  professor_id: string
}

type Aula = {
  id: string
  nome: string
  modalidade_id: string
  dia_semana: string
  horario_inicio: string
  horario_fim: string
  status: string
  created_at: string
  modalidades: ModalidadeRelacionada
  aula_professores: AulaProfessorRelacionada[] | null
}

function getModalidadeNome(modalidades: ModalidadeRelacionada) {
  if (!modalidades) return 'Sem modalidade'
  if (Array.isArray(modalidades)) return modalidades[0]?.nome ?? 'Sem modalidade'
  return modalidades.nome
}

function getProfessorNome(professor: ProfessorRelacionado) {
  if (!professor) return null
  if (Array.isArray(professor)) return professor[0]?.nome ?? null
  return professor.nome
}

function getProfessoresNomes(aulaProfessores: AulaProfessorRelacionada[] | null, professores: { id: string; nome: string }[]) {
  if (!aulaProfessores) return 'Sem professor'

  const nomes = aulaProfessores
    .map((vinculo) => professores.find((p) => p.id === vinculo.professor_id)?.nome)
    .filter((nome): nome is string => Boolean(nome))

  return nomes.length > 0 ? nomes.join(', ') : 'Sem professor'
}

function cardClassName() {
  return 'ui-card p-5'
}

export default async function AulasPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    busca?: string
    editar?: string
    novo?: string
  }>
}) {
  await exigirPermissaoPagina('Centro Cultural', 'Aulas', 'visualizar')

  const params = await searchParams
  const busca = params.busca?.trim() || ''
  const editarId = params.editar?.trim() || ''
  const modoNovo = params.novo === '1'

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: modalidades, error: erroModalidades },
    { data: professoresData, error: erroProfessores },
    { data: aulaProfessoresData, error: erroAulaProfessores },
  ] = await Promise.all([
    supabase
      .from('modalidades')
      .select('id, nome, status')
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

  if (erroModalidades) {
    redirect(`/aulas?message=${encodeURIComponent(erroModalidades.message)}`)
  }

  if (erroProfessores) {
    redirect(`/aulas?message=${encodeURIComponent(erroProfessores.message)}`)
  }

  if (erroAulaProfessores) {
    redirect(`/aulas?message=${encodeURIComponent(erroAulaProfessores.message)}`)
  }

  const professores = (professoresData ?? []) as { id: string; nome: string }[]
  const aulaProfessores = (aulaProfessoresData ?? []) as AulaProfessorRelacionada[]

  let query = supabase
    .from('aulas')
    .select(`
      id,
      nome,
      modalidade_id,
      dia_semana,
      horario_inicio,
      horario_fim,
      status,
      created_at,
      modalidades!aulas_modalidade_id_fkey ( id, nome ),
      aula_professores!aula_professores_aula_id_fkey ( id, aula_id, professor_id )
    `)
    .order('dia_semana', { ascending: true })
    .order('horario_inicio', { ascending: true })

  if (busca) {
    query = query.ilike('nome', `%${busca}%`)
  }

  const { data: aulasData, error } = await query

  if (error) {
    redirect(`/aulas?message=${encodeURIComponent(error.message)}`)
  }

  const aulas = (aulasData ?? []) as Aula[]

  const aulaEditando = editarId
    ? aulas.find((aula) => aula.id === editarId)
    : null

  const mostrarFormulario = modoNovo || !!aulaEditando

  function aulasDoDia(dia: string) {
    return aulas.filter((aula) => aula.dia_semana === dia)
  }

  return (
    <PageShell
      nav={<ModuloCentroCulturalNav currentPath="/aulas" />}
      title="Grade de aulas"
      subtitle="Cadastre os dias e horários das aulas do Centro Cultural."
      primaryAction={
        !mostrarFormulario ? { label: 'Nova aula', href: '/aulas?novo=1' } : null
      }
    >
      {mostrarFormulario && (
        <div className={cardClassName()}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-slate-900">
              {aulaEditando ? 'Editar aula' : 'Nova aula'}
            </h2>

            <a href="/aulas" className="btn-secondary">
              Voltar para lista
            </a>
          </div>

          <form
            action={aulaEditando ? atualizarAula : criarAula}
            className="mt-6 grid gap-4"
          >
            {aulaEditando && (
              <input type="hidden" name="id" value={aulaEditando.id} />
            )}

            <FormField label="Nome da aula ou turma">
              <TextInput
                name="nome"
                placeholder="Ex: Ballet infantil - Turma A"
                required
                defaultValue={aulaEditando?.nome ?? ''}
              />
            </FormField>

            <FormField label="Modalidade">
              <SelectInput
                name="modalidade_id"
                required
                defaultValue={aulaEditando?.modalidade_id ?? ''}
              >
                <option value="" disabled>
                  Selecione a modalidade
                </option>
                {modalidades?.map((modalidade) => (
                  <option key={modalidade.id} value={modalidade.id}>
                    {modalidade.nome}
                  </option>
                ))}
              </SelectInput>
            </FormField>

            <FormField label="Dia da semana">
              <SelectInput
                name="dia_semana"
                required
                defaultValue={aulaEditando?.dia_semana ?? ''}
              >
                <option value="" disabled>
                  Selecione o dia
                </option>
                {diasSemana.map((dia) => (
                  <option key={dia} value={dia}>
                    {dia}
                  </option>
                ))}
              </SelectInput>
            </FormField>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Horário de início">
                <TextInput
                  name="horario_inicio"
                  type="time"
                  required
                  defaultValue={aulaEditando?.horario_inicio ?? ''}
                />
              </FormField>

              <FormField label="Horário de fim">
                <TextInput
                  name="horario_fim"
                  type="time"
                  required
                  defaultValue={aulaEditando?.horario_fim ?? ''}
                />
              </FormField>
            </div>

            <FormField label="Status">
              <SelectInput
                name="status"
                required
                defaultValue={aulaEditando?.status ?? ''}
              >
                <option value="" disabled>
                  Selecione o status
                </option>
                <option value="ativa">Ativa</option>
                <option value="inativa">Inativa</option>
              </SelectInput>
            </FormField>

            <FormMessage>{params.message}</FormMessage>

            <FormActions>
              <button type="submit" className="btn-primary">
                {aulaEditando ? 'Atualizar aula' : 'Salvar aula'}
              </button>

              <a href="/aulas" className="btn-secondary">
                Cancelar
              </a>
            </FormActions>
          </form>
        </div>
      )}

      <PageFilters>
        <form method="get" className="flex w-full max-w-md gap-2">
          <TextInput
            type="text"
            name="busca"
            placeholder="Buscar por nome da aula"
            defaultValue={busca}
          />
          <button type="submit" className="btn-primary">
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
        title="Lista de aulas"
        subtitle="Busque, edite, ative e inative horários."
      >
        {aulas.length > 0 ? (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="px-4 py-3 text-left">Aula</th>
                  <th className="px-4 py-3 text-left">Modalidade</th>
                  <th className="px-4 py-3 text-left">Professor</th>
                  <th className="px-4 py-3 text-left">Dia</th>
                  <th className="px-4 py-3 text-left">Início</th>
                  <th className="px-4 py-3 text-left">Fim</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Ações</th>
                </tr>
              </thead>

              <tbody>
                {aulas.map((aula) => (
                  <tr key={aula.id} className="border-b">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {aula.nome}
                    </td>
                    <td className="px-4 py-3">
                      {getModalidadeNome(aula.modalidades)}
                    </td>
                    <td className="px-4 py-3">
                      {getProfessoresNomes(aula.aula_professores, professores)}
                    </td>
                    <td className="px-4 py-3">{aula.dia_semana}</td>
                    <td className="px-4 py-3">{aula.horario_inicio}</td>
                    <td className="px-4 py-3">{aula.horario_fim}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          aula.status === 'ativa'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {aula.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <a
                          href={`/aulas?editar=${aula.id}${
                            busca ? `&busca=${encodeURIComponent(busca)}` : ''
                          }`}
                          className="btn-secondary py-2"
                        >
                          Editar
                        </a>

                        {aula.status === 'ativa' ? (
                          <form action={inativarAula}>
                            <input type="hidden" name="id" value={aula.id} />
                            <button type="submit" className="btn-danger w-full py-2">
                              Inativar
                            </button>
                          </form>
                        ) : (
                          <form action={ativarAula}>
                            <input type="hidden" name="id" value={aula.id} />
                            <button
                              type="submit"
                              className="w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white"
                            >
                              Ativar
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <PageEmptyState>
            Nenhuma aula encontrada.
          </PageEmptyState>
        )}
      </PageList>

      <PageList
        title="Grade semanal"
        subtitle="Visualização dos dias e horários das aulas."
      >
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {diasSemana.map((dia) => {
            const lista = aulasDoDia(dia)

            return (
              <div
                key={dia}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <h3 className="text-lg font-bold text-slate-900">{dia}</h3>

                {lista.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {lista.map((aula) => (
                      <div
                        key={aula.id}
                        className="rounded-2xl bg-white p-4 shadow-sm"
                      >
                        <p className="font-semibold text-slate-900">
                          {aula.nome}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {getModalidadeNome(aula.modalidades)}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {getProfessoresNomes(aula.aula_professores, professores)}
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-800">
                          {aula.horario_inicio} às {aula.horario_fim}
                        </p>
                        <p className="mt-2">
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                              aula.status === 'ativa'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {aula.status}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    Nenhuma aula cadastrada
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </PageList>
    </PageShell>
  )
}
