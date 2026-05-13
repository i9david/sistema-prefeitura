'use server'

import { redirect } from 'next/navigation'
import { exigirPermissaoAction } from '@/lib/seguranca-actions'

type SupabaseTenant = Awaited<ReturnType<typeof exigirPermissaoAction>>['supabase']

function normalizarTelefone(valor: string) {
  return valor.replace(/\D/g, '').slice(0, 11)
}

function nomeCompletoValido(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  return partes.length >= 2
}

function agoraBrasil() {
  const agora = new Date()

  const data = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(agora)

  const hora = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(agora)

  return { data, hora }
}

async function encerrarVisitantesExpirados(
  supabase: SupabaseTenant
) {
  const { data: visitantesAtivos, error: buscaError } = await supabase
    .from('visitantes')
    .select('id, data_visita, horario_entrada, horario_saida, status, destino')
    .eq('status', 'ativo')
    .is('horario_saida', null)

  if (buscaError) {
    throw new Error(buscaError.message)
  }

  const agora = new Date()

  for (const visitante of visitantesAtivos ?? []) {
    if (!visitante.data_visita || !visitante.horario_entrada) continue

    const entrada = new Date(`${visitante.data_visita}T${visitante.horario_entrada}`)
    const diferencaMs = agora.getTime() - entrada.getTime()
    const seisHorasMs = 6 * 60 * 60 * 1000

    if (diferencaMs >= seisHorasMs) {
      const { hora } = agoraBrasil()

      const { error: updateError } = await supabase
        .from('visitantes')
        .update({
          status: 'inativo',
          horario_saida: hora,
        })
        .eq('id', visitante.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      const { error: visitaError } = await supabase
        .from('visitante_visitas')
        .update({
          status: 'inativo',
          horario_saida: hora,
        })
        .eq('visitante_id', visitante.id)

      if (visitaError) {
        throw new Error(visitaError.message)
      }

      if (visitante.destino === 'museu') {
        await supabase
          .from('museu_visitantes')
          .update({
            status: 'inativo',
            horario_saida: hora,
          })
          .eq('visitante_id', visitante.id)
      }
    }
  }
}

async function buscarOuCriarPessoaVisitante({
  supabase,
  nome,
  telefone,
}: {
  supabase: SupabaseTenant
  nome: string
  telefone: string
}) {
  const { data: pessoas, error: erroBusca } = await supabase
    .from('pessoas')
    .select('id')
    .eq('telefone', telefone)
    .limit(1)

  if (erroBusca) {
    redirect(`/visitantes?message=${encodeURIComponent(erroBusca.message)}`)
  }

  const pessoaExistente = pessoas?.[0]

  if (pessoaExistente?.id) {
    const { error: erroAtualizacao } = await supabase
      .from('pessoas')
      .update({
        nome,
        telefone,
      })
      .eq('id', pessoaExistente.id)

    if (erroAtualizacao) {
      redirect(`/visitantes?message=${encodeURIComponent(erroAtualizacao.message)}`)
    }

    return pessoaExistente.id as string
  }

  const { data: novaPessoa, error: erroPessoa } = await supabase
    .from('pessoas')
    .insert({
      nome,
      telefone,
      data_nascimento: null,
    })
    .select('id')
    .single()

  if (erroPessoa) {
    redirect(`/visitantes?message=${encodeURIComponent(erroPessoa.message)}`)
  }

  return novaPessoa.id as string
}

export async function criarVisitante(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    'Centro Cultural',
    'Visitantes',
    'criar'
  )

  const nome = String(formData.get('nome') ?? '').trim()
  const telefoneBruto = String(formData.get('telefone') ?? '').trim()
  const telefone = normalizarTelefone(telefoneBruto)
  const destino = String(formData.get('destino') ?? 'centro-cultural').trim()
  const motivoSelect = String(formData.get('motivo_select') ?? '').trim()
  const motivoOutro = String(formData.get('motivo_outro') ?? '').trim()
  const observacoes = String(formData.get('observacoes') ?? '').trim()

  if (!nomeCompletoValido(nome)) {
    redirect('/visitantes?message=Informe nome e sobrenome do visitante')
  }

  if (telefone.length !== 11) {
    redirect('/visitantes?message=Informe um telefone com DDD e 11 dígitos')
  }

  if (!motivoSelect) {
    redirect('/visitantes?message=Selecione o motivo da visita')
  }

  if (motivoSelect === 'outros' && !motivoOutro) {
    redirect('/visitantes?message=Informe o motivo da visita em Outros')
  }

  const motivo = motivoSelect === 'outros' ? motivoOutro : motivoSelect

  try {
    await encerrarVisitantesExpirados(supabase)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao atualizar visitantes expirados'
    redirect(`/visitantes?message=${encodeURIComponent(msg)}`)
  }

  const { data, hora } = agoraBrasil()
  const pessoaId = await buscarOuCriarPessoaVisitante({
    supabase,
    nome,
    telefone,
  })

  const { data: visitanteCriado, error } = await supabase
    .from('visitantes')
    .insert({
      nome,
      telefone,
      motivo,
      observacoes: observacoes || null,
      data_visita: data,
      horario_entrada: hora,
      horario_saida: null,
      status: 'ativo',
      origem: 'recepcao',
      destino,
      pessoa_id: pessoaId,
    })
    .select('id, nome, telefone, data_visita, horario_entrada, horario_saida, status, observacoes')
    .single()

  if (error) {
    redirect(`/visitantes?message=${encodeURIComponent(error.message)}`)
  }

  const { error: visitaError } = await supabase.from('visitante_visitas').insert({
    pessoa_id: pessoaId,
    visitante_id: visitanteCriado.id,
    destino,
    motivo,
    data_visita: data,
    horario_entrada: hora,
    horario_saida: null,
    status: 'ativo',
    origem: 'recepcao',
    observacoes: observacoes || null,
  })

  if (visitaError) {
    await supabase
      .from('visitantes')
      .update({
        status: 'inativo',
        horario_saida: hora,
        observacoes:
          observacoes ||
          'Registro encerrado automaticamente porque o histórico CRM não foi criado.',
      })
      .eq('id', visitanteCriado.id)

    redirect(`/visitantes?message=${encodeURIComponent(visitaError.message)}`)
  }

  if (destino === 'museu' && visitanteCriado) {
    const { error: museuError } = await supabase.from('museu_visitantes').insert({
      visitante_id: visitanteCriado.id,
      nome: visitanteCriado.nome,
      telefone: visitanteCriado.telefone,
      data_visita: visitanteCriado.data_visita,
      horario_entrada: visitanteCriado.horario_entrada,
      horario_saida: visitanteCriado.horario_saida,
      status: visitanteCriado.status,
      observacoes: visitanteCriado.observacoes,
    })

    if (museuError) {
      redirect(`/visitantes?message=${encodeURIComponent(museuError.message)}`)
    }
  }

  redirect('/visitantes?message=Visitante registrado com sucesso')
}

export async function encerrarVisitante(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    'Centro Cultural',
    'Visitantes',
    'editar'
  )

  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/visitantes?message=Visitante não encontrado')
  }

  const { hora } = agoraBrasil()

  const { data: visitante, error: visitanteError } = await supabase
    .from('visitantes')
    .select('id, destino')
    .eq('id', id)
    .maybeSingle()

  if (visitanteError || !visitante) {
    redirect('/visitantes?message=Visitante não encontrado')
  }

  const { error } = await supabase
    .from('visitantes')
    .update({
      status: 'inativo',
      horario_saida: hora,
    })
    .eq('id', id)

  if (error) {
    redirect(`/visitantes?message=${encodeURIComponent(error.message)}`)
  }

  const { error: visitaError } = await supabase
    .from('visitante_visitas')
    .update({
      status: 'inativo',
      horario_saida: hora,
    })
    .eq('visitante_id', id)

  if (visitaError) {
    redirect(`/visitantes?message=${encodeURIComponent(visitaError.message)}`)
  }

  if (visitante.destino === 'museu') {
    await supabase
      .from('museu_visitantes')
      .update({
        status: 'inativo',
        horario_saida: hora,
      })
      .eq('visitante_id', id)
  }

  redirect('/visitantes?message=Visita encerrada com sucesso')
}
