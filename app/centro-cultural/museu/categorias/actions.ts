'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'

export async function criarCategoriaMuseu(formData: FormData) {
  const supabase = await createClient()

  const nome = String(formData.get('nome') ?? '').trim()
  const descricao = String(formData.get('descricao') ?? '').trim()
  const status = String(formData.get('status') ?? 'ativa').trim()

  if (!nome) {
    redirect('/centro-cultural/museu/categorias?message=Informe o nome da categoria')
  }

  const { error } = await supabase.from('museu_categorias').insert({
    nome,
    descricao: descricao || null,
    status: status || 'ativa',
  })

  if (error) {
    redirect(`/centro-cultural/museu/categorias?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/centro-cultural/museu/categorias?message=Categoria cadastrada com sucesso')
}

export async function atualizarCategoriaMuseu(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') ?? '').trim()
  const nome = String(formData.get('nome') ?? '').trim()
  const descricao = String(formData.get('descricao') ?? '').trim()
  const status = String(formData.get('status') ?? 'ativa').trim()

  if (!id) {
    redirect('/centro-cultural/museu/categorias?message=Categoria não encontrada')
  }

  if (!nome) {
    redirect('/centro-cultural/museu/categorias?message=Informe o nome da categoria')
  }

  if (status === 'inativa') {
    const { count, error: countError } = await supabase
      .from('museu_acervo')
      .select('id', { count: 'exact', head: true })
      .eq('categoria_id', id)

    if (countError) {
      redirect(`/centro-cultural/museu/categorias?message=${encodeURIComponent(countError.message)}`)
    }

    if ((count ?? 0) > 0) {
      redirect('/centro-cultural/museu/categorias?message=Não é possível inativar uma categoria que já está vinculada a peças do acervo')
    }
  }

  const { error } = await supabase
    .from('museu_categorias')
    .update({
      nome,
      descricao: descricao || null,
      status: status || 'ativa',
    })
    .eq('id', id)

  if (error) {
    redirect(`/centro-cultural/museu/categorias?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/centro-cultural/museu/categorias?message=Categoria atualizada com sucesso')
}

export async function ativarCategoriaMuseu(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/centro-cultural/museu/categorias?message=Categoria não encontrada')
  }

  const { error } = await supabase
    .from('museu_categorias')
    .update({ status: 'ativa' })
    .eq('id', id)

  if (error) {
    redirect(`/centro-cultural/museu/categorias?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/centro-cultural/museu/categorias?message=Categoria ativada com sucesso')
}

export async function inativarCategoriaMuseu(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/centro-cultural/museu/categorias?message=Categoria não encontrada')
  }

  const { count, error: countError } = await supabase
    .from('museu_acervo')
    .select('id', { count: 'exact', head: true })
    .eq('categoria_id', id)

  if (countError) {
    redirect(`/centro-cultural/museu/categorias?message=${encodeURIComponent(countError.message)}`)
  }

  if ((count ?? 0) > 0) {
    redirect('/centro-cultural/museu/categorias?message=Não é possível inativar uma categoria que já está vinculada a peças do acervo')
  }

  const { error } = await supabase
    .from('museu_categorias')
    .update({ status: 'inativa' })
    .eq('id', id)

  if (error) {
    redirect(`/centro-cultural/museu/categorias?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/centro-cultural/museu/categorias?message=Categoria inativada com sucesso')
}