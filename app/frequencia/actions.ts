'use server'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"
import { exigirPermissaoAction } from '@/lib/seguranca-actions'

export async function salvarFrequencia(formData: FormData) {
  const { supabase, usuarioInterno } = await exigirPermissaoAction(
    'Centro Cultural',
    'Frequência',
    'editar'
  )

  const aulaId = String(formData.get('aula_id') ?? '').trim()
  const dataAula = String(formData.get('data_aula') ?? '').trim()

  if (!aulaId || !dataAula) {
    redirect('/frequencia?message=Turma e data são obrigatórias')
  }

  if (usuarioInterno.professor_id) {
    const { data: aulaPermitida, error: aulaError } = await supabase
      .from('aulas')
      .select('id, professor_id')
      .eq('id', aulaId)
      .eq('professor_id', usuarioInterno.professor_id)
      .maybeSingle()

    if (aulaError) {
      redirect(`/frequencia?message=${encodeURIComponent(aulaError.message)}`)
    }

    if (!aulaPermitida) {
      redirect('/frequencia?message=Você não tem permissão para lançar frequência nesta turma')
    }
  }

  const { data: alunosData, error: alunosError } = await supabase
    .from('alunos')
    .select('id')
    .eq('aula_id', aulaId)
    .eq('status', 'ativo')

  if (alunosError) {
    redirect(`/frequencia?message=${encodeURIComponent(alunosError.message)}`)
  }

  const alunos = alunosData ?? []

  if (alunos.length === 0) {
    redirect('/frequencia?message=Não existem alunos ativos nesta turma')
  }

  const registros = alunos.map((aluno) => {
    const status = String(formData.get(`status_${aluno.id}`) ?? '').trim()
    const observacoes = String(formData.get(`observacoes_${aluno.id}`) ?? '').trim()

    return {
      aula_id: aulaId,
      aluno_id: aluno.id,
      data_aula: dataAula,
      status,
      observacoes: observacoes || null,
      origem: 'manual',
    }
  })

  const registrosValidos = registros.filter((item) => item.status)

  if (registrosValidos.length === 0) {
    redirect(
      `/frequencia?aula_id=${encodeURIComponent(
        aulaId
      )}&data_aula=${encodeURIComponent(dataAula)}&message=Preencha a frequência dos alunos`
    )
  }

  const { error: deleteError } = await supabase
    .from('frequencias')
    .delete()
    .eq('aula_id', aulaId)
    .eq('data_aula', dataAula)

  if (deleteError) {
    redirect(`/frequencia?message=${encodeURIComponent(deleteError.message)}`)
  }

  const { error: insertError } = await supabase
    .from('frequencias')
    .insert(registrosValidos)

  if (insertError) {
    redirect(`/frequencia?message=${encodeURIComponent(insertError.message)}`)
  }

  redirect(
    `/frequencia?aula_id=${encodeURIComponent(
      aulaId
    )}&data_aula=${encodeURIComponent(dataAula)}&message=Frequência salva com sucesso`
  )
}