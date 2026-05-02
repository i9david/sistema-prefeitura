'use server'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"
import { createClient } from '@/lib/supabase/server'

export async function criarFonteRecurso(formData: FormData) {
  const supabase = await createClient()

  const nome = String(formData.get('nome') || '').trim()
  const orgao = String(formData.get('orgao') || '').trim()
  const esfera = String(formData.get('esfera') || '').trim()
  const area = String(formData.get('area') || '').trim()
  const site_oficial = String(formData.get('site_oficial') || '').trim()
  const descricao = String(formData.get('descricao') || '').trim()
  const status = String(formData.get('status') || 'ativa').trim()

  if (!nome) {
    redirect('/projetos-captacao/fontes?novo=1&message=Informe o nome da fonte')
  }

  const { error } = await supabase.from('captacao_fontes').insert({
    nome,
    orgao: orgao || null,
    esfera: esfera || null,
    area: area || null,
    site_oficial: site_oficial || null,
    descricao: descricao || null,
    status,
  })

  if (error) {
    redirect(`/projetos-captacao/fontes?novo=1&message=${encodeURIComponent(error.message)}`)
  }

  redirect('/projetos-captacao/fontes?message=Fonte cadastrada com sucesso')
}

export async function atualizarFonteRecurso(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') || '').trim()
  const nome = String(formData.get('nome') || '').trim()
  const orgao = String(formData.get('orgao') || '').trim()
  const esfera = String(formData.get('esfera') || '').trim()
  const area = String(formData.get('area') || '').trim()
  const site_oficial = String(formData.get('site_oficial') || '').trim()
  const descricao = String(formData.get('descricao') || '').trim()
  const status = String(formData.get('status') || 'ativa').trim()

  if (!id) {
    redirect('/projetos-captacao/fontes?message=Fonte não encontrada')
  }

  if (!nome) {
    redirect(`/projetos-captacao/fontes?editar=${id}&message=Informe o nome da fonte`)
  }

  const { error } = await supabase
    .from('captacao_fontes')
    .update({
      nome,
      orgao: orgao || null,
      esfera: esfera || null,
      area: area || null,
      site_oficial: site_oficial || null,
      descricao: descricao || null,
      status,
    })
    .eq('id', id)

  if (error) {
    redirect(`/projetos-captacao/fontes?editar=${id}&message=${encodeURIComponent(error.message)}`)
  }

  redirect('/projetos-captacao/fontes?message=Fonte atualizada com sucesso')
}

export async function ativarFonteRecurso(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') || '').trim()

  if (!id) {
    redirect('/projetos-captacao/fontes?message=Fonte não encontrada')
  }

  const { error } = await supabase
    .from('captacao_fontes')
    .update({ status: 'ativa' })
    .eq('id', id)

  if (error) {
    redirect(`/projetos-captacao/fontes?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/projetos-captacao/fontes?message=Fonte ativada com sucesso')
}

export async function inativarFonteRecurso(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') || '').trim()

  if (!id) {
    redirect('/projetos-captacao/fontes?message=Fonte não encontrada')
  }

  const { error } = await supabase
    .from('captacao_fontes')
    .update({ status: 'inativa' })
    .eq('id', id)

  if (error) {
    redirect(`/projetos-captacao/fontes?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/projetos-captacao/fontes?message=Fonte inativada com sucesso')
}