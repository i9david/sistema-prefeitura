'use server'

import { redirect } from 'next/navigation'
import { exigirPermissaoAction } from '@/lib/seguranca-actions'

export async function vincularProfessorNaModalidade(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    'Centro Cultural',
    'Professores',
    'criar'
  )

  const modalidadeId = String(formData.get('modalidade_id') ?? '').trim()
  const professorId = String(formData.get('professor_id') ?? '').trim()
  const funcao = String(formData.get('funcao') ?? '').trim()

  if (!modalidadeId || !professorId || !funcao) {
    redirect('/modalidade-professores?message=Preencha todos os campos obrigatórios')
  }

  const { data: existente } = await supabase
    .from('modalidade_professores')
    .select('id')
    .eq('modalidade_id', modalidadeId)
    .eq('professor_id', professorId)
    .maybeSingle()

  if (existente) {
    redirect('/modalidade-professores?message=Esse professor já está vinculado a essa modalidade')
  }

  const { error } = await supabase.from('modalidade_professores').insert({
    modalidade_id: modalidadeId,
    professor_id: professorId,
    funcao,
  })

  if (error) {
    redirect(`/modalidade-professores?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/modalidade-professores?message=Professor vinculado com sucesso')
}

export async function atualizarVinculoProfessorModalidade(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    'Centro Cultural',
    'Professores',
    'editar'
  )

  const id = String(formData.get('id') ?? '').trim()
  const modalidadeId = String(formData.get('modalidade_id') ?? '').trim()
  const professorId = String(formData.get('professor_id') ?? '').trim()
  const funcao = String(formData.get('funcao') ?? '').trim()

  if (!id || !modalidadeId || !professorId || !funcao) {
    redirect('/modalidade-professores?message=Preencha todos os campos obrigatórios')
  }

  const { error } = await supabase
    .from('modalidade_professores')
    .update({
      modalidade_id: modalidadeId,
      professor_id: professorId,
      funcao,
    })
    .eq('id', id)

  if (error) {
    redirect(`/modalidade-professores?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/modalidade-professores?message=Vínculo atualizado com sucesso')
}

export async function excluirVinculoProfessorModalidade(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    'Centro Cultural',
    'Professores',
    'excluir'
  )

  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/modalidade-professores?message=Vínculo não encontrado')
  }

  const { error } = await supabase
    .from('modalidade_professores')
    .delete()
    .eq('id', id)

  if (error) {
    redirect(`/modalidade-professores?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/modalidade-professores?message=Vínculo removido com sucesso')
}
