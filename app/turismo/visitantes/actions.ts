'use server'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"
import { createClient } from '@/lib/supabase/server'

export async function criarVisitanteTurismo(formData: FormData) {
  const supabase = await createClient()

  const nome = String(formData.get('nome') || '')
  const telefone = String(formData.get('telefone') || '')
  const cidade_origem = String(formData.get('cidade_origem') || '')
  const ponto_visitado = String(formData.get('ponto_visitado') || '')
  const data_visita = String(formData.get('data_visita') || '')
  const observacoes = String(formData.get('observacoes') || '')

  if (!nome) {
    redirect('/turismo/visitantes?novo=1&message=Informe o nome')
  }

  const { error } = await supabase.from('turismo_visitantes').insert({
    nome,
    telefone,
    cidade_origem,
    ponto_visitado,
    data_visita: data_visita || null,
    observacoes,
  })

  if (error) {
    redirect(`/turismo/visitantes?novo=1&message=${error.message}`)
  }

  redirect('/turismo/visitantes?message=Visitante cadastrado')
}