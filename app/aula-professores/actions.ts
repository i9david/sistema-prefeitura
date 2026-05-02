'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'

export async function vincularProfessorNaAula(formData: FormData) {
  const aulaId = String(formData.get('aula_id') ?? '').trim()
  const professorId = String(formData.get('professor_id') ?? '').trim()
  const funcao = String(formData.get('funcao') ?? '').trim()

  if (!aulaId || !professorId || !funcao) {
    redirect('/aula-professores?message=Preencha todos os campos obrigatórios')
  }

  const supabase = await createClient()

  const { data: existente } = await supabase
    .from('aula_professores')
    .select('id')
    .eq('aula_id', aulaId)
    .eq('professor_id', professorId)
    .maybeSingle()

  if (existente) {
    redirect('/aula-professores?message=Esse professor já está vinculado a essa aula')
  }

  const { error } = await supabase.from('aula_professores').insert({
    aula_id: aulaId,
    professor_id: professorId,
    funcao,
  })

  if (error) {
    redirect(`/aula-professores?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/aula-professores?message=Professor vinculado à aula com sucesso')
}

export async function atualizarVinculoProfessorAula(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim()
  const aulaId = String(formData.get('aula_id') ?? '').trim()
  const professorId = String(formData.get('professor_id') ?? '').trim()
  const funcao = String(formData.get('funcao') ?? '').trim()

  if (!id || !aulaId || !professorId || !funcao) {
    redirect('/aula-professores?message=Preencha todos os campos obrigatórios')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('aula_professores')
    .update({
      aula_id: aulaId,
      professor_id: professorId,
      funcao,
    })
    .eq('id', id)

  if (error) {
    redirect(`/aula-professores?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/aula-professores?message=Vínculo atualizado com sucesso')
}

export async function excluirVinculoProfessorAula(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/aula-professores?message=Vínculo não encontrado')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('aula_professores')
    .delete()
    .eq('id', id)

  if (error) {
    redirect(`/aula-professores?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/aula-professores?message=Vínculo removido com sucesso')
}