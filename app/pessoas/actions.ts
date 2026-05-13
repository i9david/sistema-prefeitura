'use server'

import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from "@/components/sidebar"

function limparTelefone(telefone: string) {
  return telefone.replace(/\D/g, '')
}

export async function atualizarPessoaCRM(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim()
  const nome = String(formData.get('nome') ?? '').trim()
  const telefoneOriginal = String(formData.get('telefone') ?? '').trim()
  const telefone = limparTelefone(telefoneOriginal)
  const dataNascimento = String(formData.get('data_nascimento') ?? '').trim()

  if (!id || !nome || !telefone || !dataNascimento) {
    redirect(`/pessoas/${id}?message=Preencha todos os campos obrigatórios`)
  }

  const supabase = await createClient()

  const { data: pessoaAtual, error: erroPessoaAtual } = await supabase
    .from('pessoas')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (erroPessoaAtual || !pessoaAtual) {
    redirect(`/pessoas?message=Pessoa não encontrada`)
  }

  const { data: pessoaDuplicada, error: erroDuplicada } = await supabase
    .from('pessoas')
    .select('id')
    .ilike('nome', nome)
    .eq('telefone', telefone)
    .eq('data_nascimento', dataNascimento)
    .neq('id', id)
    .maybeSingle()

  if (erroDuplicada) {
    redirect(`/pessoas/${id}?message=${encodeURIComponent(erroDuplicada.message)}`)
  }

  if (pessoaDuplicada) {
    redirect(`/pessoas/${id}?message=Já existe outra pessoa com esses mesmos dados`)
  }

  const { error: erroPessoa } = await supabase
    .from('pessoas')
    .update({
      nome,
      telefone,
      data_nascimento: dataNascimento,
    })
    .eq('id', id)

  if (erroPessoa) {
    redirect(`/pessoas/${id}?message=${encodeURIComponent(erroPessoa.message)}`)
  }

  const atualizacoes = await Promise.all([
    supabase
      .from('alunos')
      .update({
        nome,
        telefone,
        data_nascimento: dataNascimento,
      })
      .eq('pessoa_id', id),

    supabase
      .from('visitantes')
      .update({
        nome,
        telefone,
        data_nascimento: dataNascimento,
      })
      .eq('pessoa_id', id),

    supabase
      .from('biblioteca_leitores')
      .update({
        nome,
        telefone,
        data_nascimento: dataNascimento,
      })
      .eq('pessoa_id', id),
  ])

  const erroModulos = atualizacoes.find((resultado) => resultado.error)

  if (erroModulos?.error) {
    redirect(`/pessoas/${id}?message=${encodeURIComponent(erroModulos.error.message)}`)
  }

  redirect(`/pessoas/${id}?message=Pessoa atualizada com sucesso no CRM e nos módulos`)
}
