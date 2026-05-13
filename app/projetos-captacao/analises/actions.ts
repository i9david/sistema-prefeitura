'use server'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Sidebar } from "@/components/sidebar"

export async function criarAnalise(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const projeto_id = String(formData.get('projeto_id') || '').trim()
  const oportunidade_id = String(formData.get('oportunidade_id') || '').trim()
  const parecer = String(formData.get('parecer') || '').trim()
  const viabilidade = String(formData.get('viabilidade') || 'em_analise').trim()
  const documentos_pendentes = String(formData.get('documentos_pendentes') || '').trim()
  const proximo_passo = String(formData.get('proximo_passo') || '').trim()
  const responsavel_analise = String(formData.get('responsavel_analise') || '').trim()

  if (!projeto_id) {
    redirect('/projetos-captacao/analises?message=Selecione um projeto')
  }

  const { error } = await admin.from('captacao_analises').insert({
    projeto_id,
    oportunidade_id: oportunidade_id || null,
    parecer: parecer || null,
    viabilidade,
    documentos_pendentes: documentos_pendentes || null,
    proximo_passo: proximo_passo || null,
    responsavel_analise: responsavel_analise || null,
    status: 'em_analise',
  })

  if (error) {
    redirect(`/projetos-captacao/analises?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/projetos-captacao/analises?message=Análise criada com sucesso')
}

export async function atualizarAnalise(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const id = String(formData.get('id') || '').trim()
  const parecer = String(formData.get('parecer') || '').trim()
  const viabilidade = String(formData.get('viabilidade') || '').trim()
  const documentos_pendentes = String(formData.get('documentos_pendentes') || '').trim()
  const proximo_passo = String(formData.get('proximo_passo') || '').trim()
  const status = String(formData.get('status') || '').trim()

  if (!id) {
    redirect('/projetos-captacao/analises?message=Análise inválida')
  }

  const { error } = await admin
    .from('captacao_analises')
    .update({
      parecer,
      viabilidade,
      documentos_pendentes,
      proximo_passo,
      status,
    })
    .eq('id', id)

  if (error) {
    redirect(`/projetos-captacao/analises?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/projetos-captacao/analises?message=Análise atualizada')
}
