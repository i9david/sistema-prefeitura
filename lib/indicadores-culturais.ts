import { createTenantClient } from '@/lib/supabase/tenant-server'

type Relacao<T> = T | T[] | null

type AlunoRelacionado = {
  status: string
}

type ModalidadeRelacionada = {
  id: string
  nome: string
}

type AulaRelacionada = {
  id: string
  modalidades: Relacao<ModalidadeRelacionada>
}

type MatriculaIndicador = {
  id: string
  aluno_id: string
  aula_id: string
  status: string
  data_inicio: string
  data_fim: string | null
  alunos: Relacao<AlunoRelacionado>
  aulas: Relacao<AulaRelacionada>
}

type FrequenciaIndicador = {
  aula_id: string
  status: string
}

export type RankingModalidade = {
  modalidadeId: string
  modalidade: string
  alunosAtivos: number
  frequenciaMedia: number
}

export type IndicadoresGestaoCultural = {
  periodo: {
    dataInicio: string
    dataFim: string
  }
  totalAlunosAtivos: number
  taxaEvasao: number
  totalEvasoes: number
  totalMatriculasPeriodo: number
  frequenciaMedia: number
  totalLancamentosFrequencia: number
  totalPresencas: number
  rankingModalidades: RankingModalidade[]
}

function normalizarRelacao<T>(relacao: Relacao<T>) {
  if (!relacao) return null
  if (Array.isArray(relacao)) return relacao[0] ?? null
  return relacao
}

function arredondarPercentual(valor: number) {
  return Math.round(valor * 100) / 100
}

function periodoPadrao() {
  const hoje = new Date()
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

  return {
    dataInicio: inicio.toISOString().split('T')[0],
    dataFim: hoje.toISOString().split('T')[0],
  }
}

function dentroDoPeriodo(data: string | null, dataInicio: string, dataFim: string) {
  return Boolean(data && data >= dataInicio && data <= dataFim)
}

function matriculaExistiuNoPeriodo(
  matricula: MatriculaIndicador,
  dataInicio: string,
  dataFim: string
) {
  return (
    matricula.data_inicio <= dataFim &&
    (!matricula.data_fim || matricula.data_fim >= dataInicio)
  )
}

export async function getIndicadoresGestaoCultural(params?: {
  dataInicio?: string
  dataFim?: string
}): Promise<IndicadoresGestaoCultural> {
  const periodo = periodoPadrao()
  const dataInicio = params?.dataInicio?.trim() || periodo.dataInicio
  const dataFim = params?.dataFim?.trim() || periodo.dataFim
  const supabase = await createTenantClient()

  const { data: matriculasData, error: matriculasError } = await supabase
    .from('aluno_matriculas')
    .select(`
      id,
      aluno_id,
      aula_id,
      status,
      data_inicio,
      data_fim,
      alunos:aluno_id!aluno_matriculas_aluno_id_fkey ( status ),
      aulas:aula_id!aluno_matriculas_aula_id_fkey (
        id,
        modalidades!aulas_modalidade_id_fkey ( id, nome )
      )
    `)
    .lte('data_inicio', dataFim)
    .or(`data_fim.is.null,data_fim.gte.${dataInicio}`)

  if (matriculasError) {
    throw new Error(matriculasError.message)
  }

  const { data: frequenciasData, error: frequenciasError } = await supabase
    .from('frequencias')
    .select('aula_id, status')
    .gte('data_aula', dataInicio)
    .lte('data_aula', dataFim)

  if (frequenciasError) {
    throw new Error(frequenciasError.message)
  }

  const matriculas = (matriculasData ?? []) as unknown as MatriculaIndicador[]
  const frequencias = (frequenciasData ?? []) as FrequenciaIndicador[]

  const matriculasPeriodo = matriculas.filter((matricula) =>
    matriculaExistiuNoPeriodo(matricula, dataInicio, dataFim)
  )

  const matriculasAtivas = matriculasPeriodo.filter((matricula) => {
    const aluno = normalizarRelacao(matricula.alunos)
    return matricula.status === 'ativo' && aluno?.status === 'ativo'
  })

  const alunosAtivos = new Set(matriculasAtivas.map((matricula) => matricula.aluno_id))
  const evasoes = matriculasPeriodo.filter(
    (matricula) =>
      ['trancado', 'concluido'].includes(matricula.status) &&
      dentroDoPeriodo(matricula.data_fim, dataInicio, dataFim)
  )

  const totalPresencas = frequencias.filter(
    (frequencia) => frequencia.status.toLowerCase() === 'presente'
  ).length

  const totalLancamentosFrequencia = frequencias.length
  const frequenciaMedia =
    totalLancamentosFrequencia > 0
      ? arredondarPercentual((totalPresencas / totalLancamentosFrequencia) * 100)
      : 0

  const totalMatriculasPeriodo = matriculasPeriodo.length
  const taxaEvasao =
    totalMatriculasPeriodo > 0
      ? arredondarPercentual((evasoes.length / totalMatriculasPeriodo) * 100)
      : 0

  const frequenciasPorAula = new Map<string, { total: number; presencas: number }>()

  frequencias.forEach((frequencia) => {
    const atual = frequenciasPorAula.get(frequencia.aula_id) ?? {
      total: 0,
      presencas: 0,
    }

    atual.total += 1
    if (frequencia.status.toLowerCase() === 'presente') atual.presencas += 1
    frequenciasPorAula.set(frequencia.aula_id, atual)
  })

  const modalidades = new Map<
    string,
    {
      modalidade: string
      alunos: Set<string>
      aulas: Set<string>
    }
  >()

  matriculasAtivas.forEach((matricula) => {
    const aula = normalizarRelacao(matricula.aulas)
    const modalidade = normalizarRelacao(aula?.modalidades ?? null)

    if (!aula || !modalidade) return

    const atual =
      modalidades.get(modalidade.id) ??
      {
        modalidade: modalidade.nome,
        alunos: new Set<string>(),
        aulas: new Set<string>(),
      }

    atual.alunos.add(matricula.aluno_id)
    atual.aulas.add(aula.id)

    modalidades.set(modalidade.id, atual)
  })

  const rankingModalidades = Array.from(modalidades.entries())
    .map(([modalidadeId, item]) => ({
      modalidadeId,
      modalidade: item.modalidade,
      alunosAtivos: item.alunos.size,
      ...Array.from(item.aulas).reduce(
        (total, aulaId) => {
          const frequenciasDaAula = frequenciasPorAula.get(aulaId)
          if (!frequenciasDaAula) return total

          return {
            totalFrequencias: total.totalFrequencias + frequenciasDaAula.total,
            totalPresencas: total.totalPresencas + frequenciasDaAula.presencas,
          }
        },
        { totalFrequencias: 0, totalPresencas: 0 }
      ),
    }))
    .map((item) => ({
      modalidadeId: item.modalidadeId,
      modalidade: item.modalidade,
      alunosAtivos: item.alunosAtivos,
      frequenciaMedia:
        item.totalFrequencias > 0
          ? arredondarPercentual((item.totalPresencas / item.totalFrequencias) * 100)
          : 0,
    }))
    .sort((a, b) => b.alunosAtivos - a.alunosAtivos || a.modalidade.localeCompare(b.modalidade))

  return {
    periodo: {
      dataInicio,
      dataFim,
    },
    totalAlunosAtivos: alunosAtivos.size,
    taxaEvasao,
    totalEvasoes: evasoes.length,
    totalMatriculasPeriodo,
    frequenciaMedia,
    totalLancamentosFrequencia,
    totalPresencas,
    rankingModalidades,
  }
}
