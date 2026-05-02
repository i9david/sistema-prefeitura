'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"

function normalizarTelefone(valor: string) {
  return valor.replace(/\D/g, '').slice(0, 11)
}

function nomeCompletoValido(nome: string) {
  return nome.trim().split(/\s+/).filter(Boolean).length >= 2
}

export async function registrarVenda(formData: FormData) {
  const supabase = await createClient()

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

  const { error } = await supabase.rpc('registrar_venda_completa', {
    p_cliente_nome: clienteNome,
    p_cliente_telefone: clienteTelefone,
    p_cliente_data_nascimento: clienteDataNascimento,
    p_produtos: produtos,
  })

  if (error) {
    redirect(`/casa-artesao/caixa?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/casa-artesao/caixa?message=Venda registrada com sucesso')
}