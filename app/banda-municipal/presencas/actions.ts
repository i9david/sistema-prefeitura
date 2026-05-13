'use server'

import { redirect } from 'next/navigation'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'

type TipoPresenca = 'ensaio' | 'apresentacao'

type Presenca = {
  id: string
  musico_id: string
  ensaio_id: string | null
  apresentacao_id: string | null
  tipo: TipoPresenca
  data: string
  status: string
  hora_registro: string
  observacao: string | null
  valor_unitario: number | null
  valor_total: number | null
  status_pagamento: string | null
}

function getRedirectBase(tipo: string, ensaioId: string, apresentacaoId: string) {
  const params = new URLSearchParams()

  if (tipo) params.set('tipo', tipo)
  if (ensaioId) params.set('ensaio_id', ensaioId)
  if (apresentacaoId) params.set('apresentacao_id', apresentacaoId)

  const query = params.toString()
  return `/banda-municipal/presencas${query ? `?${query}` : ''}`
}

function redirectComMensagem(
  tipo: string,
  ensaioId: string,
  apresentacaoId: string,
  message: string
): never {
  const base = getRedirectBase(tipo, ensaioId, apresentacaoId)
  const separador = base.includes('?') ? '&' : '?'
  redirect(`${base}${separador}message=${encodeURIComponent(message)}`)
}

function validarTipo(tipo: string): tipo is TipoPresenca {
  return tipo === 'ensaio' || tipo === 'apresentacao'
}

function validarStatus(status: string) {
  return ['presente', 'falta', 'justificado'].includes(status)
}

function validarStatusPagamento(status: string) {
  return ['pendente', 'calculado', 'pago', 'cancelado'].includes(status)
}

function normalizarValor(valor: FormDataEntryValue | null) {
  const texto = String(valor ?? '').trim().replace(',', '.')

  if (!texto) return 0

  const numero = Number(texto)

  if (!Number.isFinite(numero) || numero < 0) {
    return null
  }

  return Number(numero.toFixed(2))
}

function calcularValorTotal(status: string, valorUnitario: number) {
  return status === 'presente' ? valorUnitario : 0
}

async function buscarEvento(
  tipo: TipoPresenca,
  ensaioId: string,
  apresentacaoId: string
) {
  const supabase = await createClient()

  if (tipo === 'ensaio') {
    if (!ensaioId) return null

    const { data, error } = await supabase
      .from('banda_municipal_ensaios')
      .select('id, titulo, data_ensaio')
      .eq('id', ensaioId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) return null

    return {
      id: data.id as string,
      data: data.data_ensaio as string,
      titulo: data.titulo as string,
    }
  }

  if (!apresentacaoId) return null

  const { data, error } = await supabase
    .from('banda_municipal_apresentacoes')
    .select('id, titulo, data_apresentacao')
    .eq('id', apresentacaoId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return {
    id: data.id as string,
    data: data.data_apresentacao as string,
    titulo: data.titulo as string,
  }
}

export async function listarPresencasPorEvento(
  tipo: TipoPresenca,
  eventoId: string
) {
  const supabase = await createClient()
  const colunaEvento = tipo === 'ensaio' ? 'ensaio_id' : 'apresentacao_id'

  const { data, error } = await supabase
    .from('banda_municipal_presencas')
    .select('*')
    .eq('tipo', tipo)
    .eq(colunaEvento, eventoId)
    .order('hora_registro', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Presenca[]
}

export async function registrarPresencas(formData: FormData) {
  const supabase = await createClient()

  const tipoRaw = String(formData.get('tipo') ?? '').trim()
  const ensaioId = String(formData.get('ensaio_id') ?? '').trim()
  const apresentacaoId = String(formData.get('apresentacao_id') ?? '').trim()

  if (!validarTipo(tipoRaw)) {
    redirectComMensagem(tipoRaw, ensaioId, apresentacaoId, 'Tipo de presença inválido')
  }

  const tipo = tipoRaw
  let evento: Awaited<ReturnType<typeof buscarEvento>>

  try {
    evento = await buscarEvento(tipo, ensaioId, apresentacaoId)
  } catch (error) {
    redirectComMensagem(
      tipo,
      ensaioId,
      apresentacaoId,
      error instanceof Error ? error.message : 'Erro ao buscar evento'
    )
  }

  if (!evento) {
    redirectComMensagem(tipo, ensaioId, apresentacaoId, 'Evento não encontrado')
  }

  const { data: musicos, error: musicosError } = await supabase
    .from('banda_municipal_musicos')
    .select('id')
    .eq('status', 'ativo')

  if (musicosError) {
    redirectComMensagem(tipo, ensaioId, apresentacaoId, musicosError.message)
  }

  const eventoId = tipo === 'ensaio' ? ensaioId : apresentacaoId
  const presencasExistentes = await listarPresencasPorEvento(tipo, eventoId)
  const presencasPorMusico = new Map<string, Presenca>()

  for (const presenca of presencasExistentes) {
    const jaExiste = presencasPorMusico.has(presenca.musico_id)

    if (jaExiste) {
      redirectComMensagem(
        tipo,
        ensaioId,
        apresentacaoId,
        'Existe presença duplicada para este evento. Verifique os dados antes de salvar.'
      )
    }

    presencasPorMusico.set(presenca.musico_id, presenca)
  }

  for (const musico of musicos ?? []) {
    const status = String(formData.get(`status_${musico.id}`) ?? '').trim()
    const observacao = String(formData.get(`observacao_${musico.id}`) ?? '').trim()
    const valorUnitario = normalizarValor(formData.get(`valor_unitario_${musico.id}`))
    const statusPagamento =
      String(formData.get(`status_pagamento_${musico.id}`) ?? '').trim() ||
      presencasPorMusico.get(musico.id)?.status_pagamento ||
      'pendente'

    if (!status) continue

    if (!validarStatus(status)) {
      redirectComMensagem(tipo, ensaioId, apresentacaoId, 'Status de presença inválido')
    }

    if (valorUnitario === null) {
      redirectComMensagem(tipo, ensaioId, apresentacaoId, 'Valor unitário inválido')
    }

    if (!validarStatusPagamento(statusPagamento)) {
      redirectComMensagem(tipo, ensaioId, apresentacaoId, 'Status de pagamento inválido')
    }

    const presencaExistente = presencasPorMusico.get(musico.id)
    const valorTotal = calcularValorTotal(status, valorUnitario)

    if (presencaExistente) {
      const { error } = await supabase
        .from('banda_municipal_presencas')
        .update({
          status,
          hora_registro: new Date().toISOString(),
          observacao: observacao || null,
          valor_unitario: valorUnitario,
          valor_total: valorTotal,
          status_pagamento: statusPagamento,
          updated_at: new Date().toISOString(),
        })
        .eq('id', presencaExistente.id)

      if (error) {
        redirectComMensagem(tipo, ensaioId, apresentacaoId, error.message)
      }

      continue
    }

    const { error } = await supabase.from('banda_municipal_presencas').insert({
      musico_id: musico.id,
      ensaio_id: tipo === 'ensaio' ? ensaioId : null,
      apresentacao_id: tipo === 'apresentacao' ? apresentacaoId : null,
      tipo,
      data: evento.data,
      status,
      hora_registro: new Date().toISOString(),
      observacao: observacao || null,
      valor_unitario: valorUnitario,
      valor_total: valorTotal,
      status_pagamento: statusPagamento,
    })

    if (error) {
      const mensagem = error.code === '23505'
        ? 'Já existe presença registrada para este músico neste evento'
        : error.message

      redirectComMensagem(tipo, ensaioId, apresentacaoId, mensagem)
    }
  }

  redirectComMensagem(tipo, ensaioId, apresentacaoId, 'Presenças salvas com sucesso')
}

export async function editarPresenca(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') ?? '').trim()
  const tipo = String(formData.get('tipo') ?? '').trim()
  const ensaioId = String(formData.get('ensaio_id') ?? '').trim()
  const apresentacaoId = String(formData.get('apresentacao_id') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim()
  const observacao = String(formData.get('observacao') ?? '').trim()
  const valorUnitario = normalizarValor(formData.get('valor_unitario'))
  const statusPagamento = String(formData.get('status_pagamento') ?? '').trim() || 'pendente'

  if (!id) {
    redirectComMensagem(tipo, ensaioId, apresentacaoId, 'Presença não encontrada')
  }

  if (!validarStatus(status)) {
    redirectComMensagem(tipo, ensaioId, apresentacaoId, 'Status de presença inválido')
  }

  if (valorUnitario === null) {
    redirectComMensagem(tipo, ensaioId, apresentacaoId, 'Valor unitário inválido')
  }

  if (!validarStatusPagamento(statusPagamento)) {
    redirectComMensagem(tipo, ensaioId, apresentacaoId, 'Status de pagamento inválido')
  }

  const { error } = await supabase
    .from('banda_municipal_presencas')
    .update({
      status,
      observacao: observacao || null,
      valor_unitario: valorUnitario,
      valor_total: calcularValorTotal(status, valorUnitario),
      status_pagamento: statusPagamento,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    redirectComMensagem(tipo, ensaioId, apresentacaoId, error.message)
  }

  redirectComMensagem(tipo, ensaioId, apresentacaoId, 'Presença atualizada com sucesso')
}
