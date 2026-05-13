import { createTenantClient } from '@/lib/supabase/tenant-server'

type Relacao<T> = T | T[] | null

type ModalidadeRelacionada = {
  nome: string
}

type AulaAgenda = {
  id: string
  nome: string
  dia_semana: string
  horario_inicio: string
  horario_fim: string
  status: string
  modalidades: Relacao<ModalidadeRelacionada>
}

type AgendaEvento = {
  id: string
  titulo: string
  descricao: string | null
  modulo: string
  tipo: string
  data_inicio: string
  data_fim: string | null
  horario_inicio: string | null
  horario_fim: string | null
  local: string | null
  status: string
  origem: string
}

type EnsaioAgenda = {
  id: string
  titulo: string
  data_ensaio: string
  horario_inicio: string
  horario_fim: string | null
  local: string | null
  status: string
}

type ApresentacaoAgenda = {
  id: string
  titulo: string
  data_apresentacao: string
  horario: string | null
  local: string | null
  evento: string | null
  status: string
}

export type ItemAgendaCultural = {
  id: string
  titulo: string
  modulo: string
  tipo: string
  data: string
  horarioInicio: string | null
  horarioFim: string | null
  local: string | null
  status: string
  origem: string
  href: string
  descricao: string | null
}

export type AgendaCultural = {
  periodo: {
    dataInicio: string
    dataFim: string
    visualizacao: 'dia' | 'semana'
  }
  itens: ItemAgendaCultural[]
  totais: {
    total: number
    aulas: number
    eventos: number
    banda: number
  }
}

type PeriodoAgenda = AgendaCultural['periodo']

const diasSemana: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  'segunda-feira': 1,
  terca: 2,
  'terca-feira': 2,
  quarta: 3,
  'quarta-feira': 3,
  quinta: 4,
  'quinta-feira': 4,
  sexta: 5,
  'sexta-feira': 5,
  sabado: 6,
}

function normalizarRelacao<T>(relacao: Relacao<T>) {
  if (!relacao) return null
  if (Array.isArray(relacao)) return relacao[0] ?? null
  return relacao
}

function formatarDataLocal(data: Date) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function hojeBrasil() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function somarDias(dataTexto: string, dias: number) {
  const data = new Date(`${dataTexto}T00:00:00`)
  data.setDate(data.getDate() + dias)
  return formatarDataLocal(data)
}

function inicioDaSemana(dataTexto: string) {
  const data = new Date(`${dataTexto}T00:00:00`)
  data.setDate(data.getDate() - data.getDay())
  return formatarDataLocal(data)
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

function getDiaSemanaAula(valor: string) {
  const chave = valor
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  return diasSemana[chave] ?? null
}

function ordenarAgenda(a: ItemAgendaCultural, b: ItemAgendaCultural) {
  const data = a.data.localeCompare(b.data)
  if (data !== 0) return data
  return (a.horarioInicio ?? '99:99').localeCompare(b.horarioInicio ?? '99:99')
}

export function getPeriodoAgenda(params?: {
  data?: string
  visualizacao?: string
}): PeriodoAgenda {
  const dataBase = params?.data?.trim() || hojeBrasil()
  const visualizacao = params?.visualizacao === 'dia' ? 'dia' : 'semana'

  if (visualizacao === 'dia') {
    return {
      dataInicio: dataBase,
      dataFim: dataBase,
      visualizacao,
    }
  }

  const dataInicio = inicioDaSemana(dataBase)

  return {
    dataInicio,
    dataFim: somarDias(dataInicio, 6),
    visualizacao,
  }
}

async function buscarEventosManuais(
  supabase: Awaited<ReturnType<typeof createTenantClient>>,
  dataInicio: string,
  dataFim: string
) {
  const { data, error } = await supabase
    .from('agenda_eventos')
    .select(`
      id,
      titulo,
      descricao,
      modulo,
      tipo,
      data_inicio,
      data_fim,
      horario_inicio,
      horario_fim,
      local,
      status,
      origem
    `)
    .lte('data_inicio', dataFim)
    .or(`data_fim.is.null,data_fim.gte.${dataInicio}`)

  if (error) return []

  return (data ?? []) as AgendaEvento[]
}

export async function getAgendaCultural(params?: {
  data?: string
  visualizacao?: string
}): Promise<AgendaCultural> {
  const periodo = getPeriodoAgenda(params)
  const supabase = await createTenantClient()
  const datas = datasDoPeriodo(periodo.dataInicio, periodo.dataFim)

  const [
    { data: aulasData, error: aulasError },
    eventosManuais,
    { data: ensaiosData, error: ensaiosError },
    { data: apresentacoesData, error: apresentacoesError },
  ] = await Promise.all([
    supabase
      .from('aulas')
      .select(`
        id,
        nome,
        dia_semana,
        horario_inicio,
        horario_fim,
        status,
        modalidades!aulas_modalidade_id_fkey ( nome )
      `)
      .eq('status', 'ativa'),
    buscarEventosManuais(supabase, periodo.dataInicio, periodo.dataFim),
    supabase
      .from('banda_municipal_ensaios')
      .select('id, titulo, data_ensaio, horario_inicio, horario_fim, local, status')
      .gte('data_ensaio', periodo.dataInicio)
      .lte('data_ensaio', periodo.dataFim),
    supabase
      .from('banda_municipal_apresentacoes')
      .select('id, titulo, data_apresentacao, horario, local, evento, status')
      .gte('data_apresentacao', periodo.dataInicio)
      .lte('data_apresentacao', periodo.dataFim),
  ])

  if (aulasError) throw new Error(aulasError.message)
  if (ensaiosError) throw new Error(ensaiosError.message)
  if (apresentacoesError) throw new Error(apresentacoesError.message)

  const aulas = (aulasData ?? []) as unknown as AulaAgenda[]
  const ensaios = (ensaiosData ?? []) as EnsaioAgenda[]
  const apresentacoes = (apresentacoesData ?? []) as ApresentacaoAgenda[]

  const itensAulas = aulas.flatMap((aula) => {
    const diaSemanaAula = getDiaSemanaAula(aula.dia_semana)
    const modalidade = normalizarRelacao(aula.modalidades)

    if (diaSemanaAula === null) return []

    return datas
      .filter((data) => new Date(`${data}T00:00:00`).getDay() === diaSemanaAula)
      .map((data) => ({
        id: `aula-${aula.id}-${data}`,
        titulo: aula.nome,
        modulo: 'Centro Cultural',
        tipo: 'aula',
        data,
        horarioInicio: aula.horario_inicio,
        horarioFim: aula.horario_fim,
        local: null,
        status: aula.status,
        origem: 'aulas',
        href: '/aulas',
        descricao: modalidade?.nome ?? null,
      }))
  })

  const itensEventos = eventosManuais.flatMap((evento) => {
    const dataFimEvento = evento.data_fim ?? evento.data_inicio

    return datas
      .filter((data) => data >= evento.data_inicio && data <= dataFimEvento)
      .map((data) => ({
        id: `evento-${evento.id}-${data}`,
        titulo: evento.titulo,
        modulo: evento.modulo,
        tipo: evento.tipo,
        data,
        horarioInicio: evento.horario_inicio,
        horarioFim: evento.horario_fim,
        local: evento.local,
        status: evento.status,
        origem: evento.origem,
        href: '/administrativo/agenda',
        descricao: evento.descricao,
      }))
  })

  const itensEnsaios = ensaios.map((ensaio) => ({
    id: `ensaio-${ensaio.id}`,
    titulo: ensaio.titulo,
    modulo: 'Banda Municipal',
    tipo: 'ensaio',
    data: ensaio.data_ensaio,
    horarioInicio: ensaio.horario_inicio,
    horarioFim: ensaio.horario_fim,
    local: ensaio.local,
    status: ensaio.status,
    origem: 'banda_municipal_ensaios',
    href: '/banda-municipal/ensaios',
    descricao: null,
  }))

  const itensApresentacoes = apresentacoes.map((apresentacao) => ({
    id: `apresentacao-${apresentacao.id}`,
    titulo: apresentacao.titulo,
    modulo: 'Banda Municipal',
    tipo: 'apresentacao',
    data: apresentacao.data_apresentacao,
    horarioInicio: apresentacao.horario,
    horarioFim: null,
    local: apresentacao.local,
    status: apresentacao.status,
    origem: 'banda_municipal_apresentacoes',
    href: '/banda-municipal/apresentacoes',
    descricao: apresentacao.evento,
  }))

  const itens = [
    ...itensAulas,
    ...itensEventos,
    ...itensEnsaios,
    ...itensApresentacoes,
  ].sort(ordenarAgenda)

  return {
    periodo,
    itens,
    totais: {
      total: itens.length,
      aulas: itens.filter((item) => item.tipo === 'aula').length,
      eventos: itens.filter((item) => item.tipo === 'evento').length,
      banda: itens.filter((item) => item.modulo === 'Banda Municipal').length,
    },
  }
}
