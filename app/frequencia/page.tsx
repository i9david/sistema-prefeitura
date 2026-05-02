import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModuloCentroCulturalNav } from '@/components/modulo-centro-cultural-nav'
import { exigirPermissaoPagina } from '@/lib/seguranca-paginas'
import { salvarFrequencia } from './actions'

type Professor = {
  id: string
  nome: string
  email: string
}

type Aula = {
  id: string
  nome: string
  modalidade_id: string
  dia_semana: string
  horario_inicio: string
  horario_fim: string
  status: string
}

type Modalidade = {
  id: string
  nome: string
}

type Aluno = {
  id: string
  nome: string
  aula_id: string
  status: string
}

type Frequencia = {
  aluno_id: string
  status: string
  observacoes: string | null
}

type AulaProfessor = {
  id: string
  aula_id: string
  professor_id: string
  funcao: string
}

function cardClassName() {
  return 'rounded-3xl border border-slate-200/80 bg-white/95 p-7 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'
}

export default async function FrequenciaPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    aula_id?: string
    data_aula?: string
  }>
}) {
  await exigirPermissaoPagina('Centro Cultural', 'Frequência', 'visualizar')

  const params = await searchParams
  const aulaIdSelecionada = params.aula_id?.trim() || ''
  const dataAulaSelecionada =
    params.data_aula?.trim() || new Date().toISOString().split('T')[0]

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('id, nome, email')
    .eq('email', user.email.toLowerCase())
    .eq('status', 'ativo')
    .maybeSingle()

  const { data: aulasData, error: erroAulas } = await supabase
    .from('aulas')
    .select('id, nome, modalidade_id, dia_semana, horario_inicio, horario_fim, status')
    .eq('status', 'ativa')
    .order('nome', { ascending: true })

  if (erroAulas) {
    redirect(`/frequencia?message=${encodeURIComponent(erroAulas.message)}`)
  }

  const { data: modalidadesData, error: erroModalidades } = await supabase
    .from('modalidades')
    .select('id, nome')
    .order('nome', { ascending: true })

  if (erroModalidades) {
    redirect(`/frequencia?message=${encodeURIComponent(erroModalidades.message)}`)
  }

  const { data: aulaProfessoresData, error: erroAulaProfessores } = await supabase
    .from('aula_professores')
    .select('id, aula_id, professor_id, funcao')

  if (erroAulaProfessores) {
    redirect(`/frequencia?message=${encodeURIComponent(erroAulaProfessores.message)}`)
  }

  const aulas = (aulasData ?? []) as Aula[]
  const modalidades = (modalidadesData ?? []) as Modalidade[]
  const aulaProfessores = (aulaProfessoresData ?? []) as AulaProfessor[]

  const aulasPermitidas = professor
    ? aulas.filter((aula) =>
        aulaProfessores.some(
          (vinculo) => vinculo.aula_id === aula.id && vinculo.professor_id === professor.id
        )
      )
    : aulas

  const aulaSelecionada = aulaIdSelecionada
    ? aulasPermitidas.find((aula) => aula.id === aulaIdSelecionada)
    : null

  const { data: alunosData, error: erroAlunos } = aulaSelecionada
    ? await supabase
        .from('alunos')
        .select('id, nome, aula_id, status')
        .eq('aula_id', aulaSelecionada.id)
        .eq('status', 'ativo')
        .order('nome', { ascending: true })
    : { data: [], error: null as any }

  if (erroAlunos) {
    redirect(`/frequencia?message=${encodeURIComponent(erroAlunos.message)}`)
  }

  const alunos = (alunosData ?? []) as Aluno[]

  const { data: frequenciasData, error: erroFrequencias } = aulaSelecionada
    ? await supabase
        .from('frequencias')
        .select('aluno_id, status, observacoes')
        .eq('aula_id', aulaSelecionada.id)
        .eq('data_aula', dataAulaSelecionada)
    : { data: [], error: null as any }

  if (erroFrequencias) {
    redirect(`/frequencia?message=${encodeURIComponent(erroFrequencias.message)}`)
  }

  const frequencias = (frequenciasData ?? []) as Frequencia[]

  function getModalidadeNome(modalidadeId: string) {
    return modalidades.find((modalidade) => modalidade.id === modalidadeId)?.nome || 'Sem modalidade'
  }

  function getDescricaoAula(aula: Aula) {
    const modalidadeNome = getModalidadeNome(aula.modalidade_id)
    return `${aula.nome} • ${modalidadeNome} • ${aula.dia_semana} • ${aula.horario_inicio} às ${aula.horario_fim}`
  }

  function getStatusAluno(alunoId: string) {
    return frequencias.find((f) => f.aluno_id === alunoId)?.status || ''
  }

  function getObservacaoAluno(alunoId: string) {
    return frequencias.find((f) => f.aluno_id === alunoId)?.observacoes || ''
  }

  return (
    <main className="min-h-screen p-6 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCentroCulturalNav currentPath="/frequencia" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Frequência por turma
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {professor
                ? `Professor identificado: ${professor.nome}. Aqui aparecem apenas suas turmas.`
                : 'Nenhum professor vinculado a este login. Exibindo todas as turmas.'}
            </p>
          </div>

          <div className={cardClassName()}>
            <form method="get" className="grid gap-4 md:grid-cols-[1fr_220px_140px]">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Turma
                </label>
                <select
                  name="aula_id"
                  required
                  defaultValue={aulaIdSelecionada}
                  className="w-full rounded-2xl border px-4 py-3"
                >
                  <option value="" disabled>
                    Selecione a turma
                  </option>
                  {aulasPermitidas.map((aula) => (
                    <option key={aula.id} value={aula.id}>
                      {getDescricaoAula(aula)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Data da aula
                </label>
                <input
                  type="date"
                  name="data_aula"
                  required
                  defaultValue={dataAulaSelecionada}
                  className="w-full rounded-2xl border px-4 py-3"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-white"
                >
                  Carregar
                </button>
              </div>
            </form>

            {params.message && (
              <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {params.message}
              </p>
            )}
          </div>

          {aulaSelecionada && (
            <div className={cardClassName()}>
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-slate-900">
                  Chamada da turma
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {getDescricaoAula(aulaSelecionada)}
                </p>
              </div>

              {alunos.length > 0 ? (
                <form action={salvarFrequencia} className="space-y-4">
                  <input type="hidden" name="aula_id" value={aulaSelecionada.id} />
                  <input type="hidden" name="data_aula" value={dataAulaSelecionada} />

                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50">
                          <th className="px-4 py-3 text-left">Aluno</th>
                          <th className="px-4 py-3 text-left">Presença</th>
                          <th className="px-4 py-3 text-left">Observação</th>
                        </tr>
                      </thead>

                      <tbody>
                        {alunos.map((aluno) => (
                          <tr key={aluno.id} className="border-b">
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {aluno.nome}
                            </td>

                            <td className="px-4 py-3">
                              <select
                                name={`status_${aluno.id}`}
                                defaultValue={getStatusAluno(aluno.id)}
                                className="w-full rounded-xl border px-3 py-2"
                                required
                              >
                                <option value="" disabled>
                                  Selecione
                                </option>
                                <option value="presente">Presente</option>
                                <option value="faltou">Faltou</option>
                              </select>
                            </td>

                            <td className="px-4 py-3">
                              <input
                                name={`observacoes_${aluno.id}`}
                                defaultValue={getObservacaoAluno(aluno.id)}
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
                      Salvar frequência
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-slate-600">
                  Nenhum aluno ativo encontrado nesta turma.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}