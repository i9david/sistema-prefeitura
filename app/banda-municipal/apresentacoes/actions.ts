'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function criarApresentacao(formData: FormData) {
  const supabase = await createClient()

  const titulo = String(formData.get('titulo') ?? '').trim()
  const dataApresentacao = String(formData.get('data_apresentacao') ?? '').trim()
  const horario = String(formData.get('horario') ?? '').trim()
  const local = String(formData.get('local') ?? '').trim()
  const evento = String(formData.get('evento') ?? '').trim()
  const repertorio = String(formData.get('repertorio') ?? '').trim()
  const observacoes = String(formData.get('observacoes') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim() || 'agendada'

  if (!titulo) {
    redirect('/banda-municipal/apresentacoes?message=Informe o título da apresentação')
  }

  if (!dataApresentacao) {
    redirect('/banda-municipal/apresentacoes?message=Informe a data da apresentação')
  }

  const { error } = await supabase.from('banda_municipal_apresentacoes').insert({
    titulo,
    data_apresentacao: dataApresentacao,
    horario: horario || null,
    local: local || null,
    evento: evento || null,
    repertorio: repertorio || null,
    observacoes: observacoes || null,
    status,
  })

  if (error) {
    redirect(`/banda-municipal/apresentacoes?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/banda-municipal/apresentacoes?message=Apresentação cadastrada com sucesso')
}

export async function atualizarApresentacao(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') ?? '').trim()
  const titulo = String(formData.get('titulo') ?? '').trim()
  const dataApresentacao = String(formData.get('data_apresentacao') ?? '').trim()
  const horario = String(formData.get('horario') ?? '').trim()
  const local = String(formData.get('local') ?? '').trim()
  const evento = String(formData.get('evento') ?? '').trim()
  const repertorio = String(formData.get('repertorio') ?? '').trim()
  const observacoes = String(formData.get('observacoes') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim()

  if (!id) {
    redirect('/banda-municipal/apresentacoes?message=Apresentação não encontrada')
  }

  if (!titulo) {
    redirect('/banda-municipal/apresentacoes?message=Informe o título da apresentação')
  }

  if (!dataApresentacao) {
    redirect('/banda-municipal/apresentacoes?message=Informe a data da apresentação')
  }

  const { error } = await supabase
    .from('banda_municipal_apresentacoes')
    .update({
      titulo,
      data_apresentacao: dataApresentacao,
      horario: horario || null,
      local: local || null,
      evento: evento || null,
      repertorio: repertorio || null,
      observacoes: observacoes || null,
      status: status || 'agendada',
    })
    .eq('id', id)

  if (error) {
    redirect(`/banda-municipal/apresentacoes?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/banda-municipal/apresentacoes?message=Apresentação atualizada com sucesso')
}

export async function salvarParticipantesApresentacao(formData: FormData) {
  const supabase = await createClient()

  const apresentacaoId = String(formData.get('apresentacao_id') ?? '').trim()

  if (!apresentacaoId) {
    redirect('/banda-municipal/apresentacoes?message=Apresentação não encontrada')
  }

  const { data: musicos, error: musicosError } = await supabase
    .from('banda_municipal_musicos')
    .select('id')
    .eq('status', 'ativo')

  if (musicosError) {
    redirect(`/banda-municipal/apresentacoes?message=${encodeURIComponent(musicosError.message)}`)
  }

  for (const musico of musicos ?? []) {
    const confirmado = String(formData.get(`confirmado_${musico.id}`) ?? '').trim() === '1'
    const observacoes = String(formData.get(`observacoes_${musico.id}`) ?? '').trim()

    const { error } = await supabase
      .from('banda_municipal_apresentacao_musicos')
      .upsert(
        {
          apresentacao_id: apresentacaoId,
          musico_id: musico.id,
          confirmado,
          observacoes: observacoes || null,
        },
        {
          onConflict: 'apresentacao_id,musico_id',
        }
      )

    if (error) {
      redirect(`/banda-municipal/apresentacoes?message=${encodeURIComponent(error.message)}`)
    }
  }

  redirect(`/banda-municipal/apresentacoes?apresentacao_id=${apresentacaoId}&message=Participantes salvos com sucesso`)
}