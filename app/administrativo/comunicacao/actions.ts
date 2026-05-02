'use server'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"
import { createClient } from '@/lib/supabase/server'

export async function registrarComunicacao(formData: FormData) {
  const supabase = await createClient()

  const tipo = String(formData.get('tipo') || 'comunicado')
  const mensagem = String(formData.get('mensagem') || '')
  const totalContatos = Number(formData.get('total_contatos') || 0)
  const filtro = String(formData.get('filtro') || 'todos')
  const modalidade = String(formData.get('modalidade') || '')
  const aula = String(formData.get('aula') || '')
  const professor = String(formData.get('professor') || '')

  const { error } = await supabase.from('comunicacoes').insert({
    tipo,
    mensagem,
    total_contatos: totalContatos,
    filtro,
    modalidade: modalidade || null,
    aula: aula || null,
    professor: professor || null,
  })

  if (error) {
    redirect(`/administrativo/comunicacao?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/administrativo/comunicacao?message=Comunicação registrada com sucesso')
}