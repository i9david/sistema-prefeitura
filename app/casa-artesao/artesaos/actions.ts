'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, '').slice(0, 11)
}

function nomeCompletoValido(nome: string) {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  return partes.length >= 2
}

export async function criarArtesao(formData: FormData) {
  const supabase = await createClient()

  const nome = String(formData.get('nome') ?? '').trim()
  const telefone = somenteNumeros(String(formData.get('telefone') ?? '').trim())
  const chavePix = String(formData.get('chave_pix') ?? '').trim()
  const tipoChavePix = String(formData.get('tipo_chave_pix') ?? '').trim()
  const observacoes = String(formData.get('observacoes') ?? '').trim()

  if (!nomeCompletoValido(nome)) {
    redirect('/casa-artesao/artesaos?message=Informe nome e sobrenome do artesão')
  }

  if (telefone && telefone.length !== 11) {
    redirect('/casa-artesao/artesaos?message=Informe um telefone com DDD e 11 dígitos')
  }

  const { error } = await supabase.from('casa_artesao_artesaos').insert({
    nome,
    telefone: telefone || null,
    chave_pix: chavePix || null,
    tipo_chave_pix: tipoChavePix || null,
    observacoes: observacoes || null,
    status: 'ativo',
  })

  if (error) {
    redirect(`/casa-artesao/artesaos?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/casa-artesao/artesaos?message=Artesão cadastrado com sucesso')
}

export async function atualizarArtesao(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') ?? '').trim()
  const nome = String(formData.get('nome') ?? '').trim()
  const telefone = somenteNumeros(String(formData.get('telefone') ?? '').trim())
  const chavePix = String(formData.get('chave_pix') ?? '').trim()
  const tipoChavePix = String(formData.get('tipo_chave_pix') ?? '').trim()
  const observacoes = String(formData.get('observacoes') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim()

  if (!id) {
    redirect('/casa-artesao/artesaos?message=Artesão não encontrado')
  }

  if (!nomeCompletoValido(nome)) {
    redirect('/casa-artesao/artesaos?message=Informe nome e sobrenome do artesão')
  }

  if (telefone && telefone.length !== 11) {
    redirect('/casa-artesao/artesaos?message=Informe um telefone com DDD e 11 dígitos')
  }

  const { error } = await supabase
    .from('casa_artesao_artesaos')
    .update({
      nome,
      telefone: telefone || null,
      chave_pix: chavePix || null,
      tipo_chave_pix: tipoChavePix || null,
      observacoes: observacoes || null,
      status: status || 'ativo',
    })
    .eq('id', id)

  if (error) {
    redirect(`/casa-artesao/artesaos?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/casa-artesao/artesaos?message=Artesão atualizado com sucesso')
}

export async function ativarArtesao(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/casa-artesao/artesaos?message=Artesão não encontrado')
  }

  const { error } = await supabase
    .from('casa_artesao_artesaos')
    .update({ status: 'ativo' })
    .eq('id', id)

  if (error) {
    redirect(`/casa-artesao/artesaos?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/casa-artesao/artesaos?message=Artesão ativado com sucesso')
}

export async function inativarArtesao(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/casa-artesao/artesaos?message=Artesão não encontrado')
  }

  const { error } = await supabase
    .from('casa_artesao_artesaos')
    .update({ status: 'inativo' })
    .eq('id', id)

  if (error) {
    redirect(`/casa-artesao/artesaos?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/casa-artesao/artesaos?message=Artesão inativado com sucesso')
}