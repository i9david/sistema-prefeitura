'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"

export async function entradaEstoque(formData: FormData) {
  const supabase = await createClient()

  const produtoId = String(formData.get('produto_id'))
  const quantidade = Number(formData.get('quantidade'))

  if (!produtoId || quantidade <= 0) {
    redirect('/casa-artesao/estoque?message=Dados inválidos')
  }

  const { data: produto } = await supabase
    .from('casa_artesao_produtos')
    .select('*')
    .eq('id', produtoId)
    .single()

  if (!produto) {
    redirect('/casa-artesao/estoque?message=Produto não encontrado')
  }

  await supabase
    .from('casa_artesao_produtos')
    .update({
      quantidade: (produto.quantidade ?? 0) + quantidade,
    })
    .eq('id', produtoId)

  await supabase.from('casa_artesao_estoque_movimentacoes').insert({
    produto_id: produtoId,
    tipo: 'entrada_manual',
    quantidade,
    motivo: 'Entrada manual',
  })

  redirect('/casa-artesao/estoque?message=Entrada registrada')
}