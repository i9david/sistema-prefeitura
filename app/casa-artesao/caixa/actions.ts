'use server'

import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

type ProdutoVenda = {
  id: string
  nome: string
  preco: number | null
  quantidade: number | null
  artesao_id: string
  status: string | null
}

function normalizarTelefone(valor: string) {
  return valor.replace(/\D/g, '').slice(0, 11)
}

function nomeCompletoValido(nome: string) {
  return nome.trim().split(/\s+/).filter(Boolean).length >= 2
}

function hojeBrasil() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function arredondarMoeda(valor: number) {
  return Number(valor.toFixed(2))
}

export async function registrarVenda(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const clienteNome = String(formData.get('cliente_nome') ?? '').trim()
  const clienteTelefone = normalizarTelefone(
    String(formData.get('cliente_telefone') ?? '').trim()
  )
  const clienteDataNascimento = String(
    formData.get('cliente_data_nascimento') ?? ''
  ).trim()

  if (!nomeCompletoValido(clienteNome)) {
    redirect('/casa-artesao/caixa?message=Informe o nome completo do comprador')
  }

  if (clienteTelefone.length !== 11) {
    redirect('/casa-artesao/caixa?message=Informe um telefone com DDD e 11 dígitos')
  }

  if (!clienteDataNascimento) {
    redirect('/casa-artesao/caixa?message=Informe a data de nascimento do comprador')
  }

  const produtoIds = formData.getAll('produto_id')
  const quantidades = formData.getAll('quantidade')

  const produtos: Array<{ produto_id: string; quantidade: number }> = []

  for (let i = 0; i < produtoIds.length; i++) {
    const produtoId = String(produtoIds[i] ?? '').trim()
    const quantidade = Number(quantidades[i] ?? 0)

    if (!produtoId) continue
    if (!Number.isInteger(quantidade) || quantidade <= 0) continue

    produtos.push({
      produto_id: produtoId,
      quantidade,
    })
  }

  if (produtos.length === 0) {
    redirect('/casa-artesao/caixa?message=Adicione pelo menos um item válido na venda')
  }

  const produtoIdsUnicos = Array.from(
    new Set(produtos.map((produto) => produto.produto_id))
  )

  const [{ data: produtosData, error: produtosError }, { data: configuracaoData }] =
    await Promise.all([
      supabase
        .from('casa_artesao_produtos')
        .select('id, nome, preco, quantidade, artesao_id, status')
        .in('id', produtoIdsUnicos),
      supabase
        .from('casa_artesao_configuracoes')
        .select('percentual_comissao_padrao')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

  if (produtosError) {
    redirect(`/casa-artesao/caixa?message=${encodeURIComponent(produtosError.message)}`)
  }

  const produtosBanco = new Map(
    ((produtosData ?? []) as ProdutoVenda[]).map((produto) => [produto.id, produto])
  )

  const percentualComissao = Number(
    configuracaoData?.percentual_comissao_padrao ?? 0
  )

  const quantidadesPorProduto = new Map<string, number>()

  for (const item of produtos) {
    quantidadesPorProduto.set(
      item.produto_id,
      (quantidadesPorProduto.get(item.produto_id) ?? 0) + item.quantidade
    )
  }

  for (const [produtoId, quantidade] of quantidadesPorProduto.entries()) {
    const produto = produtosBanco.get(produtoId)

    if (!produto) {
      redirect('/casa-artesao/caixa?message=Produto não encontrado')
    }

    if (produto.status !== 'ativo') {
      redirect(
        `/casa-artesao/caixa?message=${encodeURIComponent(
          `Produto inativo não pode ser vendido: ${produto.nome}`
        )}`
      )
    }

    if (Number(produto.quantidade ?? 0) < quantidade) {
      redirect(
        `/casa-artesao/caixa?message=${encodeURIComponent(
          `Estoque insuficiente para ${produto.nome}`
        )}`
      )
    }
  }

  const itensVenda = Array.from(quantidadesPorProduto.entries()).map(
    ([produtoId, quantidade]) => {
      const produto = produtosBanco.get(produtoId)!
      const precoUnitario = Number(produto.preco ?? 0)
      const subtotal = arredondarMoeda(precoUnitario * quantidade)
      const comissaoValor = arredondarMoeda(subtotal * (percentualComissao / 100))

      return {
        produto,
        quantidade,
        precoUnitario,
        subtotal,
        comissaoValor,
        valorRepasse: arredondarMoeda(subtotal - comissaoValor),
      }
    }
  )

  const valorTotal = arredondarMoeda(
    itensVenda.reduce((total, item) => total + item.subtotal, 0)
  )

  const { data: venda, error: vendaError } = await admin
    .from('casa_artesao_vendas')
    .insert({
      data_venda: hojeBrasil(),
      valor_total: valorTotal,
      observacoes: [
        `Comprador: ${clienteNome}`,
        `Telefone: ${clienteTelefone}`,
        `Nascimento: ${clienteDataNascimento}`,
      ].join(' | '),
    })
    .select('id')
    .single()

  if (vendaError || !venda) {
    redirect(
      `/casa-artesao/caixa?message=${encodeURIComponent(
        vendaError?.message ?? 'Não foi possível registrar a venda'
      )}`
    )
  }

  const { error: itensError } = await admin
    .from('casa_artesao_venda_itens')
    .insert(
      itensVenda.map((item) => ({
        venda_id: venda.id,
        produto_id: item.produto.id,
        artesao_id: item.produto.artesao_id,
        quantidade: item.quantidade,
        preco_unitario: item.precoUnitario,
        subtotal: item.subtotal,
        comissao_valor: item.comissaoValor,
        valor_repasse: item.valorRepasse,
      }))
    )

  if (itensError) {
    await admin.from('casa_artesao_vendas').delete().eq('id', venda.id)
    redirect(`/casa-artesao/caixa?message=${encodeURIComponent(itensError.message)}`)
  }

  const estoquesAtualizados: Array<{ id: string; quantidade: number }> = []

  for (const item of itensVenda) {
    const quantidadeAnterior = Number(item.produto.quantidade ?? 0)
    const { error: estoqueError } = await admin
      .from('casa_artesao_produtos')
      .update({
        quantidade: quantidadeAnterior - item.quantidade,
      })
      .eq('id', item.produto.id)

    if (estoqueError) {
      await Promise.all(
        estoquesAtualizados.map((produto) =>
          admin
            .from('casa_artesao_produtos')
            .update({ quantidade: produto.quantidade })
            .eq('id', produto.id)
        )
      )
      await admin.from('casa_artesao_venda_itens').delete().eq('venda_id', venda.id)
      await admin.from('casa_artesao_vendas').delete().eq('id', venda.id)
      redirect(`/casa-artesao/caixa?message=${encodeURIComponent(estoqueError.message)}`)
    }

    estoquesAtualizados.push({
      id: item.produto.id,
      quantidade: quantidadeAnterior,
    })
  }

  redirect('/casa-artesao/caixa?message=Venda registrada com sucesso')
}
