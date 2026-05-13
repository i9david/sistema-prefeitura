/**
 * FASE 6: API Route para Automação
 * 
 * Rotina de coleta automática de oportunidades
 * Executada por cron job a cada X horas
 * 
 * Endpoints:
 * - POST /api/projetos-captacao/radar/atualizar - Coleta todas as fontes
 * - POST /api/projetos-captacao/radar/limpar-expired - Arquiva oportunidades expiradas
 */

import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import {
  executarColetaCompleta,
  gerarHashOportunidade,
  verificarDuplicata,
  salvarOportunidade,
  calcularScore,
  classificarOportunidade
} from '@/lib/captacao-radar-coleta'
import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// POST /api/projetos-captacao/radar/atualizar
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Validar token de autenticação
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Obter municipio_id do header ou usar Mineiros por padrão
    const municipioId = request.headers.get('x-municipio-id') || process.env.MUNICIPIO_MINEIROS_ID

    if (!municipioId) {
      return NextResponse.json(
        { erro: 'Município não configurado' },
        { status: 400 }
      )
    }

    console.log(`🚀 [RADAR] Iniciando coleta para município ${municipioId}`)

    // Executar coleta
    const resultado = await executarColetaCompleta(municipioId)

    // Atualizar timestamp das fontes
    const supabase = await createClient()
    await supabase
      .from('captacao_radar_fontes')
      .update({
        ultima_atualizacao: new Date().toISOString(),
        proximo_agendamento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('municipio_id', municipioId)
      .eq('ativa', true)

    return NextResponse.json({
      sucesso: true,
      resultado,
      timestamp: new Date().toISOString()
    })
  } catch (erro) {
    console.error('❌ [RADAR] Erro na coleta:', erro)
    return NextResponse.json(
      { erro: String(erro) },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/projetos-captacao/radar/limpar-expired
// Arquiva oportunidades com data de encerramento passada
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      )
    }

    const municipioId = request.headers.get('x-municipio-id') || process.env.MUNICIPIO_MINEIROS_ID

    if (!municipioId) {
      return NextResponse.json(
        { erro: 'Município não configurado' },
        { status: 400 }
      )
    }

    console.log(`🧹 [RADAR] Limpando oportunidades expiradas para ${municipioId}`)

    const supabase = await createClient()

    // Buscar oportunidades expiradas que ainda não foram arquivadas
    const { data: expiradas, error: errorBusca } = await supabase
      .from('captacao_radar_oportunidades')
      .select('id')
      .eq('municipio_id', municipioId)
      .lt('data_encerramento', new Date().toISOString().split('T')[0])
      .neq('status', 'arquivada')

    if (errorBusca) throw errorBusca

    if (!expiradas?.length) {
      return NextResponse.json({
        sucesso: true,
        arquivadas: 0,
        mensagem: 'Nenhuma oportunidade expirada'
      })
    }

    // Arquivar cada uma
    const { error: errorUpdate } = await supabase
      .from('captacao_radar_oportunidades')
      .update({ status: 'arquivada' })
      .in('id', expiradas.map(e => e.id))

    if (errorUpdate) throw errorUpdate

    console.log(`✅ [RADAR] ${expiradas.length} oportunidades arquivadas`)

    return NextResponse.json({
      sucesso: true,
      arquivadas: expiradas.length,
      timestamp: new Date().toISOString()
    })
  } catch (erro) {
    console.error('❌ [RADAR] Erro ao arquivar:', erro)
    return NextResponse.json(
      { erro: String(erro) },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH /api/projetos-captacao/radar/recalcular-scores
// Recalcula scores de todas as oportunidades ativas
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      )
    }

    const municipioId = request.headers.get('x-municipio-id') || process.env.MUNICIPIO_MINEIROS_ID

    if (!municipioId) {
      return NextResponse.json(
        { erro: 'Município não configurado' },
        { status: 400 }
      )
    }

    console.log(`📊 [RADAR] Recalculando scores para ${municipioId}`)

    const supabase = await createClient()

    // Buscar todas as oportunidades ativas
    const { data: oportunidades, error: errorBusca } = await supabase
      .from('captacao_radar_oportunidades')
      .select('*')
      .eq('municipio_id', municipioId)
      .neq('status', 'descartada')
      .neq('status', 'arquivada')

    if (errorBusca) throw errorBusca

    let atualizations = 0

    // Recalcular score para cada uma
    for (const oportunidade of oportunidades || []) {
      try {
        const diasDesde = Math.floor(
          (Date.now() - new Date(oportunidade.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )

        const scoreData = await calcularScore(
          {
            titulo: oportunidade.titulo,
            descricao: oportunidade.descricao,
            url: oportunidade.url,
            tipo: oportunidade.tipo,
            area: oportunidade.area,
            elegivel: oportunidade.elegivel_prefeitura,
            valor: oportunidade.valor_estimado,
            dataEncerramento: oportunidade.data_encerramento
          },
          municipioId,
          diasDesde
        )

        // Verificar se score mudou significativamente
        if (Math.abs(scoreData.score - (oportunidade.score || 0)) >= 5) {
          await supabase
            .from('captacao_radar_oportunidades')
            .update({
              score: scoreData.score,
              score_detalhe: scoreData.detalhe,
              score_calculado_em: new Date().toISOString()
            })
            .eq('id', oportunidade.id)

          // Registrar no histórico
          await supabase
            .from('captacao_radar_historico_score')
            .insert({
              municipio_id: municipioId,
              oportunidade_id: oportunidade.id,
              score_anterior: oportunidade.score,
              score_novo: scoreData.score,
              criterios_anterior: oportunidade.score_detalhe,
              criterios_novo: scoreData.detalhe,
              motivo_mudanca: 'Recalculado automaticamente',
              alterado_por: 'sistema'
            })

          atualizations++
        }
      } catch (erro) {
        console.error(`⚠️ Erro ao recalcular score de ${oportunidade.id}:`, erro)
      }
    }

    console.log(`✅ [RADAR] ${atualizations} scores recalculados`)

    return NextResponse.json({
      sucesso: true,
      recalculados: atualizations,
      timestamp: new Date().toISOString()
    })
  } catch (erro) {
    console.error('❌ [RADAR] Erro ao recalcular:', erro)
    return NextResponse.json(
      { erro: String(erro) },
      { status: 500 }
    )
  }
}
