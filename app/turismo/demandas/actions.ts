'use server'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"
import { createClient } from '@/lib/supabase/server'

export async function criarDemandaTurismo(formData: FormData) {
  const supabase = await createClient()

  const pontoId = String(formData.get('ponto_id') || '').trim()
  const titulo = String(formData.get('titulo') || '').trim()
  const descricao = String(formData.get('descricao') || '').trim()
  const prioridade = String(formData.get('prioridade') || 'media').trim()
  const status = String(formData.get('status') || 'pendente').trim()
  const responsavel = String(formData.get('responsavel') || '').trim()
  const prazo = String(formData.get('prazo') || '').trim()

  if (!titulo) {
    redirect('/turismo/demandas?novo=1&message=Informe o título da demanda')
  }

  const { error } = await supabase.from('turismo_demandas').insert({
    ponto_id: pontoId || null,
    titulo,
    descricao: descricao || null,
    prioridade,
    status,
    responsavel: responsavel || null,
    prazo: prazo || null,
  })

  if (error) {
    redirect(`/turismo/demandas?novo=1&message=${encodeURIComponent(error.message)}`)
  }

  redirect('/turismo/demandas?message=Demanda cadastrada com sucesso')
}

export async function atualizarDemandaTurismo(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') || '').trim()
  const pontoId = String(formData.get('ponto_id') || '').trim()
  const titulo = String(formData.get('titulo') || '').trim()
  const descricao = String(formData.get('descricao') || '').trim()
  const prioridade = String(formData.get('prioridade') || 'media').trim()
  const status = String(formData.get('status') || 'pendente').trim()
  const responsavel = String(formData.get('responsavel') || '').trim()
  const prazo = String(formData.get('prazo') || '').trim()

  if (!id) {
    redirect('/turismo/demandas?message=Demanda não encontrada')
  }

  if (!titulo) {
    redirect(`/turismo/demandas?editar=${id}&message=Informe o título da demanda`)
  }

  const { error } = await supabase
    .from('turismo_demandas')
    .update({
      ponto_id: pontoId || null,
      titulo,
      descricao: descricao || null,
      prioridade,
      status,
      responsavel: responsavel || null,
      prazo: prazo || null,
    })
    .eq('id', id)

  if (error) {
    redirect(`/turismo/demandas?editar=${id}&message=${encodeURIComponent(error.message)}`)
  }

  redirect('/turismo/demandas?message=Demanda atualizada com sucesso')
}

export async function concluirDemandaTurismo(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id') || '').trim()

  if (!id) {
    redirect('/turismo/demandas?message=Demanda não encontrada')
  }

  const { error } = await supabase
    .from('turismo_demandas')
    .update({ status: 'concluida' })
    .eq('id', id)

  if (error) {
    redirect(`/turismo/demandas?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/turismo/demandas?message=Demanda concluída com sucesso')
}

export async function reabrirDemandaTurismo(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id') || '').trim()

  if (!id) {
    redirect('/turismo/demandas?message=Demanda não encontrada')
  }

  const { error } = await supabase
    .from('turismo_demandas')
    .update({ status: 'pendente' })
    .eq('id', id)

  if (error) {
    redirect(`/turismo/demandas?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/turismo/demandas?message=Demanda reaberta com sucesso')
}