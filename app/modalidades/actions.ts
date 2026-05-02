'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'

export async function criarModalidade(formData: FormData) {
  const nome = String(formData.get('nome') ?? '').trim()
  const descricao = String(formData.get('descricao') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim()

  if (!nome || !status) {
    redirect('/modalidades?message=Preencha todos os campos obrigatórios')
  }

  const supabase = await createClient()

  const { error } = await supabase.from('modalidades').insert({
    nome,
    descricao: descricao || null,
    status,
  })

  if (error) {
    redirect(`/modalidades?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/modalidades?message=Modalidade cadastrada com sucesso')
}

export async function atualizarModalidade(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim()
  const nome = String(formData.get('nome') ?? '').trim()
  const descricao = String(formData.get('descricao') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim()

  if (!id || !nome || !status) {
    redirect('/modalidades?message=Preencha todos os campos obrigatórios')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('modalidades')
    .update({
      nome,
      descricao: descricao || null,
      status,
    })
    .eq('id', id)

  if (error) {
    redirect(`/modalidades?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/modalidades?message=Modalidade atualizada com sucesso')
}

export async function inativarModalidade(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/modalidades?message=Modalidade não encontrada')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('modalidades')
    .update({ status: 'inativa' })
    .eq('id', id)

  if (error) {
    redirect(`/modalidades?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/modalidades?message=Modalidade inativada com sucesso')
}

export async function ativarModalidade(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/modalidades?message=Modalidade não encontrada')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('modalidades')
    .update({ status: 'ativa' })
    .eq('id', id)

  if (error) {
    redirect(`/modalidades?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/modalidades?message=Modalidade ativada com sucesso')
}