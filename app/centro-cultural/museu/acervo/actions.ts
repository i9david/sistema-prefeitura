'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'

function gerarNumeroTombo() {
  const agora = new Date()
  const ano = agora.getFullYear()
  const timestamp = String(agora.getTime()).slice(-6)
  return `MUS-${ano}-${timestamp}`
}

function limparNomeArquivo(nome: string) {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.-]/g, '_')
}

async function fazerUploadFoto(
  supabase: Awaited<ReturnType<typeof createClient>>,
  arquivo: File | null,
  pasta: string
) {
  if (!arquivo || arquivo.size === 0) return null

  const nomeOriginal = limparNomeArquivo(arquivo.name || 'foto')
  const extensao = nomeOriginal.includes('.') ? nomeOriginal.split('.').pop() : 'jpg'
  const nomeFinal = `${pasta}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extensao}`

  const arrayBuffer = await arquivo.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error } = await supabase.storage
    .from('museu-acervo')
    .upload(nomeFinal, buffer, {
      contentType: arquivo.type || 'image/jpeg',
      upsert: true,
    })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from('museu-acervo').getPublicUrl(nomeFinal)

  return data.publicUrl
}

export async function criarPecaAcervo(formData: FormData) {
  const supabase = await createClient()

  const nome = String(formData.get('nome') ?? '').trim()
  const descricao = String(formData.get('descricao') ?? '').trim()
  const categoriaId = String(formData.get('categoria_id') ?? '').trim()
  const numeroTombo = String(formData.get('numero_tombo') ?? '').trim()
  const origem = String(formData.get('origem') ?? '').trim()
  const dataAquisicao = String(formData.get('data_aquisicao') ?? '').trim()
  const estadoConservacao = String(formData.get('estado_conservacao') ?? '').trim()
  const localizacao = String(formData.get('localizacao') ?? '').trim()
  const status = String(formData.get('status') ?? 'ativo').trim()
  const foto = formData.get('foto') as File | null

  if (!nome) {
    redirect('/centro-cultural/museu/acervo?message=Informe o nome da peça')
  }

  if (!categoriaId) {
    redirect('/centro-cultural/museu/acervo?message=Selecione a categoria da peça')
  }

  const tomboFinal = numeroTombo || gerarNumeroTombo()

  let fotoUrl: string | null = null

  try {
    fotoUrl = await fazerUploadFoto(supabase, foto, 'pecas')
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao enviar foto'
    redirect(`/centro-cultural/museu/acervo?message=${encodeURIComponent(msg)}`)
  }

  const { error } = await supabase.from('museu_acervo').insert({
    nome,
    descricao: descricao || null,
    categoria_id: categoriaId,
    numero_tombo: tomboFinal,
    origem: origem || null,
    data_aquisicao: dataAquisicao || null,
    estado_conservacao: estadoConservacao || null,
    localizacao: localizacao || null,
    localizacao_atual: localizacao || null,
    status: status || 'ativo',
    foto_url: fotoUrl,
  })

  if (error) {
    redirect(`/centro-cultural/museu/acervo?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/centro-cultural/museu/acervo?message=Peça cadastrada com sucesso')
}

export async function atualizarPecaAcervo(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') ?? '').trim()
  const nome = String(formData.get('nome') ?? '').trim()
  const descricao = String(formData.get('descricao') ?? '').trim()
  const categoriaId = String(formData.get('categoria_id') ?? '').trim()
  const numeroTombo = String(formData.get('numero_tombo') ?? '').trim()
  const origem = String(formData.get('origem') ?? '').trim()
  const dataAquisicao = String(formData.get('data_aquisicao') ?? '').trim()
  const estadoConservacao = String(formData.get('estado_conservacao') ?? '').trim()
  const localizacao = String(formData.get('localizacao') ?? '').trim()
  const status = String(formData.get('status') ?? 'ativo').trim()
  const foto = formData.get('foto') as File | null

  if (!id) {
    redirect('/centro-cultural/museu/acervo?message=Peça não encontrada')
  }

  if (!nome) {
    redirect('/centro-cultural/museu/acervo?message=Informe o nome da peça')
  }

  if (!categoriaId) {
    redirect('/centro-cultural/museu/acervo?message=Selecione a categoria da peça')
  }

  const updateData: Record<string, string | null> = {
    nome,
    descricao: descricao || null,
    categoria_id: categoriaId,
    numero_tombo: numeroTombo || null,
    origem: origem || null,
    data_aquisicao: dataAquisicao || null,
    estado_conservacao: estadoConservacao || null,
    localizacao: localizacao || null,
    status: status || 'ativo',
  }

  if (foto && foto.size > 0) {
    try {
      const fotoUrl = await fazerUploadFoto(supabase, foto, 'pecas')
      updateData.foto_url = fotoUrl
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao enviar foto'
      redirect(`/centro-cultural/museu/acervo?message=${encodeURIComponent(msg)}`)
    }
  }

  const { error } = await supabase
    .from('museu_acervo')
    .update(updateData)
    .eq('id', id)

  if (error) {
    redirect(`/centro-cultural/museu/acervo?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/centro-cultural/museu/acervo?message=Peça atualizada com sucesso')
}

export async function ativarPecaAcervo(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/centro-cultural/museu/acervo?message=Peça não encontrada')
  }

  const { error } = await supabase
    .from('museu_acervo')
    .update({ status: 'ativo' })
    .eq('id', id)

  if (error) {
    redirect(`/centro-cultural/museu/acervo?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/centro-cultural/museu/acervo?message=Peça ativada com sucesso')
}

export async function inativarPecaAcervo(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/centro-cultural/museu/acervo?message=Peça não encontrada')
  }

  const { error } = await supabase
    .from('museu_acervo')
    .update({ status: 'inativo' })
    .eq('id', id)

  if (error) {
    redirect(`/centro-cultural/museu/acervo?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/centro-cultural/museu/acervo?message=Peça inativada com sucesso')
}