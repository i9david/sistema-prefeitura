'use server'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"
import { createClient } from '@/lib/supabase/server'

export async function criarProjetoCaptacao(formData: FormData) {
  const supabase = await createClient()

  const nome = String(formData.get('nome') || '').trim()
  const area = String(formData.get('area') || 'cultura').trim()
  const tipo = String(formData.get('tipo') || '').trim()
  const descricao = String(formData.get('descricao') || '').trim()
  const justificativa = String(formData.get('justificativa') || '').trim()
  const publicoBeneficiado = String(formData.get('publico_beneficiado') || '').trim()
  const localExecucao = String(formData.get('local_execucao') || '').trim()
  const valorEstimado = String(formData.get('valor_estimado') || '').replace(',', '.').trim()
  const prioridade = String(formData.get('prioridade') || 'media').trim()
  const status = String(formData.get('status') || 'ideia').trim()
  const responsavel = String(formData.get('responsavel') || '').trim()
  const prazoDesejado = String(formData.get('prazo_desejado') || '').trim()
  const observacoes = String(formData.get('observacoes') || '').trim()

  if (!nome) {
    redirect('/projetos-captacao/projetos?novo=1&message=Informe o nome do projeto')
  }

  const { error } = await supabase.from('captacao_projetos').insert({
    nome,
    area,
    tipo: tipo || null,
    descricao: descricao || null,
    justificativa: justificativa || null,
    publico_beneficiado: publicoBeneficiado || null,
    local_execucao: localExecucao || null,
    valor_estimado: valorEstimado ? Number(valorEstimado) : null,
    prioridade,
    status,
    responsavel: responsavel || null,
    prazo_desejado: prazoDesejado || null,
    observacoes: observacoes || null,
  })

  if (error) {
    redirect(`/projetos-captacao/projetos?novo=1&message=${encodeURIComponent(error.message)}`)
  }

  redirect('/projetos-captacao/projetos?message=Projeto cadastrado com sucesso')
}

export async function atualizarProjetoCaptacao(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') || '').trim()
  const nome = String(formData.get('nome') || '').trim()
  const area = String(formData.get('area') || 'cultura').trim()
  const tipo = String(formData.get('tipo') || '').trim()
  const descricao = String(formData.get('descricao') || '').trim()
  const justificativa = String(formData.get('justificativa') || '').trim()
  const publicoBeneficiado = String(formData.get('publico_beneficiado') || '').trim()
  const localExecucao = String(formData.get('local_execucao') || '').trim()
  const valorEstimado = String(formData.get('valor_estimado') || '').replace(',', '.').trim()
  const prioridade = String(formData.get('prioridade') || 'media').trim()
  const status = String(formData.get('status') || 'ideia').trim()
  const responsavel = String(formData.get('responsavel') || '').trim()
  const prazoDesejado = String(formData.get('prazo_desejado') || '').trim()
  const observacoes = String(formData.get('observacoes') || '').trim()

  if (!id) {
    redirect('/projetos-captacao/projetos?message=Projeto não encontrado')
  }

  if (!nome) {
    redirect(`/projetos-captacao/projetos?editar=${id}&message=Informe o nome do projeto`)
  }

  const { error } = await supabase
    .from('captacao_projetos')
    .update({
      nome,
      area,
      tipo: tipo || null,
      descricao: descricao || null,
      justificativa: justificativa || null,
      publico_beneficiado: publicoBeneficiado || null,
      local_execucao: localExecucao || null,
      valor_estimado: valorEstimado ? Number(valorEstimado) : null,
      prioridade,
      status,
      responsavel: responsavel || null,
      prazo_desejado: prazoDesejado || null,
      observacoes: observacoes || null,
    })
    .eq('id', id)

  if (error) {
    redirect(`/projetos-captacao/projetos?editar=${id}&message=${encodeURIComponent(error.message)}`)
  }

  redirect('/projetos-captacao/projetos?message=Projeto atualizado com sucesso')
}

export async function mudarStatusProjetoCaptacao(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') || '').trim()
  const status = String(formData.get('status') || '').trim()

  if (!id || !status) {
    redirect('/projetos-captacao/projetos?message=Dados inválidos')
  }

  const { error } = await supabase
    .from('captacao_projetos')
    .update({ status })
    .eq('id', id)

  if (error) {
    redirect(`/projetos-captacao/projetos?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/projetos-captacao/projetos?message=Status atualizado com sucesso')
}