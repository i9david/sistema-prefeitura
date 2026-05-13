'use server'

import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from "@/components/sidebar"

export async function criarProduto(formData: FormData) {
  const supabase = await createClient()

  const nome = String(formData.get('nome') || '').trim()
  const descricao = String(formData.get('descricao') || '').trim()
  const preco = Number(formData.get('preco') || 0)
  const quantidade = Number(formData.get('quantidade') || 0)
  const artesao_id = String(formData.get('artesao_id') || '').trim()
  const status = String(formData.get('status') || 'ativo').trim()

  if (!nome || !preco || !artesao_id) {
    redirect('/casa-artesao/produtos?message=Preencha os campos obrigatórios')
  }

  const { error } = await supabase.from('casa_artesao_produtos').insert({
    nome,
    descricao: descricao || null,
    preco,
    quantidade,
    artesao_id,
    status,
  })

  if (error) {
    redirect(`/casa-artesao/produtos?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/casa-artesao/produtos?message=Produto criado com sucesso')
}

export async function atualizarProduto(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') || '').trim()
  const nome = String(formData.get('nome') || '').trim()
  const descricao = String(formData.get('descricao') || '').trim()
  const preco = Number(formData.get('preco') || 0)
  const quantidade = Number(formData.get('quantidade') || 0)
  const artesao_id = String(formData.get('artesao_id') || '').trim()
  const status = String(formData.get('status') || 'ativo').trim()

  if (!id) {
    redirect('/casa-artesao/produtos?message=Produto não encontrado')
  }

  if (!nome || !preco || !artesao_id) {
    redirect('/casa-artesao/produtos?message=Preencha os campos obrigatórios')
  }

  const { error } = await supabase
    .from('casa_artesao_produtos')
    .update({
      nome,
      descricao: descricao || null,
      preco,
      quantidade,
      artesao_id,
      status,
    })
    .eq('id', id)

  if (error) {
    redirect(`/casa-artesao/produtos?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/casa-artesao/produtos?message=Produto atualizado')
}

export async function inativarProduto(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id') || '').trim()

  if (!id) {
    redirect('/casa-artesao/produtos?message=Produto não encontrado')
  }

  const { error } = await supabase
    .from('casa_artesao_produtos')
    .update({ status: 'inativo' })
    .eq('id', id)

  if (error) {
    redirect(`/casa-artesao/produtos?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/casa-artesao/produtos?message=Produto inativado')
}
