'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'

function normalizarStatusOperacional(valor: string) {
  const status = valor.trim()

  const permitidos = [
    'em_exposicao',
    'em_reserva',
    'em_manutencao',
    'em_restauracao',
    'emprestada',
    'indisponivel',
  ]

  if (!permitidos.includes(status)) return ''
  return status
}

export async function criarMovimentacaoMuseu(formData: FormData) {
  const supabase = await createClient()

  const acervoId = String(formData.get('acervo_id') ?? '').trim()
  const tipo = String(formData.get('tipo') ?? '').trim()
  const descricao = String(formData.get('descricao') ?? '').trim()
  const dataMovimentacao = String(formData.get('data_movimentacao') ?? '').trim()
  const responsavel = String(formData.get('responsavel') ?? '').trim()
  const novaLocalizacao = String(formData.get('nova_localizacao') ?? '').trim()
  const novoStatusOperacional = normalizarStatusOperacional(
    String(formData.get('novo_status_operacional') ?? '')
  )

  if (!acervoId) {
    redirect('/centro-cultural/museu/movimentacoes?message=Selecione a peça do acervo')
  }

  if (!tipo) {
    redirect('/centro-cultural/museu/movimentacoes?message=Selecione o tipo da movimentação')
  }

  if (!dataMovimentacao) {
    redirect('/centro-cultural/museu/movimentacoes?message=Informe a data da movimentação')
  }

  const { error } = await supabase.from('museu_movimentacoes').insert({
    acervo_id: acervoId,
    tipo,
    descricao: descricao || null,
    data_movimentacao: dataMovimentacao,
    responsavel: responsavel || null,
    nova_localizacao: novaLocalizacao || null,
    novo_status_operacional: novoStatusOperacional || null,
  })

  if (error) {
    redirect(`/centro-cultural/museu/movimentacoes?message=${encodeURIComponent(error.message)}`)
  }

  const updatePayload: Record<string, string | null> = {}

  if (novaLocalizacao) {
    updatePayload.localizacao_atual = novaLocalizacao
    updatePayload.localizacao = novaLocalizacao
  }

  if (novoStatusOperacional) {
    updatePayload.status_operacional = novoStatusOperacional
  }

  if (Object.keys(updatePayload).length > 0) {
    const { error: updateError } = await supabase
      .from('museu_acervo')
      .update(updatePayload)
      .eq('id', acervoId)

    if (updateError) {
      redirect(`/centro-cultural/museu/movimentacoes?message=${encodeURIComponent(updateError.message)}`)
    }
  }

  redirect('/centro-cultural/museu/movimentacoes?message=Movimentação cadastrada com sucesso')
}

export async function atualizarMovimentacaoMuseu(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') ?? '').trim()
  const acervoId = String(formData.get('acervo_id') ?? '').trim()
  const tipo = String(formData.get('tipo') ?? '').trim()
  const descricao = String(formData.get('descricao') ?? '').trim()
  const dataMovimentacao = String(formData.get('data_movimentacao') ?? '').trim()
  const responsavel = String(formData.get('responsavel') ?? '').trim()
  const novaLocalizacao = String(formData.get('nova_localizacao') ?? '').trim()
  const novoStatusOperacional = normalizarStatusOperacional(
    String(formData.get('novo_status_operacional') ?? '')
  )

  if (!id) {
    redirect('/centro-cultural/museu/movimentacoes?message=Movimentação não encontrada')
  }

  if (!acervoId) {
    redirect('/centro-cultural/museu/movimentacoes?message=Selecione a peça do acervo')
  }

  if (!tipo) {
    redirect('/centro-cultural/museu/movimentacoes?message=Selecione o tipo da movimentação')
  }

  if (!dataMovimentacao) {
    redirect('/centro-cultural/museu/movimentacoes?message=Informe a data da movimentação')
  }

  const { error } = await supabase
    .from('museu_movimentacoes')
    .update({
      acervo_id: acervoId,
      tipo,
      descricao: descricao || null,
      data_movimentacao: dataMovimentacao,
      responsavel: responsavel || null,
      nova_localizacao: novaLocalizacao || null,
      novo_status_operacional: novoStatusOperacional || null,
    })
    .eq('id', id)

  if (error) {
    redirect(`/centro-cultural/museu/movimentacoes?message=${encodeURIComponent(error.message)}`)
  }

  const updatePayload: Record<string, string | null> = {}

  if (novaLocalizacao) {
    updatePayload.localizacao_atual = novaLocalizacao
    updatePayload.localizacao = novaLocalizacao
  }

  if (novoStatusOperacional) {
    updatePayload.status_operacional = novoStatusOperacional
  }

  if (Object.keys(updatePayload).length > 0) {
    const { error: updateError } = await supabase
      .from('museu_acervo')
      .update(updatePayload)
      .eq('id', acervoId)

    if (updateError) {
      redirect(`/centro-cultural/museu/movimentacoes?message=${encodeURIComponent(updateError.message)}`)
    }
  }

  redirect('/centro-cultural/museu/movimentacoes?message=Movimentação atualizada com sucesso')
}

export async function excluirMovimentacaoMuseu(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/centro-cultural/museu/movimentacoes?message=Movimentação não encontrada')
  }

  const { error } = await supabase
    .from('museu_movimentacoes')
    .delete()
    .eq('id', id)

  if (error) {
    redirect(`/centro-cultural/museu/movimentacoes?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/centro-cultural/museu/movimentacoes?message=Movimentação excluída com sucesso')
}