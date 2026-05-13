import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'

type FonteRadar = {
  id: string
  nome: string
  orgao: string | null
  esfera: string | null
  area: string | null
  url_monitoramento: string
  status: string | null
}

function limparHtml(texto: string) {
  return texto
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function criarHash(valor: string) {
  return crypto.createHash('sha256').update(valor).digest('hex')
}

function pareceOportunidade(texto: string) {
  const t = texto.toLowerCase()

  return (
    t.includes('edital') ||
    t.includes('chamamento') ||
    t.includes('chamada p?blica') ||
    t.includes('chamada publica') ||
    t.includes('inscrição') ||
    t.includes('inscrições') ||
    t.includes('seleção') ||
    t.includes('selecao') ||
    t.includes('fomento') ||
    t.includes('programa') ||
    t.includes('pnab') ||
    t.includes('rouanet') ||
    t.includes('conv?nio') ||
    t.includes('convenio') ||
    t.includes('transfer?ncia') ||
    t.includes('transferencia') ||
    t.includes('captação') ||
    t.includes('captacao')
  )
}

function elegivelParaPrefeitura(texto: string) {
  const t = texto.toLowerCase()

  return (
    t.includes('munic?pio') ||
    t.includes('municipio') ||
    t.includes('prefeitura') ||
    t.includes('ente p?blico') ||
    t.includes('ente publico') ||
    t.includes('administração pública') ||
    t.includes('administracao publica') ||
    t.includes('?rg?o p?blico') ||
    t.includes('orgao publico') ||
    t.includes('entes federativos') ||
    t.includes('governo municipal') ||
    t.includes('secretaria municipal') ||
    t.includes('fundação pública') ||
    t.includes('fundacao publica') ||
    t.includes('cons?rcio p?blico') ||
    t.includes('consorcio publico')
  )
}

function deveIgnorar(texto: string) {
  const t = texto.toLowerCase()

  return (
    t.includes('resultado final') ||
    t.includes('resultado preliminar') ||
    t.includes('homologação') ||
    t.includes('homologacao') ||
    t.includes('retificação') ||
    t.includes('retificacao') ||
    t.includes('not?cia') ||
    t.includes('noticia') ||
    t.includes('agenda') ||
    t.includes('evento realizado') ||
    t.includes('prestação de contas') ||
    t.includes('prestacao de contas')
  )
}

function extrairPossivelPrazo(texto: string) {
  const padroes = [
    /(\d{2})\/(\d{2})\/(\d{4})/g,
    /(\d{4})-(\d{2})-(\d{2})/g,
  ]

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  for (const padrao of padroes) {
    let match

    while ((match = padrao.exec(texto)) !== null) {
      let data: Date | null = null

      if (match[0].includes('/')) {
        const dia = Number(match[1])
        const mes = Number(match[2])
        const ano = Number(match[3])
        data = new Date(ano, mes - 1, dia)
      } else {
        const ano = Number(match[1])
        const mes = Number(match[2])
        const dia = Number(match[3])
        data = new Date(ano, mes - 1, dia)
      }

      if (data && data >= hoje) {
        const ano = data.getFullYear()
        const mes = String(data.getMonth() + 1).padStart(2, '0')
        const dia = String(data.getDate()).padStart(2, '0')
        return `${ano}-${mes}-${dia}`
      }
    }
  }

  return null
}

function extrairLinks(html: string, baseUrl: string, fonte: FonteRadar) {
  const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  const resultados: {
    titulo: string
    link: string
    resumo: string
    prazo: string | null
  }[] = []

  let match

  while ((match = regex.exec(html)) !== null) {
    const href = match[1]
    const texto = limparHtml(match[2])

    if (!texto || texto.length < 10) continue
    if (deveIgnorar(texto)) continue
    if (!pareceOportunidade(texto)) continue

    const contexto = `${texto} ${fonte.nome} ${fonte.orgao || ''} ${fonte.area || ''}`

    if (!elegivelParaPrefeitura(contexto)) continue

    let linkFinal = href

    try {
      linkFinal = new URL(href, baseUrl).toString()
    } catch {
      linkFinal = href
    }

    const prazo = extrairPossivelPrazo(texto)

    resultados.push({
      titulo: texto.slice(0, 240),
      link: linkFinal,
      resumo:
        'Oportunidade identificada automaticamente com possível compatibilidade para prefeitura. Revise o edital, prazo e documentação antes de aprovar.',
      prazo,
    })
  }

  return resultados
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', baseUrl))
  }

  const { data: fontesData, error: fontesError } = await supabase
    .from('captacao_radar_fontes')
    .select('id, nome, orgao, esfera, area, url_monitoramento, status')
    .eq('status', 'ativa')

  if (fontesError) {
    return NextResponse.redirect(
      new URL(
        `/projetos-captacao/radar?message=${encodeURIComponent(fontesError.message)}`,
        baseUrl
      )
    )
  }

  const fontes = (fontesData ?? []) as FonteRadar[]

  let totalCapturadas = 0
  let totalNovas = 0
  let totalErros = 0
  let totalIgnoradas = 0

  for (const fonte of fontes) {
    try {
      const resposta = await fetch(fonte.url_monitoramento, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 Radar Secretaria Cultura Turismo',
        },
        cache: 'no-store',
      })

      if (!resposta.ok) {
        totalErros++
        continue
      }

      const html = await resposta.text()
      const oportunidades = extrairLinks(html, fonte.url_monitoramento, fonte)

      totalCapturadas += oportunidades.length

      for (const oportunidade of oportunidades) {
        const hash = criarHash(
          `${fonte.id}-${oportunidade.titulo}-${oportunidade.link}`
        )

        const { error } = await supabase
          .from('captacao_radar_capturas')
          .insert({
            fonte_id: fonte.id,
            titulo: oportunidade.titulo,
            orgao: fonte.orgao,
            esfera: fonte.esfera,
            area: fonte.area,
            link_oficial: oportunidade.link,
            resumo: oportunidade.resumo,
            prazo_inscricao: oportunidade.prazo,
            status: 'aguardando_revisao',
            hash_unico: hash,
          })

        if (!error) {
          totalNovas++
        } else {
          totalIgnoradas++
        }
      }

      await supabase
        .from('captacao_radar_fontes')
        .update({
          ultima_verificacao: new Date().toISOString(),
        })
        .eq('id', fonte.id)
    } catch {
      totalErros++
    }
  }

  const mensagem = `Radar atualizado. Fontes verificadas: ${fontes.length}. Oportunidades compat?veis encontradas: ${totalCapturadas}. Novas capturas: ${totalNovas}. J? existentes ou ignoradas: ${totalIgnoradas}. Erros: ${totalErros}.`

  return NextResponse.redirect(
    new URL(
      `/projetos-captacao/radar?message=${encodeURIComponent(mensagem)}`,
      baseUrl
    )
  )
}
