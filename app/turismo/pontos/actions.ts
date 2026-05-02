'use server'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function criarPontoTuristico(formData: FormData) {
  const supabase = await createClient()

  const nome = String(formData.get('nome') || '')
  const tipo = String(formData.get('tipo') || '')
  const descricao = String(formData.get('descricao') || '')
  const endereco = String(formData.get('endereco') || '')
  const localizacao_google = String(formData.get('localizacao_google') || '')
  const contato_responsavel = String(formData.get('contato_responsavel') || '')
  const telefone_responsavel = String(formData.get('telefone_responsavel') || '')
  const observacoes = String(formData.get('observacoes') || '')

  if (!nome) {
    redirect('/turismo/pontos?novo=1&message=Informe o nome')
  }

  const { error } = await supabase.from('turismo_pontos').insert({
    nome,
    tipo,
    descricao,
    endereco,
    localizacao_google,
    contato_responsavel,
    telefone_responsavel,
    observacoes,
    status: 'ativo',
  })

  if (error) {
    redirect(`/turismo/pontos?novo=1&message=${error.message}`)
  }

  redirect('/turismo/pontos?message=Cadastrado com sucesso')
}

export async function inativarPonto(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id'))

  await supabase.from('turismo_pontos').update({
    status: 'inativo',
  }).eq('id', id)

  redirect('/turismo/pontos')
}

export async function ativarPonto(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id'))

  await supabase.from('turismo_pontos').update({
    status: 'ativo',
  }).eq('id', id)

  redirect('/turismo/pontos')
}