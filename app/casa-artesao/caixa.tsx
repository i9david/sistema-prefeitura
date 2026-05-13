'use server'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
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

  const produtoId = String(formData.get('produto_id') ?? '').trim()
  const quantidade = Number(formData.get('quantidade') ?? 0)
  const observacoes = String(formData.get('observacoes') ?? '').trim()

  if (!produtoId) {
    redirect('/casa-artesao/caixa?message=Selecione um produto')
  }

  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    redirect('/casa-artesao/caixa?message=Informe uma quantidade válida')
  }

  const { data: produto, error: produtoError } = await supabase
    .from('casa_artesao_produtos')
    .select('id, nome, preco, quantidade, artesao_id, status')
    .eq('id', produtoId)
    .maybeSingle()

  if (produtoError) {
    redirect(`/casa-artesao/caixa?message=${encodeURIComponent(produtoError.message)}`)
  }

  if (!produto) {
    redirect('/casa-artesao/caixa?message=Produto não encontrado')
  }

  if (produto.status !== 'ativo') {
    redirect('/casa-artesao/caixa?message=Produto inativo não pode ser vendido')
  }

  if ((produto.quantidade ?? 0) < quantidade) {
    redirect('/casa-artesao/caixa?message=Quantidade em estoque insuficiente')
  }

  const precoUnitario = Number(produto.preco ?? 0)
  const subtotal = Number((precoUnitario * quantidade).toFixed(2))

  const { data: venda, error: vendaError } = await supabase
    .from('casa_artesao_vendas')
    .insert({
      data_venda: hojeBrasil(),
      valor_total: subtotal,
      observacoes: observacoes || null,
    })
    .select('id')
    .single()

  if (vendaError) {
    redirect(`/casa-artesao/caixa?message=${encodeURIComponent(vendaError.message)}`)
  }

  const { error: itemError } = await supabase
    .from('casa_artesao_venda_itens')
    .insert({
      venda_id: venda.id,
      produto_id: produto.id,
      artesao_id: produto.artesao_id,
      quantidade,
      preco_unitario: precoUnitario,
      subtotal,
    })

  if (itemError) {
    redirect(`/casa-artesao/caixa?message=${encodeURIComponent(itemError.message)}`)
  }

  const novaQuantidade = Number(produto.quantidade) - quantidade

  const { error: estoqueError } = await supabase
    .from('casa_artesao_produtos')
    .update({
      quantidade: novaQuantidade,
    })
    .eq('id', produto.id)

  if (estoqueError) {
    redirect(`/casa-artesao/caixa?message=${encodeURIComponent(estoqueError.message)}`)
  }

  redirect('/casa-artesao/caixa?message=Venda registrada com sucesso')
}
