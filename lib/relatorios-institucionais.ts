import { createTenantClient } from '@/lib/supabase/tenant-server'

type Relacao<T> = T | T[] | null

type ModalidadeRel = {
  nome: string | null
}

type AulaRel = {
  modalidades: Relacao<ModalidadeRel>
}

type FrequenciaRel = {
  id: string
  status: string
  data_aula: string
  aulas: Relacao<AulaRel>
}

type VisitaRel = {
  id: string
  pessoa_id: string | null
  destino: string | null
  data_visita: string
}

type AgendaEventoRel = {
  id: string
  modulo: string
  tipo: string
  status: string
  data_inicio: string
}

type EnsaioRel = {
  id: string
  status: string
  data_ensaio: string
}

type ApresentacaoRel = {
  id: string
  status: string
  data_apresentacao: string
}

type PresencaBandaRel = {
  id: string
  tipo: string
  status: string
  status_pagamento: string | null
  valor_total: number | null
}

export type LinhaAtividadeInstitucional = {
  chave: string
  modulo: string
  tipo: string
  planejadas: number
  realizadas: number
  canceladas: number
  total: number
}

export type LinhaFrequenciaInstitucional = {
  modalidade: string
  lancamentos: number
  presencas: number
  faltas: number
  frequenciaMedia: number
}

export type LinhaVisitantesInstitucional = {
  destino: string
  visitas: number
  visitantesUnicos: number
  visitantesRecorrentes: number
  taxaRecorrencia: number
}

export type LinhaBandaInstitucional = {
  tipo: string
  lancamentos: number
  presencas: number
  faltas: number
  justificadas: number
  presencaMedia: number
  valorTotal: number
  pagamentosPendentes: number
  pagamentosPagos: number
}

export type RelatoriosInstitucionais = {
  periodo: {
    dataInicio: string
    dataFim: string
    mesReferencia: string
  }
  resumo: {
    atividadesRealizadas: number
    frequenciaMedia: number
    visitantesAtendidos: number
    presencaBanda: number
  }
  atividades: LinhaAtividadeInstitucional[]
  frequencia: LinhaFrequenciaInstitucional[]
  visitantes: LinhaVisitantesInstitucional[]
  banda: LinhaBandaInstitucional[]
}

function normalizarRelacao<T>(relacao: Relacao<T>) {
  if (!relacao) return null
  if (Array.isArray(relacao)) return relacao[0] ?? null
  return relacao
}

function hojeBrasil() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function ultimoDiaMes(anoMes: string) {
  const [ano, mes] = anoMes.split('-').map(Number)
  const data = new Date(ano, mes, 0)
  return String(data.getDate()).padStart(2, '0')
}

function periodoMensal(mes?: string) {
  const mesReferencia = mes?.match(/^\d{4}-\d{2}$/) ? mes : hojeBrasil().slice(0, 7)

  return {
    mesReferencia,
    dataInicio: `${mesReferencia}-01`,
    dataFim: `${mesReferencia}-${ultimoDiaMes(mesReferencia)}`,
  }
}

function percentual(parte: number, total: number) {
  if (total === 0) return 0
  return Math.round((parte / total) * 10000) / 100
}

function statusNormalizado(status: string | null | undefined) {
  return String(status ?? '').toLowerCase().trim()
}

function destinoLabel(destino: string | null | undefined) {
  if (destino === 'museu') return 'Museu'
  if (destino === 'turismo') return 'Turismo'
  return 'Centro Cultural'
}

function tipoLabel(tipo: string | null | undefined) {
  const valor = String(tipo ?? '').toLowerCase()
  if (valor === 'apresentacao') return 'Apresentação'
  if (valor === 'ensaio') return 'Ensaio'
  if (valor === 'aula') return 'Aula'
  if (valor === 'evento') return 'Evento'
  return valor ? valor[0].toUpperCase() + valor.slice(1) : 'Não informado'
}

function agregarAtividade(
  mapa: Map<string, LinhaAtividadeInstitucional>,
  modulo: string,
  tipo: string,
  status: string
) {
  const chave = `${modulo}-${tipo}`
  const atual =
    mapa.get(chave) ??
    {
      chave,
      modulo,
      tipo: tipoLabel(tipo),
      planejadas: 0,
      realizadas: 0,
      canceladas: 0,
      total: 0,
    }

  const statusValor = statusNormalizado(status)
  atual.total += 1
  if (statusValor.includes('realiz')) atual.realizadas += 1
  else if (statusValor.includes('cancel')) atual.canceladas += 1
  else atual.planejadas += 1

  mapa.set(chave, atual)
}

export async function getRelatoriosInstitucionais(params?: {
  mes?: string
}): Promise<RelatoriosInstitucionais> {
  const periodo = periodoMensal(params?.mes)
  const supabase = await createTenantClient()

  const [
    { data: eventosData, error: eventosError },
    { data: ensaiosData, error: ensaiosError },
    { data: apresentacoesData, error: apresentacoesError },
    { data: frequenciasData, error: frequenciasError },
    { data: visitasData, error: visitasError },
    { data: bandaPresencasData, error: bandaPresencasError },
  ] = await Promise.all([
    supabase
      .from('agenda_eventos')
      .select('id, modulo, tipo, status, data_inicio')
      .gte('data_inicio', periodo.dataInicio)
      .lte('data_inicio', periodo.dataFim),
    supabase
      .from('banda_municipal_ensaios')
      .select('id, status, data_ensaio')
      .gte('data_ensaio', periodo.dataInicio)
      .lte('data_ensaio', periodo.dataFim),
    supabase
      .from('banda_municipal_apresentacoes')
      .select('id, status, data_apresentacao')
      .gte('data_apresentacao', periodo.dataInicio)
      .lte('data_apresentacao', periodo.dataFim),
    supabase
      .from('frequencias')
      .select(`
        id,
        status,
        data_aula,
        aulas:aula_id!frequencias_aula_id_fkey (
          modalidades!aulas_modalidade_id_fkey (
            nome
          )
        )
      `)
      .gte('data_aula', periodo.dataInicio)
      .lte('data_aula', periodo.dataFim),
    supabase
      .from('visitante_visitas')
      .select('id, pessoa_id, destino, data_visita')
      .gte('data_visita', periodo.dataInicio)
      .lte('data_visita', periodo.dataFim),
    supabase
      .from('banda_municipal_presencas')
      .select('id, tipo, status, status_pagamento, valor_total')
      .gte('data', periodo.dataInicio)
      .lte('data', periodo.dataFim),
  ])

  const erros = [
    eventosError?.message,
    ensaiosError?.message,
    apresentacoesError?.message,
    frequenciasError?.message,
    visitasError?.message,
    bandaPresencasError?.message,
  ].filter(Boolean)

  if (erros.length > 0) {
    throw new Error(erros.join(' | '))
  }

  const mapaAtividades = new Map<string, LinhaAtividadeInstitucional>()
  const eventos = (eventosData ?? []) as AgendaEventoRel[]
  const ensaios = (ensaiosData ?? []) as EnsaioRel[]
  const apresentacoes = (apresentacoesData ?? []) as ApresentacaoRel[]

  eventos.forEach((evento) => {
    agregarAtividade(mapaAtividades, evento.modulo || 'Institucional', evento.tipo, evento.status)
  })
  ensaios.forEach((ensaio) => {
    agregarAtividade(mapaAtividades, 'Banda Municipal', 'ensaio', ensaio.status)
  })
  apresentacoes.forEach((apresentacao) => {
    agregarAtividade(mapaAtividades, 'Banda Municipal', 'apresentacao', apresentacao.status)
  })

  const mapaFrequencia = new Map<string, LinhaFrequenciaInstitucional>()
  const frequencias = (frequenciasData ?? []) as unknown as FrequenciaRel[]

  frequencias.forEach((frequencia) => {
    const aula = normalizarRelacao(frequencia.aulas)
    const modalidade = normalizarRelacao(aula?.modalidades ?? null)
    const nomeModalidade = modalidade?.nome || 'Não informado'
    const atual =
      mapaFrequencia.get(nomeModalidade) ??
      {
        modalidade: nomeModalidade,
        lancamentos: 0,
        presencas: 0,
        faltas: 0,
        frequenciaMedia: 0,
      }

    const status = statusNormalizado(frequencia.status)
    atual.lancamentos += 1
    if (status === 'presente') atual.presencas += 1
    if (status === 'falta' || status === 'faltou') atual.faltas += 1
    atual.frequenciaMedia = percentual(atual.presencas, atual.lancamentos)
    mapaFrequencia.set(nomeModalidade, atual)
  })

  const visitas = (visitasData ?? []) as VisitaRel[]
  const visitasPorPessoa = new Map<string, number>()

  visitas.forEach((visita) => {
    const pessoa = visita.pessoa_id || visita.id
    visitasPorPessoa.set(pessoa, (visitasPorPessoa.get(pessoa) ?? 0) + 1)
  })

  const mapaVisitantes = new Map<string, LinhaVisitantesInstitucional & { pessoas: Set<string> }>()

  visitas.forEach((visita) => {
    const destino = destinoLabel(visita.destino)
    const pessoa = visita.pessoa_id || visita.id
    const atual =
      mapaVisitantes.get(destino) ??
      {
        destino,
        visitas: 0,
        visitantesUnicos: 0,
        visitantesRecorrentes: 0,
        taxaRecorrencia: 0,
        pessoas: new Set<string>(),
      }

    atual.visitas += 1
    atual.pessoas.add(pessoa)
    atual.visitantesUnicos = atual.pessoas.size
    atual.visitantesRecorrentes = Array.from(atual.pessoas).filter(
      (pessoaId) => (visitasPorPessoa.get(pessoaId) ?? 0) > 1
    ).length
    atual.taxaRecorrencia = percentual(atual.visitantesRecorrentes, atual.visitantesUnicos)
    mapaVisitantes.set(destino, atual)
  })

  const presencasBanda = (bandaPresencasData ?? []) as PresencaBandaRel[]
  const mapaBanda = new Map<string, LinhaBandaInstitucional>()

  presencasBanda.forEach((presenca) => {
    const tipo = tipoLabel(presenca.tipo)
    const atual =
      mapaBanda.get(tipo) ??
      {
        tipo,
        lancamentos: 0,
        presencas: 0,
        faltas: 0,
        justificadas: 0,
        presencaMedia: 0,
        valorTotal: 0,
        pagamentosPendentes: 0,
        pagamentosPagos: 0,
      }

    const status = statusNormalizado(presenca.status)
    const statusPagamento = statusNormalizado(presenca.status_pagamento)
    atual.lancamentos += 1
    if (status === 'presente') atual.presencas += 1
    if (status === 'falta') atual.faltas += 1
    if (status === 'justificado') atual.justificadas += 1
    if (statusPagamento === 'pago') atual.pagamentosPagos += 1
    else atual.pagamentosPendentes += 1
    atual.valorTotal += Number(presenca.valor_total ?? 0)
    atual.presencaMedia = percentual(atual.presencas, atual.lancamentos)
    mapaBanda.set(tipo, atual)
  })

  const frequencia = Array.from(mapaFrequencia.values()).sort(
    (a, b) => b.lancamentos - a.lancamentos || a.modalidade.localeCompare(b.modalidade)
  )
  const visitantes = Array.from(mapaVisitantes.values())
    .map(({ pessoas: _pessoas, ...linha }) => linha)
    .sort((a, b) => b.visitas - a.visitas || a.destino.localeCompare(b.destino))
  const banda = Array.from(mapaBanda.values()).sort((a, b) => a.tipo.localeCompare(b.tipo))
  const atividades = Array.from(mapaAtividades.values()).sort(
    (a, b) => a.modulo.localeCompare(b.modulo) || a.tipo.localeCompare(b.tipo)
  )

  const totalFrequencias = frequencia.reduce((acc, item) => acc + item.lancamentos, 0)
  const totalPresencas = frequencia.reduce((acc, item) => acc + item.presencas, 0)
  const totalBanda = banda.reduce((acc, item) => acc + item.lancamentos, 0)
  const totalPresencasBanda = banda.reduce((acc, item) => acc + item.presencas, 0)

  return {
    periodo,
    resumo: {
      atividadesRealizadas: atividades.reduce((acc, item) => acc + item.realizadas, 0),
      frequenciaMedia: percentual(totalPresencas, totalFrequencias),
      visitantesAtendidos: visitantes.reduce((acc, item) => acc + item.visitas, 0),
      presencaBanda: percentual(totalPresencasBanda, totalBanda),
    },
    atividades,
    frequencia,
    visitantes,
    banda,
  }
}
