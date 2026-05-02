'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function normalizarHora(valor: string) {
  return valor?.trim() || ''
}

export async function criarAula(formData: FormData) {
  const nome = String(formData.get('nome') ?? '').trim()
  const modalidadeId = String(formData.get('modalidade_id') ?? '').trim()
  const professorId = String(formData.get('professor_id') ?? '').trim()
  const diaSemana = String(formData.get('dia_semana') ?? '').trim()
  const horarioInicio = normalizarHora(String(formData.get('horario_inicio') ?? ''))
  const horarioFim = normalizarHora(String(formData.get('horario_fim') ?? ''))
  const status = String(formData.get('status') ?? 'ativa').trim()

  if (
    !nome ||
    !modalidadeId ||
    !professorId ||
    !diaSemana ||
    !horarioInicio ||
    !horarioFim ||
    !status
  ) {
    redirect('/aulas?novo=1&message=Preencha todos os campos obrigatórios')
  }

  const supabase = await createClient()

  const { error } = await supabase.from('aulas').insert({
    nome,
    modalidade_id: modalidadeId,
    professor_id: professorId,
    dia_semana: diaSemana,
    horario_inicio: horarioInicio,
    horario_fim: horarioFim,
    status,
  })

  if (error) {
    redirect(`/aulas?novo=1&message=${encodeURIComponent(error.message)}`)
  }

  redirect('/aulas?message=Aula cadastrada com sucesso')
}

export async function atualizarAula(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim()
  const nome = String(formData.get('nome') ?? '').trim()
  const modalidadeId = String(formData.get('modalidade_id') ?? '').trim()
  const professorId = String(formData.get('professor_id') ?? '').trim()
  const diaSemana = String(formData.get('dia_semana') ?? '').trim()
  const horarioInicio = normalizarHora(String(formData.get('horario_inicio') ?? ''))
  const horarioFim = normalizarHora(String(formData.get('horario_fim') ?? ''))
  const status = String(formData.get('status') ?? 'ativa').trim()

  if (
    !id ||
    !nome ||
    !modalidadeId ||
    !professorId ||
    !diaSemana ||
    !horarioInicio ||
    !horarioFim ||
    !status
  ) {
    redirect('/aulas?message=Preencha todos os campos obrigatórios')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('aulas')
    .update({
      nome,
      modalidade_id: modalidadeId,
      professor_id: professorId,
      dia_semana: diaSemana,
      horario_inicio: horarioInicio,
      horario_fim: horarioFim,
      status,
    })
    .eq('id', id)

  if (error) {
    redirect(`/aulas?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/aulas?message=Aula atualizada com sucesso')
}

export async function inativarAula(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/aulas?message=Aula não encontrada')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('aulas')
    .update({ status: 'inativa' })
    .eq('id', id)

  if (error) {
    redirect(`/aulas?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/aulas?message=Aula inativada com sucesso')
}

export async function ativarAula(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/aulas?message=Aula não encontrada')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('aulas')
    .update({ status: 'ativa' })
    .eq('id', id)

  if (error) {
    redirect(`/aulas?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/aulas?message=Aula ativada com sucesso')
}