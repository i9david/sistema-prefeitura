import { createTenantClient } from '@/lib/supabase/tenant-server'

type Relacao<T> = T | T[] | null

type ModalidadeRelacionada = {
  id: string
  nome: string
}

type AulaRelacionada = {
  id: string
  nome: string
  modalidades: Relacao<ModalidadeRelacionada>
}

type AlunoRelacionado = {
  id: string
  status: string
}

type MatriculaRelatorio = {
  aluno_id: string
  status: string
  alunos: Relacao<AlunoRelacionado>
  aulas: Relacao<AulaRelacionada>
}

type AlunoLegadoRelatorio = {
  id: string
  status: string
  aulas: Relacao<AulaRelacionada>
}

type FrequenciaRelatorio = {
  id: string
  aula_id: string
  aluno_id: string
  status: string
  data_aula: string
  aulas: Relacao<AulaRelacionada>
}

type PessoaRelacionada = {
  id: string
  nome: string
  telefone: string | null
}

type VisitaCrm = {
  id: string
  pessoa_id: string
  destino: string | null
  motivo: string | null
  data_visita: string
  pessoas: Relacao<PessoaRelacionada>
}

type VisitanteLegado = {
  id: string
  pessoa_id: string | null
  nome: string
  telefone: string | null
  destino: string | null
  motivo: string | null
  data_visita: string | null
}

export type LinhaModalidadeGestao = {
  modalidadeId: string
  modalidade: string
  alunosAtivos: number
  lancamentos: number
  presencas: number
  faltas: number
  frequenciaMedia: number
}

export type LinhaVisitantesGestao = {
  destino: string
  totalVisitas: number
  visitantesUnicos: number
  visitantesRecorrentes: number
  taxaRecorrencia: number
}

export type LinhaSerieGestao = {
  data: string
  frequenciasLancadas: number
  presencas: number
  visitantes: number
}

export type RelatoriosGestaoPublica = {
  periodo: {
    dataInicio: string
    dataFim: string
  }
  indicadores: {
    alunosAtivos: number
    totalFrequencias: number
    presencas: number
    faltas: number
    frequenciaMedia: number
    totalVisitas: number
    visitantesUnicos: number
    visitantesRecorrentes: number
    taxaRecorrencia: number
  }
  modalidades: LinhaModalidadeGestao[]
  visitantesPorDestino: LinhaVisitantesGestao[]
  serieDiaria: LinhaSerieGestao[]
}

function normalizarRelacao<T>(relacao: Relacao<T>) {
  if (!relacao) return null
  if (Array.isArray(relacao)) return relacao[0] ?? null
  return relacao
}

function arredondar(valor: number) {
  return Math.round(valor * 100) / 100
}

function hojeBrasil() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function inicioMesAtual() {
  const hoje = hojeBrasil()
  return `${hoje.slice(0, 7)}-01`
}

function somarDias(dataTexto: string, dias: number) {
  const data = new Date(`${dataTexto}T00:00:00`)
  data.setDate(data.getDate() + dias)
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function datasDoPeriodo(dataInicio: string, dataFim: string) {
  const datas: string[] = []
  let cursor = dataInicio

  while (cursor <= dataFim) {
    datas.push(cursor)
    cursor = somarDias(cursor, 1)
  }

  return datas
}

function calcularPercentual(parte: number, total: number) {
  if (total === 0) return 0
  return arredondar((parte / total) * 100)
}

function getDestinoLabel(destino: string | null | undefined) {
  return destino === 'museu' ? 'Museu' : 'Centro Cultural'
}

async function buscarVisitas(
  supabase: Awaited<ReturnType<typeof createTenantClient>>,
  dataInicio: string,
  dataFim: string
) {
  const { data: visitasCrm, error: visitasCrmError } = await supabase
    .from('visitante_visitas')
    .select(`
      id,
      pessoa_id,
      destino,
      motivo,
      data_visita,
      pessoas:pessoa_id!visitante_visitas_pessoa_id_fkey (
        id,
        nome,
        telefone
      )
    `)
    .gte('data_visita', dataInicio)
    .lte('data_visita', dataFim)

  if (!visitasCrmError) {
    return ((visitasCrm ?? []) as unknown as VisitaCrm[]).map((visita) => {
      const pessoa = normalizarRelacao(visita.pessoas)

      return {
        id: visita.id,
        pessoaId: visita.pessoa_id,
        nome: pessoa?.nome ?? 'Pessoa sem nome',
        telefone: pessoa?.telefone ?? null,
        destino: visita.destino,
        motivo: visita.motivo,
        dataVisita: visita.data_visita,
      }
    })
  }

  const { data: visitantes, error: visitantesError } = await supabase
    .from('visitantes')
    .select('id, pessoa_id, nome, telefone, destino, motivo, data_visita')
    .gte('data_visita', dataInicio)
    .lte('data_visita', dataFim)

  if (visitantesError) {
    throw new Error(visitantesError.message)
  }

  return ((visitantes ?? []) as VisitanteLegado[])
    .filter((visitante) => visitante.data_visita)
    .map((visitante) => ({
      id: visitante.id,
      pessoaId: visitante.pessoa_id ?? `${visitante.nome}-${visitante.telefone ?? ''}`,
      nome: visitante.nome,
      telefone: visitante.telefone,
      destino: visitante.destino,
      motivo: visitante.motivo,
      dataVisita: visitante.data_visita as string,
    }))
}

async function buscarMatriculasAtivas(
  supabase: Awaited<ReturnType<typeof createTenantClient>>
) {
  const { data: matriculas, error: matriculasError } = await supabase
    .from('aluno_matriculas')
    .select(`
      aluno_id,
      status,
      alunos:aluno_id!aluno_matriculas_aluno_id_fkey (
        id,
        status
      ),
      aulas:aula_id!aluno_matriculas_aula_id_fkey (
        id,
        nome,
        modalidades!aulas_modalidade_id_fkey (
          id,
          nome
        )
      )
    `)
    .eq('status', 'ativo')

  if (!matriculasError) {
    return (matriculas ?? []) as unknown as MatriculaRelatorio[]
  }

  const { data: alunos, error: alunosError } = await supabase
    .from('alunos')
    .select(`
      id,
      status,
      aulas:aula_id!alunos_aula_id_fkey (
        id,
        nome,
        modalidades!aulas_modalidade_id_fkey (
          id,
          nome
        )
      )
    `)
    .eq('status', 'ativo')

  if (alunosError) {
    throw new Error(alunosError.message)
  }

  return ((alunos ?? []) as unknown as AlunoLegadoRelatorio[]).map((aluno) => ({
    aluno_id: aluno.id,
    status: 'ativo',
    alunos: {
      id: aluno.id,
      status: aluno.status,
    },
    aulas: aluno.aulas,
  }))
}

export async function getRelatoriosGestaoPublica(params?: {
  dataInicio?: string
  dataFim?: string
}): Promise<RelatoriosGestaoPublica> {
  const dataInicio = params?.dataInicio?.trim() || inicioMesAtual()
  const dataFimParam = params?.dataFim?.trim() || hojeBrasil()
  const dataFim = dataFimParam < dataInicio ? dataInicio : dataFimParam
  const supabase = await createTenantClient()

  const [
    matriculas,
    { data: frequenciasData, error: frequenciasError },
    visitas,
  ] = await Promise.all([
    buscarMatriculasAtivas(supabase),
    supabase
      .from('frequencias')
      .select(`
        id,
        aula_id,
        aluno_id,
        status,
        data_aula,
        aulas:aula_id!frequencias_aula_id_fkey (
          id,
          nome,
          modalidades!aulas_modalidade_id_fkey (
            id,
            nome
          )
        )
      `)
      .gte('data_aula', dataInicio)
      .lte('data_aula', dataFim),
    buscarVisitas(supabase, dataInicio, dataFim),
  ])

  if (frequenciasError) throw new Error(frequenciasError.message)

  const frequencias = (frequenciasData ?? []) as unknown as FrequenciaRelatorio[]
  const alunosAtivos = new Set<string>()
  const modalidades = new Map<
    string,
    {
      modalidade: string
      alunos: Set<string>
      lancamentos: number
      presencas: number
      faltas: number
    }
  >()

  matriculas.forEach((matricula) => {
    const aluno = normalizarRelacao(matricula.alunos)
    const aula = normalizarRelacao(matricula.aulas)
    const modalidade = normalizarRelacao(aula?.modalidades ?? null)

    if (!aluno || aluno.status !== 'ativo' || !modalidade) return

    alunosAtivos.add(matricula.aluno_id)

    const atual =
      modalidades.get(modalidade.id) ??
      {
        modalidade: modalidade.nome,
        alunos: new Set<string>(),
        lancamentos: 0,
        presencas: 0,
        faltas: 0,
      }

    atual.alunos.add(matricula.aluno_id)
    modalidades.set(modalidade.id, atual)
  })

  let presencas = 0
  let faltas = 0

  frequencias.forEach((frequencia) => {
    const status = String(frequencia.status ?? '').toLowerCase()
    const aula = normalizarRelacao(frequencia.aulas)
    const modalidade = normalizarRelacao(aula?.modalidades ?? null)

    if (status === 'presente') presencas += 1
    if (status === 'faltou' || status === 'falta') faltas += 1

    if (!modalidade) return

    const atual =
      modalidades.get(modalidade.id) ??
      {
        modalidade: modalidade.nome,
        alunos: new Set<string>(),
        lancamentos: 0,
        presencas: 0,
        faltas: 0,
      }

    atual.lancamentos += 1
    if (status === 'presente') atual.presencas += 1
    if (status === 'faltou' || status === 'falta') atual.faltas += 1
    modalidades.set(modalidade.id, atual)
  })

  const visitantesPorPessoa = new Map<string, number>()
  const visitantesPorDestino = new Map<
    string,
    {
      totalVisitas: number
      pessoas: Set<string>
      recorrentes: Set<string>
    }
  >()

  visitas.forEach((visita) => {
    visitantesPorPessoa.set(
      visita.pessoaId,
      (visitantesPorPessoa.get(visita.pessoaId) ?? 0) + 1
    )
  })

  visitas.forEach((visita) => {
    const destino = getDestinoLabel(visita.destino)
    const atual =
      visitantesPorDestino.get(destino) ??
      {
        totalVisitas: 0,
        pessoas: new Set<string>(),
        recorrentes: new Set<string>(),
      }

    atual.totalVisitas += 1
    atual.pessoas.add(visita.pessoaId)
    if ((visitantesPorPessoa.get(visita.pessoaId) ?? 0) > 1) {
      atual.recorrentes.add(visita.pessoaId)
    }

    visitantesPorDestino.set(destino, atual)
  })

  const datas = datasDoPeriodo(dataInicio, dataFim)
  const serieDiaria = datas.map((data) => {
    const frequenciasDia = frequencias.filter((frequencia) => frequencia.data_aula === data)
    const visitasDia = visitas.filter((visita) => visita.dataVisita === data)
    const presencasDia = frequenciasDia.filter(
      (frequencia) => String(frequencia.status ?? '').toLowerCase() === 'presente'
    ).length

    return {
      data,
      frequenciasLancadas: frequenciasDia.length,
      presencas: presencasDia,
      visitantes: visitasDia.length,
    }
  })

  const visitantesUnicos = visitantesPorPessoa.size
  const visitantesRecorrentes = Array.from(visitantesPorPessoa.values()).filter(
    (total) => total > 1
  ).length

  return {
    periodo: {
      dataInicio,
      dataFim,
    },
    indicadores: {
      alunosAtivos: alunosAtivos.size,
      totalFrequencias: frequencias.length,
      presencas,
      faltas,
      frequenciaMedia: calcularPercentual(presencas, frequencias.length),
      totalVisitas: visitas.length,
      visitantesUnicos,
      visitantesRecorrentes,
      taxaRecorrencia: calcularPercentual(visitantesRecorrentes, visitantesUnicos),
    },
    modalidades: Array.from(modalidades.entries())
      .map(([modalidadeId, item]) => ({
        modalidadeId,
        modalidade: item.modalidade,
        alunosAtivos: item.alunos.size,
        lancamentos: item.lancamentos,
        presencas: item.presencas,
        faltas: item.faltas,
        frequenciaMedia: calcularPercentual(item.presencas, item.lancamentos),
      }))
      .sort((a, b) => b.alunosAtivos - a.alunosAtivos || a.modalidade.localeCompare(b.modalidade)),
    visitantesPorDestino: Array.from(visitantesPorDestino.entries())
      .map(([destino, item]) => ({
        destino,
        totalVisitas: item.totalVisitas,
        visitantesUnicos: item.pessoas.size,
        visitantesRecorrentes: item.recorrentes.size,
        taxaRecorrencia: calcularPercentual(item.recorrentes.size, item.pessoas.size),
      }))
      .sort((a, b) => b.totalVisitas - a.totalVisitas || a.destino.localeCompare(b.destino)),
    serieDiaria,
  }
}
