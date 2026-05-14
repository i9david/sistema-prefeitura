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
}

type AlunoIndicador = {
  id: string
  status: string
}

type AulaIndicador = {
  id: string
  modalidade_id: string
}

type ModalidadeIndicador = {
  id: string
  nome: string
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
    .select('id, aluno_id, aula_id, status, data_inicio, data_fim')
    .lte('data_inicio', dataFim)
    .or(`data_fim.is.null,data_fim.gte.${dataInicio}`)

  if (matriculasError) {
    throw new Error(matriculasError.message)
  }

  const matriculas = (matriculasData ?? []) as MatriculaIndicador[]
  const matriculasPeriodo = matriculas.filter((matricula) =>
    matriculaExistiuNoPeriodo(matricula, dataInicio, dataFim)
  )

  const alunoIds = Array.from(
    new Set(matriculasPeriodo.map((matricula) => matricula.aluno_id).filter(Boolean))
  )

  const { data: alunosData, error: alunosError } = alunoIds.length > 0
    ? await supabase.from('alunos').select('id, status').in('id', alunoIds)
    : { data: [], error: null }

  if (alunosError) {
    throw new Error(alunosError.message)
  }

  const alunosPorId = new Map(
    (alunosData ?? []).map((aluno: AlunoIndicador) => [aluno.id, aluno.status])
  )

  const matriculasAtivas = matriculasPeriodo.filter((matricula) =>
    matricula.status === 'ativo' && alunosPorId.get(matricula.aluno_id) === 'ativo'
  )

  const aulaIds = Array.from(
    new Set(matriculasAtivas.map((matricula) => matricula.aula_id).filter(Boolean))
  )

  const { data: aulasData, error: aulasError } = aulaIds.length > 0
    ? await supabase.from('aulas').select('id, modalidade_id').in('id', aulaIds)
    : { data: [], error: null }

  if (aulasError) {
    throw new Error(aulasError.message)
  }

  const aulasPorId = new Map(
    (aulasData ?? []).map((aula: AulaIndicador) => [aula.id, aula.modalidade_id])
  )

  const modalidadeIds = Array.from(
    new Set((aulasData ?? []).map((aula: AulaIndicador) => aula.modalidade_id).filter(Boolean))
  )

  const { data: modalidadesData, error: modalidadesError } = modalidadeIds.length > 0
    ? await supabase.from('modalidades').select('id, nome').in('id', modalidadeIds)
    : { data: [], error: null }

  if (modalidadesError) {
    throw new Error(modalidadesError.message)
  }

  const modalidadesPorId = new Map(
    (modalidadesData ?? []).map((modalidade: ModalidadeIndicador) => [modalidade.id, modalidade.nome])
  )

  const { data: frequenciasData, error: frequenciasError } = await supabase
    .from('frequencias')
    .select('aula_id, status')
    .gte('data_aula', dataInicio)
    .lte('data_aula', dataFim)

  if (frequenciasError) {
    throw new Error(frequenciasError.message)
  }

  const frequencias = (frequenciasData ?? []) as FrequenciaIndicador[]

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
    const aulaId = matricula.aula_id
    const modalidadeId = aulasPorId.get(aulaId)
    const modalidadeNome = modalidadeId ? modalidadesPorId.get(modalidadeId) : undefined

    if (!modalidadeId || !modalidadeNome) return

    const atual =
      modalidades.get(modalidadeId) ??
      {
        modalidade: modalidadeNome,
        alunos: new Set<string>(),
        aulas: new Set<string>(),
      }

    atual.alunos.add(matricula.aluno_id)
    atual.aulas.add(aulaId)

    modalidades.set(modalidadeId, atual)
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
