'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"

export async function salvarConfiguracoesCasaArtesao(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') ?? '').trim()
  const percentualComissao = Number(formData.get('percentual_comissao_padrao') ?? 0)

  if (Number.isNaN(percentualComissao) || percentualComissao < 0) {
    redirect('/casa-artesao/configuracoes?message=Informe uma comissão válida')
  }

  if (id) {
    const { error } = await supabase
      .from('casa_artesao_configuracoes')
      .update({
        percentual_comissao_padrao: percentualComissao,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      redirect(`/casa-artesao/configuracoes?message=${encodeURIComponent(error.message)}`)
    }
  } else {
    const { error } = await supabase
      .from('casa_artesao_configuracoes')
      .insert({
        percentual_comissao_padrao: percentualComissao,
      })

    if (error) {
      redirect(`/casa-artesao/configuracoes?message=${encodeURIComponent(error.message)}`)
    }
  }

  redirect('/casa-artesao/configuracoes?message=Configurações salvas com sucesso')
}