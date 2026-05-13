import { createTenantClient } from '@/lib/supabase/tenant-server'

type PeriodoDashboard = {
  dataInicio: string
  dataFim: string
  label: string
}

export type DashboardExecutivoIndicadores = {
  periodo: PeriodoDashboard
  atualizadoEm: string
  totalAlunosAtivos: number
  frequenciaMedia: number
  totalLancamentosFrequencia: number
  totalPresencasFrequencia: number
  totalEvasoes30Dias: number
  atividadesRealizadas: number
  visitantesAtendidos: number
  presencaBanda: number
  totalLancamentosBanda: number
  totalPresencasBanda: number
  comparativo: {
    periodoAnterior: PeriodoDashboard
    frequenciaMediaAnterior: number
    atividadesRealizadasAnterior: number
    visitantesAtendidosAnterior: number
    presencaBandaAnterior: number
    crescimentoAtividades: number
    crescimentoVisitantes: number
  }
}

function formatarDataLocal(data: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(data)
}

function periodoUltimos30Dias(): PeriodoDashboard {
  const fim = new Date()
  const inicio = new Date()
  inicio.setDate(fim.getDate() - 29)

  return {
    dataInicio: formatarDataLocal(inicio),
    dataFim: formatarDataLocal(fim),
    label: 'Últimos 30 dias',
  }
}

function periodoAnteriorAo(periodo: PeriodoDashboard): PeriodoDashboard {
  const fim = new Date(`${periodo.dataInicio}T00:00:00`)
  fim.setDate(fim.getDate() - 1)

  const inicio = new Date(fim)
  inicio.setDate(fim.getDate() - 29)

  return {
    dataInicio: formatarDataLocal(inicio),
    dataFim: formatarDataLocal(fim),
    label: '30 dias anteriores',
  }
}

function percentual(parte: number, total: number) {
  if (total <= 0) return 0
  return Math.round((parte / total) * 10000) / 100
}

function crescimentoPercentual(atual: number, anterior: number) {
  if (anterior <= 0) return atual > 0 ? 100 : 0
  return Math.round(((atual - anterior) / anterior) * 10000) / 100
}

function countValue(count: number | null) {
  return count ?? 0
}

async function contarIndicadoresPeriodo(
  supabase: Awaited<ReturnType<typeof createTenantClient>>,
  periodo: PeriodoDashboard,
  incluirEvasao = false
) {
  const evasaoConsulta = incluirEvasao
    ? supabase
        .from('aluno_matriculas')
        .select('id', { count: 'exact', head: true })
        .in('status', ['trancado', 'concluido'])
        .gte('data_fim', periodo.dataInicio)
        .lte('data_fim', periodo.dataFim)
    : Promise.resolve({ count: 0, error: null })

  const [
    frequenciasTotal,
    frequenciasPresentes,
    agendaRealizada,
    ensaiosRealizados,
    apresentacoesRealizadas,
    visitantesAtendidos,
    bandaTotal,
    bandaPresentes,
    evasoes,
  ] = await Promise.all([
    supabase
      .from('frequencias')
      .select('id', { count: 'exact', head: true })
      .gte('data_aula', periodo.dataInicio)
      .lte('data_aula', periodo.dataFim),

    supabase
      .from('frequencias')
      .select('id', { count: 'exact', head: true })
      .gte('data_aula', periodo.dataInicio)
      .lte('data_aula', periodo.dataFim)
      .eq('status', 'presente'),

    supabase
      .from('agenda_eventos')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'realizado')
      .gte('data_inicio', periodo.dataInicio)
      .lte('data_inicio', periodo.dataFim),

    supabase
      .from('banda_municipal_ensaios')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'realizado')
      .gte('data_ensaio', periodo.dataInicio)
      .lte('data_ensaio', periodo.dataFim),

    supabase
      .from('banda_municipal_apresentacoes')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'realizada')
      .gte('data_apresentacao', periodo.dataInicio)
      .lte('data_apresentacao', periodo.dataFim),

    supabase
      .from('visitante_visitas')
      .select('id', { count: 'exact', head: true })
      .gte('data_visita', periodo.dataInicio)
      .lte('data_visita', periodo.dataFim),

    supabase
      .from('banda_municipal_presencas')
      .select('id', { count: 'exact', head: true })
      .gte('data', periodo.dataInicio)
      .lte('data', periodo.dataFim),

    supabase
      .from('banda_municipal_presencas')
      .select('id', { count: 'exact', head: true })
      .gte('data', periodo.dataInicio)
      .lte('data', periodo.dataFim)
      .eq('status', 'presente'),

    evasaoConsulta,
  ])

  const erros = [
    frequenciasTotal.error?.message,
    frequenciasPresentes.error?.message,
    agendaRealizada.error?.message,
    ensaiosRealizados.error?.message,
    apresentacoesRealizadas.error?.message,
    visitantesAtendidos.error?.message,
    bandaTotal.error?.message,
    bandaPresentes.error?.message,
    evasoes.error?.message,
  ].filter(Boolean)

  if (erros.length > 0) {
    throw new Error(erros.join(' | '))
  }

  const totalLancamentosFrequencia = countValue(frequenciasTotal.count)
  const totalPresencasFrequencia = countValue(frequenciasPresentes.count)
  const totalLancamentosBanda = countValue(bandaTotal.count)
  const totalPresencasBanda = countValue(bandaPresentes.count)
  const atividadesRealizadas =
    countValue(agendaRealizada.count) +
    countValue(ensaiosRealizados.count) +
    countValue(apresentacoesRealizadas.count)

  return {
    totalLancamentosFrequencia,
    totalPresencasFrequencia,
    frequenciaMedia: percentual(totalPresencasFrequencia, totalLancamentosFrequencia),
    totalEvasoes: countValue(evasoes.count),
    atividadesRealizadas,
    visitantesAtendidos: countValue(visitantesAtendidos.count),
    totalLancamentosBanda,
    totalPresencasBanda,
    presencaBanda: percentual(totalPresencasBanda, totalLancamentosBanda),
  }
}

export async function getDashboardExecutivo(): Promise<DashboardExecutivoIndicadores> {
  const supabase = await createTenantClient()
  const periodo = periodoUltimos30Dias()
  const periodoAnterior = periodoAnteriorAo(periodo)

  const [alunosAtivos, atual, anterior] = await Promise.all([
    supabase
      .from('alunos')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ativo'),
    contarIndicadoresPeriodo(supabase, periodo, true),
    contarIndicadoresPeriodo(supabase, periodoAnterior),
  ])

  if (alunosAtivos.error) {
    throw new Error(alunosAtivos.error.message)
  }

  return {
    periodo,
    atualizadoEm: new Date().toISOString(),
    totalAlunosAtivos: countValue(alunosAtivos.count),
    frequenciaMedia: atual.frequenciaMedia,
    totalLancamentosFrequencia: atual.totalLancamentosFrequencia,
    totalPresencasFrequencia: atual.totalPresencasFrequencia,
    totalEvasoes30Dias: atual.totalEvasoes,
    atividadesRealizadas: atual.atividadesRealizadas,
    visitantesAtendidos: atual.visitantesAtendidos,
    presencaBanda: atual.presencaBanda,
    totalLancamentosBanda: atual.totalLancamentosBanda,
    totalPresencasBanda: atual.totalPresencasBanda,
    comparativo: {
      periodoAnterior,
      frequenciaMediaAnterior: anterior.frequenciaMedia,
      atividadesRealizadasAnterior: anterior.atividadesRealizadas,
      visitantesAtendidosAnterior: anterior.visitantesAtendidos,
      presencaBandaAnterior: anterior.presencaBanda,
      crescimentoAtividades: crescimentoPercentual(
        atual.atividadesRealizadas,
        anterior.atividadesRealizadas
      ),
      crescimentoVisitantes: crescimentoPercentual(
        atual.visitantesAtendidos,
        anterior.visitantesAtendidos
      ),
    },
  }
}
