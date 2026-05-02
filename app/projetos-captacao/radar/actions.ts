'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function aprovarCapturaRadar(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') || '').trim()

  if (!id) {
    redirect('/projetos-captacao/radar?message=Captura não encontrada')
  }

  const { data: captura, error: capturaError } = await supabase
    .from('captacao_radar_capturas')
    .select(`
      id,
      fonte_id,
      titulo,
      orgao,
      esfera,
      area,
      link_oficial,
      resumo,
      prazo_inscricao
    `)
    .eq('id', id)
    .maybeSingle()

  if (capturaError || !captura) {
    redirect('/projetos-captacao/radar?message=Captura não encontrada')
  }

  const { error: oportunidadeError } = await supabase
    .from('captacao_oportunidades')
    .insert({
      titulo: captura.titulo,
      orgao: captura.orgao || null,
      esfera: captura.esfera || null,
      area: captura.area || null,
      tipo: 'Edital / Oportunidade capturada',
      valor_disponivel: null,
      prazo_inscricao: captura.prazo_inscricao || null,
      link_oficial: captura.link_oficial || null,
      resumo: captura.resumo || null,
      documentos_exigidos: null,
      quem_pode_participar: null,
      status: 'aberta',
      fonte_id: null,
    })

  if (oportunidadeError) {
    redirect(`/projetos-captacao/radar?message=${encodeURIComponent(oportunidadeError.message)}`)
  }

  const { error: updateError } = await supabase
    .from('captacao_radar_capturas')
    .update({
      status: 'aprovada',
    })
    .eq('id', id)

  if (updateError) {
    redirect(`/projetos-captacao/radar?message=${encodeURIComponent(updateError.message)}`)
  }

  redirect('/projetos-captacao/radar?message=Oportunidade aprovada e enviada para o módulo de oportunidades')
}

export async function ignorarCapturaRadar(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') || '').trim()

  if (!id) {
    redirect('/projetos-captacao/radar?message=Captura não encontrada')
  }

  const { error } = await supabase
    .from('captacao_radar_capturas')
    .update({
      status: 'ignorada',
    })
    .eq('id', id)

  if (error) {
    redirect(`/projetos-captacao/radar?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/projetos-captacao/radar?message=Captura ignorada')
}

export async function reabrirCapturaRadar(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') || '').trim()

  if (!id) {
    redirect('/projetos-captacao/radar?message=Captura não encontrada')
  }

  const { error } = await supabase
    .from('captacao_radar_capturas')
    .update({
      status: 'aguardando_revisao',
    })
    .eq('id', id)

  if (error) {
    redirect(`/projetos-captacao/radar?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/projetos-captacao/radar?message=Captura reaberta para revisão')
}

export async function ativarFonteRadar(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') || '').trim()

  if (!id) {
    redirect('/projetos-captacao/radar?message=Fonte não encontrada')
  }

  const { error } = await supabase
    .from('captacao_radar_fontes')
    .update({
      status: 'ativa',
    })
    .eq('id', id)

  if (error) {
    redirect(`/projetos-captacao/radar?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/projetos-captacao/radar?message=Fonte ativada')
}

export async function inativarFonteRadar(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') || '').trim()

  if (!id) {
    redirect('/projetos-captacao/radar?message=Fonte não encontrada')
  }

  const { error } = await supabase
    .from('captacao_radar_fontes')
    .update({
      status: 'inativa',
    })
    .eq('id', id)

  if (error) {
    redirect(`/projetos-captacao/radar?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/projetos-captacao/radar?message=Fonte inativada')
}