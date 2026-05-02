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

export async function criarMusico(formData: FormData) {
  const supabase = await createClient()

  const nome = String(formData.get('nome') ?? '').trim()
  const telefone = somenteNumeros(String(formData.get('telefone') ?? '').trim())
  const dataNascimento = String(formData.get('data_nascimento') ?? '').trim()
  const instrumentoPrincipal = String(formData.get('instrumento_principal') ?? '').trim()
  const instrumentoSecundario = String(formData.get('instrumento_secundario') ?? '').trim()
  const funcao = String(formData.get('funcao') ?? '').trim()
  const bolsaValorRaw = String(formData.get('bolsa_valor') ?? '').trim().replace(',', '.')
  const observacoes = String(formData.get('observacoes') ?? '').trim()

  if (!nomeCompletoValido(nome)) {
    redirect('/banda-municipal/musicos?message=Informe nome e sobrenome do músico')
  }

  if (telefone && telefone.length !== 11) {
    redirect('/banda-municipal/musicos?message=Informe um telefone com DDD e 11 dígitos')
  }

  if (!instrumentoPrincipal) {
    redirect('/banda-municipal/musicos?message=Informe o instrumento principal')
  }

  const bolsaValor = bolsaValorRaw ? Number(bolsaValorRaw) : null

  if (bolsaValorRaw && Number.isNaN(bolsaValor)) {
    redirect('/banda-municipal/musicos?message=Valor de bolsa inválido')
  }

  const { error } = await supabase.from('banda_municipal_musicos').insert({
    nome,
    telefone: telefone || null,
    data_nascimento: dataNascimento || null,
    instrumento_principal: instrumentoPrincipal,
    instrumento_secundario: instrumentoSecundario || null,
    funcao: funcao || null,
    bolsa_valor: bolsaValor,
    status: 'ativo',
    observacoes: observacoes || null,
  })

  if (error) {
    redirect(`/banda-municipal/musicos?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/banda-municipal/musicos?message=Músico cadastrado com sucesso')
}

export async function atualizarMusico(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') ?? '').trim()
  const nome = String(formData.get('nome') ?? '').trim()
  const telefone = somenteNumeros(String(formData.get('telefone') ?? '').trim())
  const dataNascimento = String(formData.get('data_nascimento') ?? '').trim()
  const instrumentoPrincipal = String(formData.get('instrumento_principal') ?? '').trim()
  const instrumentoSecundario = String(formData.get('instrumento_secundario') ?? '').trim()
  const funcao = String(formData.get('funcao') ?? '').trim()
  const bolsaValorRaw = String(formData.get('bolsa_valor') ?? '').trim().replace(',', '.')
  const status = String(formData.get('status') ?? '').trim()
  const observacoes = String(formData.get('observacoes') ?? '').trim()

  if (!id) {
    redirect('/banda-municipal/musicos?message=Músico não encontrado')
  }

  if (!nomeCompletoValido(nome)) {
    redirect('/banda-municipal/musicos?message=Informe nome e sobrenome do músico')
  }

  if (telefone && telefone.length !== 11) {
    redirect('/banda-municipal/musicos?message=Informe um telefone com DDD e 11 dígitos')
  }

  if (!instrumentoPrincipal) {
    redirect('/banda-municipal/musicos?message=Informe o instrumento principal')
  }

  const bolsaValor = bolsaValorRaw ? Number(bolsaValorRaw) : null

  if (bolsaValorRaw && Number.isNaN(bolsaValor)) {
    redirect('/banda-municipal/musicos?message=Valor de bolsa inválido')
  }

  const { error } = await supabase
    .from('banda_municipal_musicos')
    .update({
      nome,
      telefone: telefone || null,
      data_nascimento: dataNascimento || null,
      instrumento_principal: instrumentoPrincipal,
      instrumento_secundario: instrumentoSecundario || null,
      funcao: funcao || null,
      bolsa_valor: bolsaValor,
      status: status || 'ativo',
      observacoes: observacoes || null,
    })
    .eq('id', id)

  if (error) {
    redirect(`/banda-municipal/musicos?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/banda-municipal/musicos?message=Músico atualizado com sucesso')
}

export async function ativarMusico(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/banda-municipal/musicos?message=Músico não encontrado')
  }

  const { error } = await supabase
    .from('banda_municipal_musicos')
    .update({ status: 'ativo' })
    .eq('id', id)

  if (error) {
    redirect(`/banda-municipal/musicos?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/banda-municipal/musicos?message=Músico ativado com sucesso')
}

export async function inativarMusico(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/banda-municipal/musicos?message=Músico não encontrado')
  }

  const { error } = await supabase
    .from('banda_municipal_musicos')
    .update({ status: 'inativo' })
    .eq('id', id)

  if (error) {
    redirect(`/banda-municipal/musicos?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/banda-municipal/musicos?message=Músico inativado com sucesso')
}