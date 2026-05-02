'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function limparNomeArquivo(nome: string) {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.-]/g, '_')
}

async function fazerUploadLogo(arquivo: File | null) {
  if (!arquivo || arquivo.size === 0) return null

  const supabaseAdmin = createAdminClient()

  const nomeOriginal = limparNomeArquivo(arquivo.name || 'logo')
  const extensao = nomeOriginal.includes('.') ? nomeOriginal.split('.').pop() : 'png'
  const nomeFinal = `logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${extensao}`

  const arrayBuffer = await arquivo.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error } = await supabaseAdmin.storage
    .from('sistema-arquivos')
    .upload(nomeFinal, buffer, {
      contentType: arquivo.type || 'image/png',
      upsert: true,
    })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabaseAdmin.storage
    .from('sistema-arquivos')
    .getPublicUrl(nomeFinal)

  return data.publicUrl
}

export async function salvarConfiguracaoSistema(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const supabaseAdmin = createAdminClient()

  const nomeSistema = String(formData.get('nome_sistema') ?? '').trim()
  const logo = formData.get('logo_prefeitura') as File | null

  if (!nomeSistema) {
    redirect('/administrativo/configuracoes?message=Informe o nome do sistema')
  }

  const { error: nomeError } = await supabaseAdmin
    .from('administrativo_configuracoes')
    .upsert(
      {
        chave: 'nome_sistema',
        valor: nomeSistema,
        descricao: 'Nome exibido globalmente no sistema',
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'chave',
      }
    )

  if (nomeError) {
    redirect(`/administrativo/configuracoes?message=${encodeURIComponent(nomeError.message)}`)
  }

  if (logo && logo.size > 0) {
    let logoUrl: string | null = null

    try {
      logoUrl = await fazerUploadLogo(logo)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao enviar logomarca'
      redirect(`/administrativo/configuracoes?message=${encodeURIComponent(msg)}`)
    }

    const { error: logoError } = await supabaseAdmin
      .from('administrativo_configuracoes')
      .upsert(
        {
          chave: 'logo_prefeitura',
          valor: logoUrl,
          descricao: 'Logomarca da Prefeitura exibida no sistema',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'chave',
        }
      )

    if (logoError) {
      redirect(`/administrativo/configuracoes?message=${encodeURIComponent(logoError.message)}`)
    }
  }

  redirect('/administrativo/configuracoes?message=Configuração salva com sucesso')
}