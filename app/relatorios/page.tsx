import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getContextoPermissoes } from '@/lib/get-permissoes'
import { RelatoriosFiltros } from '@/components/relatorios-filtros'

type SearchParams = Promise<{
  modalidade_id?: string
  aula_id?: string
  aluno_id?: string
  data_inicio?: string
  data_fim?: string
}>

type Modalidade = {
  id: string
  nome: string
}

type Aula = {
  id: string
  nome: string
  modalidade_id: string
  professor_id: string | null
}

type Aluno = {
  id: string
  nome: string
  aula_id: string
}

type RegistroFrequencia = {
  id: string
  aluno_id: string
  aula_id: string
  status: string
  data_aula: string
  alunos:
    | {
        nome: string
      }
    | {
        nome: string
      }[]
    | null
  aulas:
    | {
        nome: string
      }
    | {
        nome: string
      }[]
    | null
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200/80 bg-white/95 p-7 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'
}

function getNomeRelacao(
  relacao:
    | { nome: string }
    | { nome: string }[]
    | null
    | undefined,
  fallback = '-'
) {
  if (!relacao) return fallback
  if (Array.isArray(relacao)) return relacao[0]?.nome ?? fallback
  return relacao.nome
}

function formatarData(data: string | null | undefined) {
  if (!data) return '-'
  const partes = data.split('-')
  if (partes.length !== 3) return data
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams

  const modalidadeId = params.modalidade_id?.trim() || ''
  const aulaId = params.aula_id?.trim() || ''
  const alunoId = params.aluno_id?.trim() || ''
  const dataInicio = params.data_inicio?.trim() || ''
  const dataFim = params.data_fim?.trim() || ''

  const supabase = await createClient()
  const contexto = await getContextoPermissoes()

  if (!contexto.authUser) redirect('/login')
  if (!contexto.usuarioInterno) redirect('/dashboard')

  const usuarioInterno = contexto.usuarioInterno

  const { data: modalidadesData, error: modalidadesError } = await supabase
    .from('modalidades')
    .select('id, nome')
    .eq('status', 'ativa')
    .order('nome', { ascending: true })

  if (modalidadesError) {
    redirect(`/relatorios?message=${encodeURIComponent(modalidadesError.message)}`)
  }

  const { data: aulasData, error: aulasError } = await supabase
    .from('aulas')
    .select('id, nome, modalidade_id, professor_id')
    .eq('status', 'ativa')
    .order('nome', { ascending: true })

  if (aulasError) {
    redirect(`/relatorios?message=${encodeURIComponent(aulasError.message)}`)
  }

  const modalidades = (modalidadesData ?? []) as Modalidade[]
  let aulas = (aulasData ?? []) as Aula[]

  if (usuarioInterno.professor_id) {
    aulas = aulas.filter(
      (aula) => aula.professor_id === usuarioInterno.professor_id
    )
  }

  const modalidadesPermitidasIds = Array.from(
    new Set(aulas.map((aula) => aula.modalidade_id).filter(Boolean))
  )

  const modalidadesPermitidas = modalidades.filter((modalidade) =>
    modalidadesPermitidasIds.includes(modalidade.id)
  )

  const { data: alunosBase, error: alunosError } = await supabase
    .from('alunos')
    .select('id, nome, aula_id')
    .eq('status', 'ativo')
    .order('nome', { ascending: true })

  if (alunosError) {
    redirect(`/relatorios?message=${encodeURIComponent(alunosError.message)}`)
  }

  let alunos = (alunosBase ?? []) as Aluno[]

  const aulaIdsPermitidos = aulas.map((aula) => aula.id)
  alunos = alunos.filter((aluno) => aulaIdsPermitidos.includes(aluno.aula_id))

  let query = supabase.from('frequencias').select(`
      id,
      aluno_id,
      aula_id,
      status,
      data_aula,
      alunos ( nome ),
      aulas ( nome )
    `)

  if (aulaId) query = query.eq('aula_id', aulaId)
  if (alunoId) query = query.eq('aluno_id', alunoId)
  if (dataInicio) query = query.gte('data_aula', dataInicio)
  if (dataFim) query = query.lte('data_aula', dataFim)

  const { data: registrosData, error: registrosError } = await query.order(
    'data_aula',
    { ascending: false }
  )

  if (registrosError) {
    redirect(`/relatorios?message=${encodeURIComponent(registrosError.message)}`)
  }

  const registros = (registrosData ?? []) as RegistroFrequencia[]

  const totalRegistros = registros.length
  const totalPresentes = registros.filter(
    (registro) => String(registro.status ?? '').toLowerCase() === 'presente'
  ).length
  const totalFaltas = registros.filter((registro) => {
    const status = String(registro.status ?? '').toLowerCase()
    return status === 'faltou' || status === 'falta'
  }).length

  return (
    <main className="min-h-screen p-6 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <<Sidebar currentPath="/" /> currentPath="/relatorios" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Relatórios do Centro Cultural
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Consulte frequência por modalidade, turma, aluno e período
            </p>
          </div>

          <div className={cardClassName()}>
            <RelatoriosFiltros
              modalidades={modalidadesPermitidas}
              aulas={aulas}
              alunos={alunos}
              modalidadeId={modalidadeId}
              aulaId={aulaId}
              alunoId={alunoId}
              dataInicio={dataInicio}
              dataFim={dataFim}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Registros</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalRegistros}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Presenças</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalPresentes}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Faltas</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalFaltas}
              </p>
            </div>
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Resultado do relatório
            </h2>

            {registros.length > 0 ? (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="px-4 py-3 text-left">Aluno</th>
                      <th className="px-4 py-3 text-left">Turma</th>
                      <th className="px-4 py-3 text-left">Data</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {registros.map((registro) => (
                      <tr key={registro.id} className="border-b">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {getNomeRelacao(registro.alunos)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {getNomeRelacao(registro.aulas)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatarData(registro.data_aula)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              String(registro.status ?? '').toLowerCase() === 'presente'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {registro.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhum registro encontrado com os filtros informados.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}