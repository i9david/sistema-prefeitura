'use server'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const diasSemanaMap: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
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

  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
  }).format(agora)

  const jsDayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }

  const diaSemana = diasSemanaMap[jsDayMap[weekday]]

  return { data, hora, diaSemana }
}

function horaDentroDaAula(horaAtual: string, inicio: string, fim: string) {
  return horaAtual >= inicio && horaAtual <= fim
}

export async function registrarPresencaBiometria(formData: FormData) {
  const identificadorBiometrico = String(
    formData.get('identificador_biometrico') ?? ''
  ).trim()

  if (!identificadorBiometrico) {
    redirect('/frequencia-biometria?message=Informe ou leia uma biometria')
  }

  const supabase = await createClient()
  const { data, hora, diaSemana } = agoraBrasil()

  const { data: biometria, error: biometriaError } = await supabase
    .from('aluno_biometrias')
    .select('id, aluno_id, status')
    .eq('identificador_biometrico', identificadorBiometrico)
    .eq('status', 'ativo')
    .maybeSingle()

  if (biometriaError) {
    redirect(`/frequencia-biometria?message=${encodeURIComponent(biometriaError.message)}`)
  }

  if (!biometria) {
    redirect('/frequencia-biometria?message=Biometria não encontrada')
  }

  const { data: aluno, error: alunoError } = await supabase
    .from('alunos')
    .select('id, nome, aula_id, status')
    .eq('id', biometria.aluno_id)
    .maybeSingle()

  if (alunoError) {
    redirect(`/frequencia-biometria?message=${encodeURIComponent(alunoError.message)}`)
  }

  if (!aluno || aluno.status !== 'ativo') {
    redirect('/frequencia-biometria?message=Aluno não encontrado ou inativo')
  }

  const { data: aula, error: aulaError } = await supabase
    .from('aulas')
    .select('id, nome, dia_semana, horario_inicio, horario_fim, status')
    .eq('id', aluno.aula_id)
    .maybeSingle()

  if (aulaError) {
    redirect(`/frequencia-biometria?message=${encodeURIComponent(aulaError.message)}`)
  }

  if (!aula || aula.status !== 'ativa') {
    redirect('/frequencia-biometria?message=Turma não encontrada ou inativa')
  }

  if (aula.dia_semana !== diaSemana) {
    redirect(`/frequencia-biometria?message=Hoje não é o dia da turma de ${aluno.nome}`)
  }

  if (!horaDentroDaAula(hora, aula.horario_inicio, aula.horario_fim)) {
    redirect(
      `/frequencia-biometria?message=Fora do horário da turma. Horário da turma: ${aula.horario_inicio} às ${aula.horario_fim}`
    )
  }

  const { data: frequenciaExistente, error: frequenciaExistenteError } = await supabase
    .from('frequencias')
    .select('id')
    .eq('aula_id', aula.id)
    .eq('aluno_id', aluno.id)
    .eq('data_aula', data)
    .maybeSingle()

  if (frequenciaExistenteError) {
    redirect(`/frequencia-biometria?message=${encodeURIComponent(frequenciaExistenteError.message)}`)
  }

  if (frequenciaExistente) {
    redirect(
      `/frequencia-biometria?message=Presença já registrada hoje para ${aluno.nome}&sucesso=1&aluno=${encodeURIComponent(
        aluno.nome
      )}&turma=${encodeURIComponent(aula.nome)}`
    )
  }

  const { error: insertError } = await supabase.from('frequencias').insert({
    aula_id: aula.id,
    aluno_id: aluno.id,
    data_aula: data,
    status: 'presente',
    observacoes: null,
    origem: 'biometria',
    hora_registro: hora,
  })

  if (insertError) {
    redirect(`/frequencia-biometria?message=${encodeURIComponent(insertError.message)}`)
  }

  redirect(
    `/frequencia-biometria?message=Presença registrada com sucesso&sucesso=1&aluno=${encodeURIComponent(
      aluno.nome
    )}&turma=${encodeURIComponent(aula.nome)}&hora=${encodeURIComponent(hora)}`
  )
}