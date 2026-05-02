'use server'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"
import { createClient } from '@/lib/supabase/server'

export async function criarEnsaio(formData: FormData) {
  const supabase = await createClient()

  const titulo = String(formData.get('titulo') ?? '').trim()
  const dataEnsaio = String(formData.get('data_ensaio') ?? '').trim()
  const horarioInicio = String(formData.get('horario_inicio') ?? '').trim()
  const horarioFim = String(formData.get('horario_fim') ?? '').trim()
  const local = String(formData.get('local') ?? '').trim()
  const repertorio = String(formData.get('repertorio') ?? '').trim()
  const observacoes = String(formData.get('observacoes') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim() || 'agendado'

  if (!titulo) {
    redirect('/banda-municipal/ensaios?message=Informe o título do ensaio')
  }

  if (!dataEnsaio) {
    redirect('/banda-municipal/ensaios?message=Informe a data do ensaio')
  }

  if (!horarioInicio) {
    redirect('/banda-municipal/ensaios?message=Informe o horário de início')
  }

  const { error } = await supabase.from('banda_municipal_ensaios').insert({
    titulo,
    data_ensaio: dataEnsaio,
    horario_inicio: horarioInicio,
    horario_fim: horarioFim || null,
    local: local || null,
    repertorio: repertorio || null,
    observacoes: observacoes || null,
    status,
  })

  if (error) {
    redirect(`/banda-municipal/ensaios?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/banda-municipal/ensaios?message=Ensaio cadastrado com sucesso')
}

export async function atualizarEnsaio(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') ?? '').trim()
  const titulo = String(formData.get('titulo') ?? '').trim()
  const dataEnsaio = String(formData.get('data_ensaio') ?? '').trim()
  const horarioInicio = String(formData.get('horario_inicio') ?? '').trim()
  const horarioFim = String(formData.get('horario_fim') ?? '').trim()
  const local = String(formData.get('local') ?? '').trim()
  const repertorio = String(formData.get('repertorio') ?? '').trim()
  const observacoes = String(formData.get('observacoes') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim()

  if (!id) {
    redirect('/banda-municipal/ensaios?message=Ensaio não encontrado')
  }

  if (!titulo) {
    redirect('/banda-municipal/ensaios?message=Informe o título do ensaio')
  }

  if (!dataEnsaio) {
    redirect('/banda-municipal/ensaios?message=Informe a data do ensaio')
  }

  if (!horarioInicio) {
    redirect('/banda-municipal/ensaios?message=Informe o horário de início')
  }

  const { error } = await supabase
    .from('banda_municipal_ensaios')
    .update({
      titulo,
      data_ensaio: dataEnsaio,
      horario_inicio: horarioInicio,
      horario_fim: horarioFim || null,
      local: local || null,
      repertorio: repertorio || null,
      observacoes: observacoes || null,
      status: status || 'agendado',
    })
    .eq('id', id)

  if (error) {
    redirect(`/banda-municipal/ensaios?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/banda-municipal/ensaios?message=Ensaio atualizado com sucesso')
}

export async function salvarPresencasEnsaio(formData: FormData) {
  const supabase = await createClient()

  const ensaioId = String(formData.get('ensaio_id') ?? '').trim()

  if (!ensaioId) {
    redirect('/banda-municipal/ensaios?message=Ensaio não encontrado')
  }

  const { data: musicos, error: musicosError } = await supabase
    .from('banda_municipal_musicos')
    .select('id')
    .eq('status', 'ativo')

  if (musicosError) {
    redirect(`/banda-municipal/ensaios?message=${encodeURIComponent(musicosError.message)}`)
  }

  for (const musico of musicos ?? []) {
    const status = String(formData.get(`status_${musico.id}`) ?? '').trim()
    const observacoes = String(formData.get(`observacoes_${musico.id}`) ?? '').trim()

    if (!status) continue

    const { error } = await supabase
      .from('banda_municipal_ensaio_presencas')
      .upsert(
        {
          ensaio_id: ensaioId,
          musico_id: musico.id,
          status,
          observacoes: observacoes || null,
        },
        {
          onConflict: 'ensaio_id,musico_id',
        }
      )

    if (error) {
      redirect(`/banda-municipal/ensaios?message=${encodeURIComponent(error.message)}`)
    }
  }

  redirect(`/banda-municipal/ensaios?ensaio_id=${ensaioId}&message=Presenças salvas com sucesso`)
}