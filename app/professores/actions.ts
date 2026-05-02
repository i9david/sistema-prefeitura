'use server'

import { redirect } from 'next/navigation'
import { exigirPermissaoAction } from '@/lib/seguranca-actions'

function normalizarTelefone(valor: string) {
  return valor.replace(/\D/g, '').slice(0, 11)
}

function extrairModalidades(formData: FormData) {
  const modalidades = formData.getAll('modalidade_ids').map(String).filter(Boolean)
  return [...new Set(modalidades)]
}

export async function criarProfessor(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    'Centro Cultural',
    'Professores',
    'criar'
  )

  const nome = String(formData.get('nome') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const telefone = normalizarTelefone(String(formData.get('telefone') ?? ''))
  const status = String(formData.get('status') ?? 'ativo').trim()
  const modalidadeIds = extrairModalidades(formData)

  if (!nome || !email || !status) {
    redirect('/professores?novo=1&message=Preencha os campos obrigatórios')
  }

  const { data: professor, error } = await supabase
    .from('professores')
    .insert({
      nome,
      email,
      telefone: telefone || null,
      status,
    })
    .select('id')
    .single()

  if (error || !professor) {
    redirect(
      `/professores?novo=1&message=${encodeURIComponent(
        error?.message || 'Erro ao cadastrar professor'
      )}`
    )
  }

  if (modalidadeIds.length > 0) {
    const vinculos = modalidadeIds.map((modalidadeId) => ({
      professor_id: professor.id,
      modalidade_id: modalidadeId,
      funcao: 'Professor',
    }))

    const { error: erroVinculos } = await supabase
      .from('modalidade_professores')
      .insert(vinculos)

    if (erroVinculos) {
      redirect(`/professores?novo=1&message=${encodeURIComponent(erroVinculos.message)}`)
    }
  }

  redirect('/professores?message=Professor cadastrado com sucesso')
}

export async function atualizarProfessor(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    'Centro Cultural',
    'Professores',
    'editar'
  )

  const id = String(formData.get('id') ?? '').trim()
  const nome = String(formData.get('nome') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const telefone = normalizarTelefone(String(formData.get('telefone') ?? ''))
  const status = String(formData.get('status') ?? 'ativo').trim()
  const modalidadeIds = extrairModalidades(formData)

  if (!id || !nome || !email || !status) {
    redirect('/professores?message=Preencha os campos obrigatórios')
  }

  const { error } = await supabase
    .from('professores')
    .update({
      nome,
      email,
      telefone: telefone || null,
      status,
    })
    .eq('id', id)

  if (error) {
    redirect(`/professores?message=${encodeURIComponent(error.message)}`)
  }

  const { error: erroDelete } = await supabase
    .from('modalidade_professores')
    .delete()
    .eq('professor_id', id)

  if (erroDelete) {
    redirect(`/professores?message=${encodeURIComponent(erroDelete.message)}`)
  }

  if (modalidadeIds.length > 0) {
    const vinculos = modalidadeIds.map((modalidadeId) => ({
      professor_id: id,
      modalidade_id: modalidadeId,
      funcao: 'Professor',
    }))

    const { error: erroInsert } = await supabase
      .from('modalidade_professores')
      .insert(vinculos)

    if (erroInsert) {
      redirect(`/professores?message=${encodeURIComponent(erroInsert.message)}`)
    }
  }

  redirect('/professores?message=Professor atualizado com sucesso')
}

export async function inativarProfessor(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    'Centro Cultural',
    'Professores',
    'excluir'
  )

  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/professores?message=Professor não encontrado')
  }

  const { error } = await supabase
    .from('professores')
    .update({ status: 'inativo' })
    .eq('id', id)

  if (error) {
    redirect(`/professores?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/professores?message=Professor inativado com sucesso')
}

export async function ativarProfessor(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    'Centro Cultural',
    'Professores',
    'editar'
  )

  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/professores?message=Professor não encontrado')
  }

  const { error } = await supabase
    .from('professores')
    .update({ status: 'ativo' })
    .eq('id', id)

  if (error) {
    redirect(`/professores?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/professores?message=Professor ativado com sucesso')
}