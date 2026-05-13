/**
 * FASE 5 & 7: Ações do Radar Avançado
 * Funcionalidades de vinculação, integração com projetos e gerenciamento
 */

'use server'

import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { redirect } from 'next/navigation'

// ============================================================================
// VINCULAÇÃO COM PROJETOS
// ============================================================================

/**
 * Vincular oportunidade a projeto existente
 */
export async function vincularOportunidadeAoProjeto(
  oportunidadeId: string,
  projetoId: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuarioInterno, error: errorUsuario } = await supabase
    .from('usuarios_internos')
    .select('id, municipio_id')
    .eq('auth_user_id', user.id)
    .single()

  if (errorUsuario || !usuarioInterno) throw new Error('Usuário não encontrado')

  // Verificar que ambos pertencem ao mesmo município
  const { data: oportunidade } = await supabase
    .from('captacao_radar_oportunidades')
    .select('municipio_id')
    .eq('id', oportunidadeId)
    .single()

  const { data: projeto } = await supabase
    .from('captacao_projetos')
    .select('municipio_id')
    .eq('id', projetoId)
    .single()

  if (oportunidade?.municipio_id !== usuarioInterno.municipio_id ||
      projeto?.municipio_id !== usuarioInterno.municipio_id) {
    throw new Error('Sem permissão para acessar esses recursos')
  }

  // Criar vinculação
  const { data: vinculacao, error } = await supabase
    .from('captacao_radar_vinculacoes')
    .insert({
      municipio_id: usuarioInterno.municipio_id,
      oportunidade_id: oportunidadeId,
      projeto_id: projetoId,
      status: 'vinculada',
      vinculada_por: usuarioInterno.id
    })
    .select()

  if (error) throw error

  // Atualizar status da oportunidade
  await supabase
    .from('captacao_radar_oportunidades')
    .update({ status: 'vinculada' })
    .eq('id', oportunidadeId)

  return vinculacao?.[0]
}

/**
 * Desvincula oportunidade do projeto
 */
export async function desvinculaOportunidadeDoProjeto(
  vinculacaoId: string,
  motivo?: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuarioInterno } = await supabase
    .from('usuarios_internos')
    .select('id, municipio_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!usuarioInterno) throw new Error('Usuário não encontrado')

  // Atualizar vinculação
  const { data: vinculacao, error } = await supabase
    .from('captacao_radar_vinculacoes')
    .update({
      status: 'desvinculada',
      resultado: motivo,
      desvinculada_em: new Date().toISOString()
    })
    .eq('id', vinculacaoId)
    .eq('municipio_id', usuarioInterno.municipio_id)
    .select()

  if (error) throw error

  // Verificar se ainda tem outras vinculações ativas
  if (vinculacao?.[0]?.oportunidade_id) {
    const { data: outrasVinculacoes } = await supabase
      .from('captacao_radar_vinculacoes')
      .select('id')
      .eq('oportunidade_id', vinculacao[0].oportunidade_id)
      .eq('status', 'vinculada')

    if (!outrasVinculacoes?.length) {
      await supabase
        .from('captacao_radar_oportunidades')
        .update({ status: 'analisada' })
        .eq('id', vinculacao[0].oportunidade_id)
    }
  }

  return vinculacao?.[0]
}

// ============================================================================
// CRIAR PROJETO AUTOMATICAMENTE
// ============================================================================

/**
 * Criar novo projeto automaticamente a partir da oportunidade
 */
export async function criarProjetoAPartirOportunidade(
  oportunidadeId: string,
  dados?: {
    nome?: string
    descricao?: string
    area?: string
  }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuarioInterno } = await supabase
    .from('usuarios_internos')
    .select('id, municipio_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!usuarioInterno) throw new Error('Usuário não encontrado')

  // Buscar oportunidade
  const { data: oportunidade, error: errorOp } = await supabase
    .from('captacao_radar_oportunidades')
    .select('*')
    .eq('id', oportunidadeId)
    .eq('municipio_id', usuarioInterno.municipio_id)
    .single()

  if (errorOp || !oportunidade) throw new Error('Oportunidade não encontrada')

  // Criar projeto
  const { data: novoProjeto, error: errorProj } = await supabase
    .from('captacao_projetos')
    .insert({
      municipio_id: usuarioInterno.municipio_id,
      nome: dados?.nome || oportunidade.titulo,
      descricao: dados?.descricao || oportunidade.descricao,
      area: dados?.area || oportunidade.area,
      status: 'rascunho',
      prioridade: 'media',
      valor_estimado: oportunidade.valor_estimado,
      criado_por: usuarioInterno.id
    })
    .select()

  if (errorProj) throw errorProj

  const novoProjetoId = novoProjeto?.[0]?.id
  if (!novoProjetoId) throw new Error('Falha ao criar projeto')

  // Vincular automaticamente
  await vincularOportunidadeAoProjeto(oportunidadeId, novoProjetoId)

  return novoProjeto?.[0]
}

// ============================================================================
// GERENCIAMENTO DE STATUS
// ============================================================================

/**
 * Marcar oportunidade como descartada
 */
export async function descartarOportunidade(
  oportunidadeId: string,
  motivo: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuarioInterno } = await supabase
    .from('usuarios_internos')
    .select('municipio_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!usuarioInterno) throw new Error('Usuário não encontrado')

  const { data, error } = await supabase
    .from('captacao_radar_oportunidades')
    .update({
      status: 'descartada',
      elegibilidade_motivo: motivo
    })
    .eq('id', oportunidadeId)
    .eq('municipio_id', usuarioInterno.municipio_id)
    .select()

  if (error) throw error
  return data?.[0]
}

/**
 * Arquivar oportunidade (após encerramento)
 */
export async function arquivarOportunidade(oportunidadeId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuarioInterno } = await supabase
    .from('usuarios_internos')
    .select('municipio_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!usuarioInterno) throw new Error('Usuário não encontrado')

  const { data, error } = await supabase
    .from('captacao_radar_oportunidades')
    .update({ status: 'arquivada' })
    .eq('id', oportunidadeId)
    .eq('municipio_id', usuarioInterno.municipio_id)
    .select()

  if (error) throw error
  return data?.[0]
}

// ============================================================================
// CONSULTAS
// ============================================================================

/**
 * Listar oportunidades com filtros avançados
 */
export async function listarOportunidades(filtros?: {
  status?: string
  area?: string
  minScore?: number
  maxDaysToExpire?: number
  limite?: number
  offset?: number
}) {
  const supabase = await createClient()

  let query = supabase
    .from('captacao_radar_oportunidades')
    .select('*, fonte:captacao_radar_fontes!captacao_radar_fonte_id_fkey(nome)', { count: 'exact' })
    .order('score', { ascending: false })

  // Filtros
  if (filtros?.status) {
    query = query.eq('status', filtros.status)
  }
  if (filtros?.area) {
    query = query.eq('area', filtros.area)
  }
  if (filtros?.minScore !== undefined) {
    query = query.gte('score', filtros.minScore)
  }

  // Filtro por dias para encerramento
  if (filtros?.maxDaysToExpire !== undefined) {
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() + filtros.maxDaysToExpire)
    query = query.lte('data_encerramento', dataLimite.toISOString().split('T')[0])
  }

  // Paginação
  if (filtros?.limite) {
    const offset = filtros.offset || 0
    query = query.range(offset, offset + filtros.limite - 1)
  }

  const { data, error, count } = await query

  if (error) throw error

  return {
    oportunidades: data || [],
    total: count || 0
  }
}

/**
 * Obter detalhes completos de uma oportunidade
 */
export async function obterOportunidadeDetalhes(oportunidadeId: string) {
  const supabase = await createClient()

  // Oportunidade
  const { data: oportunidade, error: errorOp } = await supabase
    .from('captacao_radar_oportunidades')
    .select('*, fonte:captacao_radar_fontes!captacao_radar_fonte_id_fkey(nome, tipo)')
    .eq('id', oportunidadeId)
    .single()

  if (errorOp || !oportunidade) throw new Error('Oportunidade não encontrada')

  // Vinculações
  const { data: vinculacoes } = await supabase
    .from('captacao_radar_vinculacoes')
    .select('*, projeto:captacao_projetos!captacao_radar_projeto_id_fkey(id, nome), usuario:usuarios_internos!captacao_radar_usuario_id_fkey(nome)')
    .eq('oportunidade_id', oportunidadeId)
    .order('data_vinculacao', { ascending: false })

  // Histórico de scores
  const { data: historico } = await supabase
    .from('captacao_radar_historico_score')
    .select('*')
    .eq('oportunidade_id', oportunidadeId)
    .order('alterado_em', { ascending: false })
    .limit(10)

  return {
    oportunidade,
    vinculacoes: vinculacoes || [],
    historico: historico || []
  }
}

// ============================================================================
// ESTATÍSTICAS E DASHBOARD
// ============================================================================

/**
 * Estatísticas do radar para dashboard
 */
export async function obterEstatisticasRadar() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuarioInterno } = await supabase
    .from('usuarios_internos')
    .select('municipio_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!usuarioInterno) throw new Error('Usuário não encontrado')

  const municipioId = usuarioInterno.municipio_id

  // Total por status
  const { data: porStatus } = await supabase
    .from('captacao_radar_oportunidades')
    .select('status')
    .eq('municipio_id', municipioId)

  // Total por área
  const { data: porArea } = await supabase
    .from('captacao_radar_oportunidades')
    .select('area')
    .eq('municipio_id', municipioId)
    .neq('status', 'descartada')

  // Oportunidades com prazo próximo
  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() + 7)

  const { count: prazoCurto } = await supabase
    .from('captacao_radar_oportunidades')
    .select('*', { count: 'exact' })
    .eq('municipio_id', municipioId)
    .lte('data_encerramento', dataLimite.toISOString().split('T')[0])
    .neq('status', 'descartada')

  // Score médio
  const { data: scores } = await supabase
    .from('captacao_radar_oportunidades')
    .select('score')
    .eq('municipio_id', municipioId)
    .neq('status', 'descartada')

  const scoreMedio = scores?.length
    ? (scores.reduce((a, b) => a + (b.score || 0), 0) / scores.length).toFixed(1)
    : 0

  // Fontes ativas
  const { data: fontes } = await supabase
    .from('captacao_radar_fontes')
    .select('nome, ultima_atualizacao, total_oportunidades_encontradas')
    .eq('municipio_id', municipioId)
    .eq('ativa', true)
    .order('ultima_atualizacao', { ascending: false })
    .limit(5)

  return {
    total: porStatus?.length || 0,
    porStatus: _groupBy(porStatus || [], 'status'),
    porArea: _groupBy(porArea || [], 'area'),
    prazoCurto: prazoCurto || 0,
    scoreMedio: parseFloat(scoreMedio as string),
    ultimasAtualizacoes: fontes || []
  }
}

/**
 * Oportunidades prioritárias (alto score + prazo curto)
 */
export async function obterOportunidadesPrioritarias(limite: number = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vw_captacao_radar_prioritarias')
    .select('*')
    .order('score', { ascending: false })
    .order('dias_para_encerramento', { ascending: true })
    .limit(limite)

  if (error) throw error
  return data || []
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function _groupBy<T extends Record<string, any>>(arr: T[], key: string): Record<string, number> {
  return arr.reduce((acc, item) => {
    const k = item[key] as string
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}
