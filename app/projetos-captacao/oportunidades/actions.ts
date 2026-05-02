'use server'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"
import { createClient } from '@/lib/supabase/server'

export async function criarOportunidadeCaptacao(formData: FormData) {
  const supabase = await createClient()

  const titulo = String(formData.get('titulo') || '').trim()
  const orgao = String(formData.get('orgao') || '').trim()
  const esfera = String(formData.get('esfera') || '').trim()
  const area = String(formData.get('area') || '').trim()
  const tipo = String(formData.get('tipo') || '').trim()
  const valorDisponivel = String(formData.get('valor_disponivel') || '').replace(',', '.').trim()
  const prazoInscricao = String(formData.get('prazo_inscricao') || '').trim()
  const linkOficial = String(formData.get('link_oficial') || '').trim()
  const resumo = String(formData.get('resumo') || '').trim()
  const documentosExigidos = String(formData.get('documentos_exigidos') || '').trim()
  const quemPodeParticipar = String(formData.get('quem_pode_participar') || '').trim()
  const status = String(formData.get('status') || 'aberta').trim()
  const fonteId = String(formData.get('fonte_id') || '').trim()

  if (!titulo) {
    redirect('/projetos-captacao/oportunidades?novo=1&message=Informe o título da oportunidade')
  }

  const { error } = await supabase.from('captacao_oportunidades').insert({
    titulo,
    orgao: orgao || null,
    esfera: esfera || null,
    area: area || null,
    tipo: tipo || null,
    valor_disponivel: valorDisponivel ? Number(valorDisponivel) : null,
    prazo_inscricao: prazoInscricao || null,
    link_oficial: linkOficial || null,
    resumo: resumo || null,
    documentos_exigidos: documentosExigidos || null,
    quem_pode_participar: quemPodeParticipar || null,
    status,
    fonte_id: fonteId || null,
  })

  if (error) {
    redirect(`/projetos-captacao/oportunidades?novo=1&message=${encodeURIComponent(error.message)}`)
  }

  redirect('/projetos-captacao/oportunidades?message=Oportunidade cadastrada com sucesso')
}

export async function atualizarOportunidadeCaptacao(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') || '').trim()
  const titulo = String(formData.get('titulo') || '').trim()
  const orgao = String(formData.get('orgao') || '').trim()
  const esfera = String(formData.get('esfera') || '').trim()
  const area = String(formData.get('area') || '').trim()
  const tipo = String(formData.get('tipo') || '').trim()
  const valorDisponivel = String(formData.get('valor_disponivel') || '').replace(',', '.').trim()
  const prazoInscricao = String(formData.get('prazo_inscricao') || '').trim()
  const linkOficial = String(formData.get('link_oficial') || '').trim()
  const resumo = String(formData.get('resumo') || '').trim()
  const documentosExigidos = String(formData.get('documentos_exigidos') || '').trim()
  const quemPodeParticipar = String(formData.get('quem_pode_participar') || '').trim()
  const status = String(formData.get('status') || 'aberta').trim()
  const fonteId = String(formData.get('fonte_id') || '').trim()

  if (!id) {
    redirect('/projetos-captacao/oportunidades?message=Oportunidade não encontrada')
  }

  if (!titulo) {
    redirect(`/projetos-captacao/oportunidades?editar=${id}&message=Informe o título da oportunidade`)
  }

  const { error } = await supabase
    .from('captacao_oportunidades')
    .update({
      titulo,
      orgao: orgao || null,
      esfera: esfera || null,
      area: area || null,
      tipo: tipo || null,
      valor_disponivel: valorDisponivel ? Number(valorDisponivel) : null,
      prazo_inscricao: prazoInscricao || null,
      link_oficial: linkOficial || null,
      resumo: resumo || null,
      documentos_exigidos: documentosExigidos || null,
      quem_pode_participar: quemPodeParticipar || null,
      status,
      fonte_id: fonteId || null,
    })
    .eq('id', id)

  if (error) {
    redirect(`/projetos-captacao/oportunidades?editar=${id}&message=${encodeURIComponent(error.message)}`)
  }

  redirect('/projetos-captacao/oportunidades?message=Oportunidade atualizada com sucesso')
}

export async function alterarStatusOportunidadeCaptacao(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') || '').trim()
  const status = String(formData.get('status') || '').trim()

  if (!id || !status) {
    redirect('/projetos-captacao/oportunidades?message=Dados inválidos')
  }

  const { error } = await supabase
    .from('captacao_oportunidades')
    .update({ status })
    .eq('id', id)

  if (error) {
    redirect(`/projetos-captacao/oportunidades?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/projetos-captacao/oportunidades?message=Status atualizado com sucesso')
}