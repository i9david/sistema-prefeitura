'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'

function texto(valor: unknown) {
  return String(valor || '').toLowerCase()
}

function calcularAderencia(projeto: any, oportunidade: any) {
  let score = 0

  const areaProjeto = texto(projeto.area)
  const areaOportunidade = texto(oportunidade.area)

  if (areaProjeto && areaOportunidade) {
    if (areaProjeto === areaOportunidade) score += 50
    if (areaProjeto === 'integrado' || areaOportunidade === 'integrado') score += 30
  }

  const baseProjeto = texto(`
    ${projeto.nome}
    ${projeto.tipo}
    ${projeto.descricao}
    ${projeto.justificativa}
    ${projeto.publico_beneficiado}
  `)

  const baseOportunidade = texto(`
    ${oportunidade.titulo}
    ${oportunidade.tipo}
    ${oportunidade.resumo}
    ${oportunidade.quem_pode_participar}
    ${oportunidade.resumo_ia}
    ${oportunidade.requisitos_ia}
    ${oportunidade.publico_ia}
  `)

  const palavras = [
    'cultura',
    'turismo',
    'patrimônio',
    'patrimonio',
    'museu',
    'evento',
    'formação',
    'formacao',
    'capacitação',
    'capacitacao',
    'arte',
    'artesão',
    'artesao',
    'música',
    'musica',
    'dança',
    'danca',
    'sinalização',
    'sinalizacao',
    'infraestrutura',
  ]

  for (const palavra of palavras) {
    if (baseProjeto.includes(palavra) && baseOportunidade.includes(palavra)) {
      score += 8
    }
  }

  if (texto(oportunidade.elegibilidade_prefeitura) === 'sim') score += 20
  if (texto(oportunidade.elegibilidade_prefeitura) === 'precisa_validar') score += 8

  return Math.min(score, 100)
}

function calcularFinanceiro(oportunidade: any) {
  const valor = Number(oportunidade.valor_disponivel || 0)

  if (valor >= 1000000) return 100
  if (valor >= 500000) return 85
  if (valor >= 100000) return 70
  if (valor > 0) return 50

  return 30
}

function calcularPrazo(oportunidade: any) {
  if (!oportunidade.prazo_inscricao) return 50

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const prazo = new Date(`${oportunidade.prazo_inscricao}T23:59:59`)
  const dias = Math.ceil((prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

  if (dias < 0) return 0
  if (dias <= 7) return 35
  if (dias <= 30) return 75

  return 100
}

function classificarPrioridade(score: number) {
  if (score >= 75) return 'alta'
  if (score >= 45) return 'media'
  return 'baixa'
}

function sugestaoPorPrioridade(prioridade: string) {
  if (prioridade === 'alta') return 'Prioridade alta. Avaliar imediatamente e iniciar elaboração da proposta.'
  if (prioridade === 'media') return 'Prioridade média. Revisar requisitos e ajustar o projeto para melhorar aderência.'
  return 'Baixa prioridade. Manter no radar, mas não priorizar neste momento.'
}

export async function gerarMatching() {
  const supabase = await createClient()

  const { data: projetos, error: projetosError } = await supabase
    .from('captacao_projetos')
    .select('*')

  if (projetosError) {
    redirect(`/projetos-captacao/matching?message=${encodeURIComponent(projetosError.message)}`)
  }

  const { data: oportunidades, error: oportunidadesError } = await supabase
    .from('captacao_oportunidades')
    .select('*')
    .in('status', ['aberta', 'em_analise', 'cadastrada'])

  if (oportunidadesError) {
    redirect(`/projetos-captacao/matching?message=${encodeURIComponent(oportunidadesError.message)}`)
  }

  if (!projetos || projetos.length === 0) {
    redirect('/projetos-captacao/matching?message=Nenhum projeto cadastrado para gerar matching')
  }

  if (!oportunidades || oportunidades.length === 0) {
    redirect('/projetos-captacao/matching?message=Nenhuma oportunidade aberta ou em análise para gerar matching')
  }

  await supabase
    .from('captacao_matching')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  let gerados = 0

  for (const projeto of projetos) {
    for (const oportunidade of oportunidades) {
      const scoreAderencia = calcularAderencia(projeto, oportunidade)
      const scoreFinanceiro = calcularFinanceiro(oportunidade)
      const scorePrazo = calcularPrazo(oportunidade)

      const scoreFinal = Math.round(
        scoreAderencia * 0.55 +
        scoreFinanceiro * 0.25 +
        scorePrazo * 0.2
      )

      const prioridade = classificarPrioridade(scoreFinal)

      const valorEstimado = oportunidade.valor_disponivel
        ? Number(oportunidade.valor_disponivel)
        : null

      const { error } = await supabase.from('captacao_matching').insert({
        projeto_id: projeto.id,
        oportunidade_id: oportunidade.id,
        score: scoreFinal,
        score_aderencia: scoreAderencia,
        score_financeiro: scoreFinanceiro,
        score_prazo: scorePrazo,
        valor_estimado: valorEstimado,
        prioridade,
        nivel: prioridade,
        justificativa:
          'Compatibilidade calculada por área, palavras chave, elegibilidade da prefeitura, valor disponível e prazo.',
        sugestao: sugestaoPorPrioridade(prioridade),
        status: 'ativo',
      })

      if (!error) gerados++
    }
  }

  redirect(`/projetos-captacao/matching?message=Matching atualizado. ${gerados} combinações geradas.`)
}