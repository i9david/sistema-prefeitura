'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function criarInstrumento(formData: FormData) {
  const supabase = await createClient()

  const nome = String(formData.get('nome') ?? '').trim()
  const tipo = String(formData.get('tipo') ?? '').trim()
  const marca = String(formData.get('marca') ?? '').trim()
  const modelo = String(formData.get('modelo') ?? '').trim()
  const numeroPatrimonio = String(formData.get('numero_patrimonio') ?? '').trim()
  const numeroSerie = String(formData.get('numero_serie') ?? '').trim()
  const estadoConservacao = String(formData.get('estado_conservacao') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim()
  const musicoId = String(formData.get('musico_id') ?? '').trim()
  const dataAquisicao = String(formData.get('data_aquisicao') ?? '').trim()
  const observacoes = String(formData.get('observacoes') ?? '').trim()

  if (!nome) {
    redirect('/banda-municipal/instrumentos?message=Informe o nome do instrumento')
  }

  if (!tipo) {
    redirect('/banda-municipal/instrumentos?message=Informe o tipo do instrumento')
  }

  if (!estadoConservacao) {
    redirect('/banda-municipal/instrumentos?message=Informe o estado de conservação')
  }

  if (!status) {
    redirect('/banda-municipal/instrumentos?message=Informe o status do instrumento')
  }

  const { error } = await supabase.from('banda_municipal_instrumentos').insert({
    nome,
    tipo,
    marca: marca || null,
    modelo: modelo || null,
    numero_patrimonio: numeroPatrimonio || null,
    numero_serie: numeroSerie || null,
    estado_conservacao: estadoConservacao,
    status,
    musico_id: musicoId || null,
    data_aquisicao: dataAquisicao || null,
    observacoes: observacoes || null,
  })

  if (error) {
    redirect(`/banda-municipal/instrumentos?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/banda-municipal/instrumentos?message=Instrumento cadastrado com sucesso')
}

export async function atualizarInstrumento(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') ?? '').trim()
  const nome = String(formData.get('nome') ?? '').trim()
  const tipo = String(formData.get('tipo') ?? '').trim()
  const marca = String(formData.get('marca') ?? '').trim()
  const modelo = String(formData.get('modelo') ?? '').trim()
  const numeroPatrimonio = String(formData.get('numero_patrimonio') ?? '').trim()
  const numeroSerie = String(formData.get('numero_serie') ?? '').trim()
  const estadoConservacao = String(formData.get('estado_conservacao') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim()
  const musicoId = String(formData.get('musico_id') ?? '').trim()
  const dataAquisicao = String(formData.get('data_aquisicao') ?? '').trim()
  const observacoes = String(formData.get('observacoes') ?? '').trim()

  if (!id) {
    redirect('/banda-municipal/instrumentos?message=Instrumento não encontrado')
  }

  if (!nome) {
    redirect('/banda-municipal/instrumentos?message=Informe o nome do instrumento')
  }

  if (!tipo) {
    redirect('/banda-municipal/instrumentos?message=Informe o tipo do instrumento')
  }

  if (!estadoConservacao) {
    redirect('/banda-municipal/instrumentos?message=Informe o estado de conservação')
  }

  if (!status) {
    redirect('/banda-municipal/instrumentos?message=Informe o status do instrumento')
  }

  const { error } = await supabase
    .from('banda_municipal_instrumentos')
    .update({
      nome,
      tipo,
      marca: marca || null,
      modelo: modelo || null,
      numero_patrimonio: numeroPatrimonio || null,
      numero_serie: numeroSerie || null,
      estado_conservacao: estadoConservacao,
      status,
      musico_id: musicoId || null,
      data_aquisicao: dataAquisicao || null,
      observacoes: observacoes || null,
    })
    .eq('id', id)

  if (error) {
    redirect(`/banda-municipal/instrumentos?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/banda-municipal/instrumentos?message=Instrumento atualizado com sucesso')
}