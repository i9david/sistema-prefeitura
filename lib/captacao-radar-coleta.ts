/**
 * FASE 2 & 3 & 4: Coleta, Classificação e Scoring de Oportunidades
 * 
 * Sistema inteligente de monitoramento de captação de recursos
 * Fontes: APIs estruturadas + parsing de páginas
 */

import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import crypto from 'crypto'

// ============================================================================
// TIPOS
// ============================================================================

interface OportunidadeRaw {
  titulo: string
  descricao?: string
  url: string
  fonte: string
  fonteTipo: string
  valor?: number
  dataEncerramento?: Date
  dataAbertura?: Date
  areaDetectada?: string
}

interface OportunidadeClassificada {
  titulo: string
  descricao?: string
  url: string
  tipo: 'edital' | 'convenio' | 'patrocinio' | 'subvencao' | 'chamada_publica' | 'auxilio' | 'emprestimo'
  area: string
  elegivel: boolean
  elegibilidadeMotivo?: string
  valor?: number
  dataEncerramento?: Date
  dataAbertura?: Date
}

interface ScoreDetalhe {
  area: number
  valor: number
  prazo: number
  aderencia: number
  novidade: number
}

// ============================================================================
// 1. COLETA DE DADOS - SICONV (Governo Federal)
// ============================================================================

/**
 * Busca editais do SICONV (Sistema de Convênios do Governo Federal)
 * API: http://siconv.gov.br/json
 * Filtros: convênios abertos + por área
 */
export async function coletarOportunidadesSICV() {
  try {
    const response = await fetch('http://siconv.gov.br/api/v1/convenios', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 } // Cache 1 hora
    })

    if (!response.ok) throw new Error(`SICONV HTTP ${response.status}`)

    const dados = await response.json()

    return dados.convenios?.map((conv: any) => ({
      titulo: conv.nomeConvenio || 'Convênio sem título',
      descricao: conv.descricaoCompleta || conv.descricaoSimplificada,
      url: `http://siconv.gov.br/siconv/consultas/busca?txt=${conv.idConvenio}`,
      fonte: 'SICONV',
      fonteTipo: 'governo_federal',
      valor: conv.vlGlobalConvenio || undefined,
      dataEncerramento: conv.dtEncerramento ? new Date(conv.dtEncerramento) : undefined,
      dataAbertura: conv.dtPublicacao ? new Date(conv.dtPublicacao) : undefined,
      areaDetectada: detectarAreaSICV(conv.descricaoSimplificada || '')
    })) || []
  } catch (erro) {
    console.error('❌ Erro ao coletar SICONV:', erro)
    return []
  }
}

/**
 * Busca editais do Rouanet (Lei de Incentivo à Cultura)
 * Fonte: MINC - Ministério da Cultura
 * URL: http://dados.cultura.gov.br (dados públicos)
 */
export async function coletarOportunidadesRouanet() {
  try {
    // Rouanet disponibiliza dados em formato CSV/JSON
    const response = await fetch('http://dados.cultura.gov.br/api/3/action/datastore_search?resource_id=29d3a956-11e0-4b92-982f-6d2c20189f27&limit=1000', {
      next: { revalidate: 86400 } // Cache 24h
    })

    if (!response.ok) throw new Error(`Rouanet HTTP ${response.status}`)

    const dados = await response.json()

    return dados.result?.records?.map((rec: any) => ({
      titulo: rec.proponente_nome || 'Projeto Rouanet',
      descricao: rec.resumo_executivo || rec.descricao,
      url: `http://dados.cultura.gov.br/projeto/${rec.id}`,
      fonte: 'Rouanet',
      fonteTipo: 'governo_federal',
      valor: parseFloat(rec.valor || 0),
      dataEncerramento: rec.data_termino ? new Date(rec.data_termino) : undefined,
      dataAbertura: rec.data_inicio ? new Date(rec.data_inicio) : undefined,
      areaDetectada: 'cultura' // Rouanet é sempre cultura
    })) || []
  } catch (erro) {
    console.error('❌ Erro ao coletar Rouanet:', erro)
    return []
  }
}

/**
 * Busca oportunidades de Fundações
 * Fontes: BNDES, Banco do Brasil, Moreira Salles, etc
 */
export async function coletarOportunidadesFundacoes() {
  const oportunidades: OportunidadeRaw[] = []

  // BNDES - Dados públicos
  try {
    const response = await fetch('https://www.bndes.gov.br/api/programa', {
      next: { revalidate: 86400 }
    })
    if (response.ok) {
      const dados = await response.json()
      oportunidades.push(...(dados.programas?.map((prog: any) => ({
        titulo: prog.nomeProjeto,
        descricao: prog.descricao,
        url: `https://www.bndes.gov.br/wps/portal/site/home/conhecimento/pesquisas/${prog.id}`,
        fonte: 'BNDES',
        fonteTipo: 'fundacao',
        valor: prog.valorDisponivelAinda,
        areaDetectada: detectarArea(prog.descricao || '')
      })) || []))
    }
  } catch (erro) {
    console.error('⚠️ Erro BNDES:', erro)
  }

  // Fundação Banco do Brasil
  try {
    const response = await fetch('https://www.fbb.org.br/pt-br/api/editais', {
      next: { revalidate: 86400 }
    })
    if (response.ok) {
      const dados = await response.json()
      oportunidades.push(...(dados.editais?.map((ed: any) => ({
        titulo: ed.nome,
        descricao: ed.resumo,
        url: ed.linkExterno,
        fonte: 'FBB',
        fonteTipo: 'fundacao',
        valor: ed.valorTotal,
        dataEncerramento: ed.dataEncerramento ? new Date(ed.dataEncerramento) : undefined,
        areaDetectada: detectarArea(ed.resumo || '')
      })) || []))
    }
  } catch (erro) {
    console.error('⚠️ Erro FBB:', erro)
  }

  return oportunidades
}

/**
 * Busca de Portal da Transparência de Goiás
 * Fonte: SEDECT-GO (parsing estruturado)
 */
export async function coletarOportunidadesGoias() {
  try {
    const response = await fetch('https://www.sedect.go.gov.br/api/editais', {
      next: { revalidate: 604800 } // Cache 7 dias
    })

    if (!response.ok) throw new Error(`SEDECT HTTP ${response.status}`)

    const dados = await response.json()

    return dados.editais?.map((ed: any) => ({
      titulo: ed.titulo,
      descricao: ed.descricao,
      url: ed.link,
      fonte: 'SEDECT-GO',
      fonteTipo: 'estadual',
      valor: ed.valor,
      dataEncerramento: ed.dataEncerramento ? new Date(ed.dataEncerramento) : undefined,
      areaDetectada: detectarArea(ed.descricao || '')
    })) || []
  } catch (erro) {
    console.error('⚠️ Erro SEDECT-GO:', erro)
    return []
  }
}

// ============================================================================
// 2. CLASSIFICAÇÃO AUTOMÁTICA
// ============================================================================

/**
 * Classifica oportunidade automaticamente
 */
export function classificarOportunidade(
  raw: OportunidadeRaw
): OportunidadeClassificada {
  // Detectar tipo de oportunidade
  const tipo = detectarTipo(raw.titulo + ' ' + (raw.descricao || ''))

  // Detectar área
  const area = raw.areaDetectada || detectarArea(raw.titulo + ' ' + (raw.descricao || ''))

  // Verificar elegibilidade para prefeitura
  const { elegivel, motivo } = verificarElegibilidade(
    raw.titulo,
    raw.descricao || '',
    area
  )

  return {
    titulo: raw.titulo,
    descricao: raw.descricao,
    url: raw.url,
    tipo,
    area,
    elegivel,
    elegibilidadeMotivo: motivo,
    valor: raw.valor,
    dataEncerramento: raw.dataEncerramento,
    dataAbertura: raw.dataAbertura
  }
}

/**
 * Detecta tipo de oportunidade
 */
function detectarTipo(texto: string): OportunidadeClassificada['tipo'] {
  const lower = texto.toLowerCase()

  if (lower.includes('edital')) return 'edital'
  if (lower.includes('convênio') || lower.includes('convenio')) return 'convenio'
  if (lower.includes('patrocínio') || lower.includes('patrocinio')) return 'patrocinio'
  if (lower.includes('subvenção') || lower.includes('subvencao')) return 'subvencao'
  if (lower.includes('chamada') || lower.includes('chamada pública')) return 'chamada_publica'
  if (lower.includes('auxílio') || lower.includes('auxilio')) return 'auxilio'
  if (lower.includes('empréstimo') || lower.includes('emprestimo')) return 'emprestimo'

  return 'edital' // default
}

/**
 * Detecta área da oportunidade
 */
function detectarArea(texto: string): string {
  const lower = texto.toLowerCase()

  const mapa = {
    cultura: ['cultura', 'artes', 'cinema', 'música', 'teatro', 'dança', 'patrimônio', 'museu'],
    turismo: ['turismo', 'turístico', 'roteiro', 'atração', 'hospedagem', 'gastronomia'],
    educacao: ['educação', 'escola', 'professor', 'aluno', 'formação', 'capacitação'],
    assistencia: ['assistência', 'social', 'vulnerável', 'pobreza', 'habitação'],
    saude: ['saúde', 'médico', 'hospital', 'farmácia', 'prevenção'],
    meio_ambiente: ['ambiental', 'sustentável', 'verde', 'floresta', 'água'],
    infraestrutura: ['infraestrutura', 'estrada', 'saneamento', 'energia'],
  }

  for (const [area, palavras] of Object.entries(mapa)) {
    if (palavras.some(p => lower.includes(p))) {
      return area
    }
  }

  return 'outras'
}

/**
 * Verifica se prefeitura é elegível
 */
function verificarElegibilidade(
  titulo: string,
  descricao: string,
  area: string
): { elegivel: boolean; motivo?: string } {
  const texto = (titulo + ' ' + descricao).toLowerCase()

  // Critérios de INelegibilidade
  if (texto.includes('empresa privada')) {
    return { elegivel: false, motivo: 'Restrito a empresas privadas' }
  }
  if (texto.includes('ong') && !texto.includes('governo')) {
    return { elegivel: false, motivo: 'Restrito a ONGs' }
  }
  if (texto.includes('universidade') && !texto.includes('municipal')) {
    return { elegivel: false, motivo: 'Restrito a universidades' }
  }

  // Critérios de elegibilidade
  if (texto.includes('prefeitura') || texto.includes('município') || texto.includes('governo municipal')) {
    return { elegivel: true }
  }

  // Por padrão, governo federal/estadual costuma aceitar prefeituras
  if (area === 'cultura' || area === 'turismo' || area === 'assistencia') {
    return { elegivel: true, motivo: 'Tipicamente elegível para prefeitura' }
  }

  return { elegivel: null, motivo: 'Requer validação manual' } as any
}

/**
 * Detecta área específica para SICONV
 */
function detectarAreaSICV(texto: string): string {
  if (texto.toLowerCase().includes('cultura')) return 'cultura'
  if (texto.toLowerCase().includes('turismo')) return 'turismo'
  return detectarArea(texto)
}

// ============================================================================
// 3. CÁLCULO DE SCORE
// ============================================================================

/**
 * Calcula score inteligente para oportunidade
 */
export async function calcularScore(
  classificada: OportunidadeClassificada,
  municipioId: string,
  diasDesde: number
): Promise<{ score: number; detalhe: ScoreDetalhe }> {
  const supabase = await createClient()

  // Buscar score de aderência com projetos
  let scoreAderencia = 0
  try {
    const { data: projetos } = await supabase
      .from('captacao_projetos')
      .select('area')
      .eq('municipio_id', municipioId)

    if (projetos && projetos.length > 0) {
      const areasValidas = projetos
        .map(p => p.area)
        .filter((a): a is string => a !== null)

      if (areasValidas.includes(classificada.area)) {
        scoreAderencia = 20
      } else if (
        (classificada.area === 'cultura' || classificada.area === 'turismo') &&
        areasValidas.some(a => ['cultura', 'turismo'].includes(a))
      ) {
        scoreAderencia = 15
      } else {
        scoreAderencia = 5
      }
    }
  } catch (erro) {
    console.error('⚠️ Erro ao buscar aderência:', erro)
    scoreAderencia = 10 // score neutro
  }

  // Chamar função SQL de cálculo
  const { data, error } = await supabase.rpc('calcular_score_oportunidade', {
    p_area: classificada.area,
    p_valor: classificada.valor || null,
    p_data_encerramento: classificada.dataEncerramento || null,
    p_dias_descoberta: diasDesde,
    p_score_aderencia: scoreAderencia
  })

  if (error) throw error

  const resultado = data?.[0] || { score_final: 50, detalhe: {} }

  return {
    score: parseFloat(resultado.score_final) || 50,
    detalhe: resultado.detalhe || { area: 0, valor: 0, prazo: 0, aderencia: 0, novidade: 0 }
  }
}

// ============================================================================
// 4. DEDUPLICAÇÃO POR HASH
// ============================================================================

/**
 * Gera hash SHA256 para deduplicação
 */
export function gerarHashOportunidade(titulo: string, url: string): string {
  return crypto
    .createHash('sha256')
    .update(`${titulo}|${url}`)
    .digest('hex')
}

/**
 * Verifica se oportunidade já existe
 */
export async function verificarDuplicata(
  municipioId: string,
  hash: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('captacao_radar_oportunidades')
    .select('id')
    .eq('municipio_id', municipioId)
    .eq('hash_unico', hash)
    .limit(1)

  return !!data?.length
}

// ============================================================================
// 5. SALVAMENTO E ATUALIZAÇÃO
// ============================================================================

/**
 * Salva oportunidade coletada no banco
 */
export async function salvarOportunidade(
  municipioId: string,
  classificada: OportunidadeClassificada,
  hash: string,
  fonta_id?: string,
  scoreData?: { score: number; detalhe: ScoreDetalhe }
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('captacao_radar_oportunidades')
    .insert({
      municipio_id: municipioId,
      titulo: classificada.titulo,
      descricao: classificada.descricao,
      url: classificada.url,
      fonte_id: fonta_id,
      tipo: classificada.tipo,
      area: classificada.area,
      valor_estimado: classificada.valor,
      data_abertura: classificada.dataAbertura,
      data_encerramento: classificada.dataEncerramento,
      elegivel_prefeitura: classificada.elegivel,
      elegibilidade_motivo: classificada.elegibilidadeMotivo,
      score: scoreData?.score || 50,
      score_detalhe: scoreData?.detalhe || {},
      hash_unico: hash,
      status: 'nova'
    })
    .select()

  if (error) throw error
  return data?.[0]
}

/**
 * Atualiza score de oportunidade existente
 */
export async function atualizarScore(
  municipioId: string,
  oportunidadeId: string,
  scoreNovo: number,
  scoreAnterior: number,
  detalheNovo: ScoreDetalhe,
  detalheAnterior?: ScoreDetalhe,
  motivo?: string
) {
  const supabase = await createClient()

  // Atualizar oportunidade
  const { error: errorUpdate } = await supabase
    .from('captacao_radar_oportunidades')
    .update({
      score: scoreNovo,
      score_detalhe: detalheNovo,
      score_calculado_em: new Date().toISOString()
    })
    .eq('id', oportunidadeId)
    .eq('municipio_id', municipioId)

  if (errorUpdate) throw errorUpdate

  // Registrar no histórico
  if (scoreNovo !== scoreAnterior) {
    await supabase
      .from('captacao_radar_historico_score')
      .insert({
        municipio_id: municipioId,
        oportunidade_id: oportunidadeId,
        score_anterior: scoreAnterior,
        score_novo: scoreNovo,
        criterios_anterior: detalheAnterior || {},
        criterios_novo: detalheNovo,
        motivo_mudanca: motivo,
        alterado_por: 'sistema'
      })
  }
}

// ============================================================================
// 6. ORQUESTRAÇÃO - COLETA COMPLETA
// ============================================================================

/**
 * Executa coleta completa de todas as fontes
 * Chamado por cron job a cada X horas
 */
export async function executarColetaCompleta(municipioId: string) {
  console.log(`🚀 Iniciando coleta de oportunidades para município ${municipioId}`)

  try {
    // 1. Coletar de todas as fontes
    const todasOportunidades = await Promise.all([
      coletarOportunidadesSICV(),
      coletarOportunidadesRouanet(),
      coletarOportunidadesFundacoes(),
      coletarOportunidadesGoias()
    ]).then(resultados => resultados.flat())

    console.log(`📊 Total coletado: ${todasOportunidades.length} oportunidades`)

    let contadoresNvas = 0
    let contadoresDuplicatas = 0

    // 2. Processar cada oportunidade
    for (const raw of todasOportunidades) {
      try {
        // Classificar
        const classificada = classificarOportunidade(raw)

        // Gerar hash
        const hash = gerarHashOportunidade(classificada.titulo, classificada.url)

        // Verificar duplicata
        const ehDuplicata = await verificarDuplicata(municipioId, hash)
        if (ehDuplicata) {
          contadoresDuplicatas++
          continue
        }

        // Calcular score
        const scoreData = await calcularScore(classificada, municipioId, 0)

        // Salvar
        await salvarOportunidade(municipioId, classificada, hash, undefined, scoreData)

        contadoresNvas++
      } catch (erro) {
        console.error(`⚠️ Erro ao processar oportunidade: ${erro}`)
        continue
      }
    }

    console.log(`✅ Coleta concluída: ${contadoresNvas} novas, ${contadoresDuplicatas} duplicatas ignoradas`)
    return { novas: contadoresNvas, duplicatas: contadoresDuplicatas }
  } catch (erro) {
    console.error(`❌ Erro na coleta:`, erro)
    throw erro
  }
}
