'use server'

import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from "@/components/sidebar"

function hojeBrasil() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export async function registrarVenda(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const produtoId = String(formData.get('produto_id') ?? '')
  const quantidade = Number(formData.get('quantidade') ?? 1)

  if (!produtoId || quantidade <= 0) {
    redirect('/casa-artesao?message=Dados invï¿½lidos')
  }

  // Buscar produto
  const { data: produto } = await supabase
    .from('casa_artesao_produtos')
    .select('id, nome, quantidade, preco, status, artesao_id')
    .eq('id', produtoId)
    .single()

  if (!produto) {
    redirect('/casa-artesao?message=Produto nï¿½o encontrado')
  }

  if (produto.quantidade < quantidade) {
    redirect('/casa-artesao?message=Estoque insuficiente')
  }

  const dataHoje = hojeBrasil()
  const subtotal = quantidade * Number(produto.preco)

  // Criar venda
  const { data: venda, error: vendaError } = await admin
    .from('casa_artesao_vendas')
    .insert({
      data_venda: dataHoje,
      valor_total: subtotal,
    })
    .select()
    .single()

  if (vendaError) {
    redirect(`/casa-artesao?message=${vendaError.message}`)
  }

  // Criar item da venda
  const { error: itemError } = await admin
    .from('casa_artesao_venda_itens')
    .insert({
      venda_id: venda.id,
      produto_id: produto.id,
      artesao_id: produto.artesao_id,
      quantidade,
      preco_unitario: produto.preco,
      subtotal,
    })

  if (itemError) {
    redirect(`/casa-artesao?message=${itemError.message}`)
  }

  // Atualizar estoque
  const { error: estoqueError } = await admin
    .from('casa_artesao_produtos')
    .update({
      quantidade: produto.quantidade - quantidade,
    })
    .eq('id', produto.id)

  if (estoqueError) {
    redirect(`/casa-artesao?message=${estoqueError.message}`)
  }

  redirect('/casa-artesao?message=Venda registrada com sucesso')
}
