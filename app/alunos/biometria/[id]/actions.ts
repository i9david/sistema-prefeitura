'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"

export async function salvarBiometria(formData: FormData) {
  const alunoId = String(formData.get('aluno_id') ?? '').trim()
  const identificador = String(formData.get('identificador') ?? '').trim()
  const dedo = String(formData.get('dedo') ?? '').trim()

  if (!alunoId || !identificador) {
    redirect('/alunos?message=Preencha os dados da biometria')
  }

  const supabase = await createClient()

  const { error: insertError } = await supabase.from('aluno_biometrias').insert({
    aluno_id: alunoId,
    identificador_biometrico: identificador,
    dedo: dedo || null,
    status: 'ativo',
  })

  if (insertError) {
    redirect(`/alunos?message=${encodeURIComponent(insertError.message)}`)
  }

  const { error: updateError } = await supabase
    .from('alunos')
    .update({ biometria_cadastrada: true })
    .eq('id', alunoId)

  if (updateError) {
    redirect(`/alunos?message=${encodeURIComponent(updateError.message)}`)
  }

  redirect('/alunos?message=Biometria cadastrada com sucesso')
}