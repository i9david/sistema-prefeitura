'use server'

import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from "@/components/sidebar"

function competenciaFromData(data: string) {
  const [ano, mes] = data.split('-')
  return `${mes}/${ano}`
}

export async function gerarFechamentoMensal(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const artesaoId = String(formData.get('artesao_id') ?? '').trim()
  const dataInicio = String(formData.get('data_inicio') ?? '').trim()
  const dataFim = String(formData.get('data_fim') ?? '').trim()
  const observacoes = String(formData.get('observacoes') ?? '').trim()

  if (!artesaoId) {
    redirect('/casa-artesao/fechamentos?message=Selecione o artesão')
  }

  if (!dataInicio || !dataFim) {
    redirect('/casa-artesao/fechamentos?message=Informe o período do fechamento')
  }

  const competencia = competenciaFromData(dataInicio)

  const { data: itens, error: itensError } = await supabase
    .from('casa_artesao_venda_itens')
    .select(`
      subtotal,
      comissao_valor,
      valor_repasse,
      casa_artesao_vendas!inner (
        data_venda
      )
    `)
    .eq('artesao_id', artesaoId)
    .gte('casa_artesao_vendas.data_venda', dataInicio)
    .lte('casa_artesao_vendas.data_venda', dataFim)

  if (itensError) {
    redirect(`/casa-artesao/fechamentos?message=${encodeURIComponent(itensError.message)}`)
  }

  const totalBruto = (itens ?? []).reduce(
    (acc: number, item: any) => acc + Number(item.subtotal ?? 0),
    0
  )

  const totalComissao = (itens ?? []).reduce(
    (acc: number, item: any) => acc + Number(item.comissao_valor ?? 0),
    0
  )

  const totalRepasse = (itens ?? []).reduce(
    (acc: number, item: any) => acc + Number(item.valor_repasse ?? 0),
    0
  )

  const { error } = await admin
    .from('casa_artesao_fechamentos')
    .upsert(
      {
        artesao_id: artesaoId,
        competencia,
        data_inicio: dataInicio,
        data_fim: dataFim,
        total_bruto: totalBruto,
        total_comissao: totalComissao,
        total_repasse: totalRepasse,
        status: 'fechado',
        observacoes: observacoes || null,
      },
      {
        onConflict: 'municipio_id,artesao_id,competencia',
      }
    )

  if (error) {
    redirect(`/casa-artesao/fechamentos?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/casa-artesao/fechamentos?message=Fechamento gerado com sucesso')
}

export async function marcarFechamentoComoPago(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/casa-artesao/fechamentos?message=Fechamento não encontrado')
  }

  const { error } = await admin
    .from('casa_artesao_fechamentos')
    .update({
      status: 'pago',
    })
    .eq('id', id)

  if (error) {
    redirect(`/casa-artesao/fechamentos?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/casa-artesao/fechamentos?message=Fechamento marcado como pago')
}

export async function reabrirFechamento(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/casa-artesao/fechamentos?message=Fechamento não encontrado')
  }

  const { error } = await admin
    .from('casa_artesao_fechamentos')
    .update({
      status: 'aberto',
    })
    .eq('id', id)

  if (error) {
    redirect(`/casa-artesao/fechamentos?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/casa-artesao/fechamentos?message=Fechamento reaberto')
}
