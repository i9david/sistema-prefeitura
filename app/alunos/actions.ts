'use server'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import { exigirPermissaoAction } from '@/lib/seguranca-actions'

function normalizarTelefone(valor: string) {
  return valor.replace(/\D/g, '').slice(0, 11)
}

export async function criarAluno(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    'Centro Cultural',
    'Alunos',
    'criar'
  )

  const nome = String(formData.get('nome') ?? '').trim()
  const telefone = normalizarTelefone(String(formData.get('telefone') ?? ''))
  const dataNascimento = String(formData.get('data_nascimento') ?? '').trim()
  const aulaId = String(formData.get('aula_id') ?? '').trim()
  const status = String(formData.get('status') ?? 'ativo').trim()

  if (!nome || !aulaId || !status) {
    redirect('/alunos?novo=1&message=Preencha os campos obrigatórios')
  }

  const { error } = await supabase.from('alunos').insert({
    nome,
    telefone: telefone || null,
    data_nascimento: dataNascimento || null,
    aula_id: aulaId,
    status,
  })

  if (error) {
    redirect(`/alunos?novo=1&message=${encodeURIComponent(error.message)}`)
  }

  redirect('/alunos?message=Aluno cadastrado com sucesso')
}

export async function atualizarAluno(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    'Centro Cultural',
    'Alunos',
    'editar'
  )

  const id = String(formData.get('id') ?? '').trim()
  const nome = String(formData.get('nome') ?? '').trim()
  const telefone = normalizarTelefone(String(formData.get('telefone') ?? ''))
  const dataNascimento = String(formData.get('data_nascimento') ?? '').trim()
  const aulaId = String(formData.get('aula_id') ?? '').trim()
  const status = String(formData.get('status') ?? 'ativo').trim()

  if (!id || !nome || !aulaId || !status) {
    redirect('/alunos?message=Preencha os campos obrigatórios')
  }

  const { error } = await supabase
    .from('alunos')
    .update({
      nome,
      telefone: telefone || null,
      data_nascimento: dataNascimento || null,
      aula_id: aulaId,
      status,
    })
    .eq('id', id)

  if (error) {
    redirect(`/alunos?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/alunos?message=Aluno atualizado com sucesso')
}

export async function inativarAluno(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    'Centro Cultural',
    'Alunos',
    'excluir'
  )

  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/alunos?message=Aluno não encontrado')
  }

  const { error } = await supabase
    .from('alunos')
    .update({ status: 'inativo' })
    .eq('id', id)

  if (error) {
    redirect(`/alunos?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/alunos?message=Aluno inativado com sucesso')
}

export async function ativarAluno(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    'Centro Cultural',
    'Alunos',
    'editar'
  )

  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/alunos?message=Aluno não encontrado')
  }

  const { error } = await supabase
    .from('alunos')
    .update({ status: 'ativo' })
    .eq('id', id)

  if (error) {
    redirect(`/alunos?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/alunos?message=Aluno ativado com sucesso')
}