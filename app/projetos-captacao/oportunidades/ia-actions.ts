'use server'

import OpenAI from 'openai'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { Sidebar } from "@/components/sidebar"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function limparTexto(valor: string | null | undefined) {
  return String(valor || '').trim()
}

function limitarTexto(texto: string, limite = 18000) {
  return texto.length > limite ? texto.slice(0, limite) : texto
}

async function salvarHistoricoIA({
  oportunidadeId,
  projetoId,
  tipo,
  prompt,
  resposta,
}: {
  oportunidadeId?: string | null
  projetoId?: string | null
  tipo: string
  prompt: string
  resposta: string
}) {
  const supabase = await createClient()

  await supabase.from('captacao_ia_historico').insert({
    oportunidade_id: oportunidadeId || null,
    projeto_id: projetoId || null,
    tipo,
    prompt,
    resposta,
  })
}

export async function analisarEditalComIA(formData: FormData) {
  const supabase = await createClient()

  if (!process.env.OPENAI_API_KEY) {
    redirect('/projetos-captacao/oportunidades?message=OPENAI_API_KEY não configurada no .env.local')
  }

  const id = String(formData.get('id') || '').trim()

  if (!id) {
    redirect('/projetos-captacao/oportunidades?message=Oportunidade não encontrada')
  }

  const { data: oportunidade, error } = await supabase
    .from('captacao_oportunidades')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !oportunidade) {
    redirect('/projetos-captacao/oportunidades?message=Oportunidade não encontrada')
  }

  const textoBase = limitarTexto(`
Título: ${limparTexto(oportunidade.titulo)}
Órgão: ${limparTexto(oportunidade.orgao)}
Esfera: ${limparTexto(oportunidade.esfera)}
Área: ${limparTexto(oportunidade.area)}
Tipo: ${limparTexto(oportunidade.tipo)}
Valor disponível: ${limparTexto(String(oportunidade.valor_disponivel || ''))}
Prazo: ${limparTexto(oportunidade.prazo_inscricao)}
Link: ${limparTexto(oportunidade.link_oficial)}
Resumo: ${limparTexto(oportunidade.resumo)}
Quem pode participar: ${limparTexto(oportunidade.quem_pode_participar)}
Documentos exigidos: ${limparTexto(oportunidade.documentos_exigidos)}
Texto do edital: ${limparTexto(oportunidade.texto_edital)}
`)

  const prompt = `
Você é analista técnico de captação de recursos para prefeitura municipal.

Analise a oportunidade abaixo e responda somente JSON válido.

Regras:
1. Não invente dados.
2. Se não houver informação suficiente, use "precisa_validar".
3. Verifique se Prefeitura Municipal pode participar.
4. O score deve ser de 0 a 100.

Formato:
{
  "resumo_ia": "",
  "requisitos_ia": "",
  "documentos_ia": "",
  "publico_ia": "",
  "valor_ia": "",
  "prazo_ia": "",
  "elegibilidade_prefeitura": "sim | nao | precisa_validar",
  "score_prefeitura": 0,
  "recomendacao_ia": ""
}

Oportunidade:
${textoBase}
`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      {
        role: 'system',
        content: 'Você analisa editais públicos para prefeituras. Responda apenas JSON válido.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.2,
  })

  const resposta = completion.choices[0]?.message?.content || '{}'

  let json: any = {}

  try {
    json = JSON.parse(resposta)
  } catch {
    await salvarHistoricoIA({
      oportunidadeId: id,
      tipo: 'analise_edital_erro_json',
      prompt,
      resposta,
    })

    redirect('/projetos-captacao/oportunidades?message=IA respondeu em formato inválido')
  }

  const { error: updateError } = await supabase
    .from('captacao_oportunidades')
    .update({
      resumo_ia: json.resumo_ia || null,
      requisitos_ia: json.requisitos_ia || null,
      documentos_ia: json.documentos_ia || null,
      publico_ia: json.publico_ia || null,
      valor_ia: json.valor_ia || null,
      prazo_ia: json.prazo_ia || null,
      elegibilidade_prefeitura: json.elegibilidade_prefeitura || null,
      score_prefeitura:
        typeof json.score_prefeitura === 'number' ? json.score_prefeitura : null,
      recomendacao_ia: json.recomendacao_ia || null,
    })
    .eq('id', id)

  await salvarHistoricoIA({
    oportunidadeId: id,
    tipo: 'analise_edital',
    prompt,
    resposta,
  })

  if (updateError) {
    redirect(`/projetos-captacao/oportunidades?message=${encodeURIComponent(updateError.message)}`)
  }

  redirect('/projetos-captacao/oportunidades?message=Edital analisado com IA')
}

export async function gerarProjetoAutomatico(formData: FormData) {
  const supabase = await createClient()

  if (!process.env.OPENAI_API_KEY) {
    redirect('/projetos-captacao/oportunidades?message=OPENAI_API_KEY não configurada no .env.local')
  }

  const id = String(formData.get('id') || '').trim()

  if (!id) {
    redirect('/projetos-captacao/oportunidades?message=Oportunidade não encontrada')
  }

  const { data: oportunidade, error } = await supabase
    .from('captacao_oportunidades')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !oportunidade) {
    redirect('/projetos-captacao/oportunidades?message=Oportunidade não encontrada')
  }

  const textoBase = limitarTexto(`
Título: ${limparTexto(oportunidade.titulo)}
Órgão: ${limparTexto(oportunidade.orgao)}
Área: ${limparTexto(oportunidade.area)}
Resumo: ${limparTexto(oportunidade.resumo)}
Resumo IA: ${limparTexto(oportunidade.resumo_ia)}
Requisitos IA: ${limparTexto(oportunidade.requisitos_ia)}
Documentos IA: ${limparTexto(oportunidade.documentos_ia)}
Público IA: ${limparTexto(oportunidade.publico_ia)}
Valor IA: ${limparTexto(oportunidade.valor_ia)}
Prazo IA: ${limparTexto(oportunidade.prazo_ia)}
Recomendação IA: ${limparTexto(oportunidade.recomendacao_ia)}
`)

  const prompt = `
Você é diretor de projetos de uma Secretaria Municipal de Cultura e Turismo.

Com base na oportunidade abaixo, gere uma proposta de projeto municipal em JSON válido.

Formato:
{
  "nome": "",
  "area": "cultura | turismo | integrado",
  "tipo": "",
  "descricao": "",
  "justificativa": "",
  "publico_beneficiado": "",
  "local_execucao": "",
  "valor_estimado": 0,
  "prioridade": "baixa | media | alta | urgente",
  "status": "ideia",
  "responsavel": "Diretoria de Projetos",
  "observacoes": "",
  "secretaria_responsavel": "Secretaria Municipal de Cultura e Turismo"
}

Não invente valor. Se não houver valor claro, use 0.

Oportunidade:
${textoBase}
`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      {
        role: 'system',
        content: 'Você cria propostas técnicas para projetos municipais. Responda apenas JSON válido.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
  })

  const resposta = completion.choices[0]?.message?.content || '{}'

  let json: any = {}

  try {
    json = JSON.parse(resposta)
  } catch {
    await salvarHistoricoIA({
      oportunidadeId: id,
      tipo: 'geracao_projeto_erro_json',
      prompt,
      resposta,
    })

    redirect('/projetos-captacao/oportunidades?message=IA respondeu em formato inválido ao gerar projeto')
  }

  const { data: projeto, error: insertError } = await supabase
    .from('captacao_projetos')
    .insert({
      nome: json.nome || `Projeto gerado para ${oportunidade.titulo}`,
      area: json.area || 'integrado',
      tipo: json.tipo || null,
      descricao: json.descricao || null,
      justificativa: json.justificativa || null,
      publico_beneficiado: json.publico_beneficiado || null,
      local_execucao: json.local_execucao || null,
      valor_estimado: Number(json.valor_estimado || 0) || null,
      prioridade: json.prioridade || 'media',
      status: 'ideia',
      responsavel: json.responsavel || 'Diretoria de Projetos',
      observacoes: json.observacoes || null,
      gerado_por_ia: true,
      oportunidade_origem_id: id,
      secretaria_responsavel:
        json.secretaria_responsavel || 'Secretaria Municipal de Cultura e Turismo',
    })
    .select('id')
    .single()

  await salvarHistoricoIA({
    oportunidadeId: id,
    projetoId: projeto?.id || null,
    tipo: 'geracao_projeto',
    prompt,
    resposta,
  })

  if (insertError) {
    redirect(`/projetos-captacao/oportunidades?message=${encodeURIComponent(insertError.message)}`)
  }

  redirect('/projetos-captacao/projetos?message=Projeto gerado automaticamente com IA')
}
