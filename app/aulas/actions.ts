'use server'

import { redirect } from 'next/navigation'
import { exigirPermissaoAction } from '@/lib/seguranca-actions'
import { createAdminClient } from '@/lib/supabase/admin'

type SupabaseTenant = Awaited<ReturnType<typeof exigirPermissaoAction>>['supabase']

type Relacao<T> = T | T[] | null

type MatriculaImpactada = {
  aluno_id: string
  data_inicio: string
  data_fim: string | null
}

type AulaRelacionada = {
  id: string
  status: string
  dia_semana: string
  horario_inicio: string
  horario_fim: string
}

type OutraMatriculaAtiva = {
  aluno_id: string
  modalidade_id: string
  data_inicio: string
  data_fim: string | null
  aulas: Relacao<AulaRelacionada>
}

function normalizarHora(valor: string) {
  return valor?.trim() || ''
}

function normalizarRelacao<T>(relacao: Relacao<T>) {
  if (!relacao) return null
  if (Array.isArray(relacao)) return relacao[0] ?? null
  return relacao
}

function periodosSeSobrepoem({
  inicioAtual,
  fimAtual,
  novoInicio,
  novoFim,
}: {
  inicioAtual: string
  fimAtual: string | null
  novoInicio: string
  novoFim: string | null
}) {
  const fimAtualNormalizado = fimAtual ?? '9999-12-31'
  const novoFimNormalizado = novoFim ?? '9999-12-31'

  return inicioAtual <= novoFimNormalizado && fimAtualNormalizado >= novoInicio
}

function horariosSeSobrepoem({
  inicioAtual,
  fimAtual,
  novoInicio,
  novoFim,
}: {
  inicioAtual: string
  fimAtual: string
  novoInicio: string
  novoFim: string
}) {
  return inicioAtual < novoFim && fimAtual > novoInicio
}

async function validarImpactoMatriculasAtivas({
  supabase,
  aulaId,
  modalidadeId,
  diaSemana,
  horarioInicio,
  horarioFim,
}: {
  supabase: SupabaseTenant
  aulaId: string
  modalidadeId: string
  diaSemana: string
  horarioInicio: string
  horarioFim: string
}) {
  const { data: matriculasImpactadas, error: erroMatriculasImpactadas } =
    await supabase
      .from('aluno_matriculas')
      .select('aluno_id, data_inicio, data_fim')
      .eq('aula_id', aulaId)
      .eq('status', 'ativo')

  if (erroMatriculasImpactadas) {
    redirect(`/aulas?message=${encodeURIComponent(erroMatriculasImpactadas.message)}`)
  }

  const matriculas = (matriculasImpactadas ?? []) as MatriculaImpactada[]

  if (matriculas.length === 0) return

  const alunoIds = Array.from(new Set(matriculas.map((matricula) => matricula.aluno_id)))

  const { data: outrasMatriculasData, error: erroOutrasMatriculas } = await supabase
    .from('aluno_matriculas')
    .select(`
      aluno_id,
      modalidade_id,
      data_inicio,
      data_fim,
      aulas:aula_id!aluno_matriculas_aula_id_fkey (
        id,
        status,
        dia_semana,
        horario_inicio,
        horario_fim
      )
    `)
    .in('aluno_id', alunoIds)
    .neq('aula_id', aulaId)
    .eq('status', 'ativo')

  if (erroOutrasMatriculas) {
    redirect(`/aulas?message=${encodeURIComponent(erroOutrasMatriculas.message)}`)
  }

  const outrasMatriculas = (outrasMatriculasData ?? []) as unknown as OutraMatriculaAtiva[]

  const temConflitoModalidade = matriculas.some((matricula) =>
    outrasMatriculas.some(
      (outraMatricula) =>
        outraMatricula.aluno_id === matricula.aluno_id &&
        outraMatricula.modalidade_id === modalidadeId &&
        periodosSeSobrepoem({
          inicioAtual: matricula.data_inicio,
          fimAtual: matricula.data_fim,
          novoInicio: outraMatricula.data_inicio,
          novoFim: outraMatricula.data_fim,
        })
    )
  )

  if (temConflitoModalidade) {
    redirect(
      '/aulas?message=Alteracao invalida: aluno ja possui matricula ativa nesta modalidade'
    )
  }

  const temConflitoHorario = matriculas.some((matricula) =>
    outrasMatriculas.some((outraMatricula) => {
      const outraAula = normalizarRelacao(outraMatricula.aulas)

      return Boolean(
        outraMatricula.aluno_id === matricula.aluno_id &&
          outraAula &&
          outraAula.status === 'ativa' &&
          outraAula.dia_semana === diaSemana &&
          periodosSeSobrepoem({
            inicioAtual: matricula.data_inicio,
            fimAtual: matricula.data_fim,
            novoInicio: outraMatricula.data_inicio,
            novoFim: outraMatricula.data_fim,
          }) &&
          horariosSeSobrepoem({
            inicioAtual: outraAula.horario_inicio,
            fimAtual: outraAula.horario_fim,
            novoInicio: horarioInicio,
            novoFim: horarioFim,
          })
      )
    })
  )

  if (temConflitoHorario) {
    redirect('/aulas?message=Alteracao invalida: conflito de horario com outra aula')
  }
}

export async function criarAula(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    'Centro Cultural',
    'Aulas',
    'criar'
  )
  const admin = createAdminClient()

  const nome = String(formData.get('nome') ?? '').trim()
  const modalidadeId = String(formData.get('modalidade_id') ?? '').trim()
  const diaSemana = String(formData.get('dia_semana') ?? '').trim()
  const horarioInicio = normalizarHora(String(formData.get('horario_inicio') ?? ''))
  const horarioFim = normalizarHora(String(formData.get('horario_fim') ?? ''))
  const status = String(formData.get('status') ?? 'ativa').trim()

  if (
    !nome ||
    !modalidadeId ||
    !diaSemana ||
    !horarioInicio ||
    !horarioFim ||
    !status
  ) {
    redirect('/aulas?novo=1&message=Preencha todos os campos obrigatorios')
  }

  if (horarioInicio >= horarioFim) {
    redirect('/aulas?novo=1&message=Horario de inicio deve ser menor que horario de fim')
  }

  const { error } = await admin.from('aulas').insert({
    nome,
    modalidade_id: modalidadeId,
    dia_semana: diaSemana,
    horario_inicio: horarioInicio,
    horario_fim: horarioFim,
    status,
  })

  if (error) {
    redirect(`/aulas?novo=1&message=${encodeURIComponent(error.message)}`)
  }

  redirect('/aulas?message=Aula cadastrada com sucesso')
}

export async function atualizarAula(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    'Centro Cultural',
    'Aulas',
    'editar'
  )
  const admin = createAdminClient()

  const id = String(formData.get('id') ?? '').trim()
  const nome = String(formData.get('nome') ?? '').trim()
  const modalidadeId = String(formData.get('modalidade_id') ?? '').trim()
  const diaSemana = String(formData.get('dia_semana') ?? '').trim()
  const horarioInicio = normalizarHora(String(formData.get('horario_inicio') ?? ''))
  const horarioFim = normalizarHora(String(formData.get('horario_fim') ?? ''))
  const status = String(formData.get('status') ?? 'ativa').trim()

  if (
    !id ||
    !nome ||
    !modalidadeId ||
    !diaSemana ||
    !horarioInicio ||
    !horarioFim ||
    !status
  ) {
    redirect('/aulas?message=Preencha todos os campos obrigatorios')
  }

  if (horarioInicio >= horarioFim) {
    redirect('/aulas?message=Horario de inicio deve ser menor que horario de fim')
  }

  await validarImpactoMatriculasAtivas({
    supabase,
    aulaId: id,
    modalidadeId,
    diaSemana,
    horarioInicio,
    horarioFim,
  })

  const { error } = await admin
    .from('aulas')
    .update({
      nome,
      modalidade_id: modalidadeId,
      dia_semana: diaSemana,
      horario_inicio: horarioInicio,
      horario_fim: horarioFim,
      status,
    })
    .eq('id', id)

  if (error) {
    redirect(`/aulas?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/aulas?message=Aula atualizada com sucesso')
}

export async function inativarAula(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    'Centro Cultural',
    'Aulas',
    'excluir'
  )
  const admin = createAdminClient()

  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/aulas?message=Aula nao encontrada')
  }

  const { error } = await admin
    .from('aulas')
    .update({ status: 'inativa' })
    .eq('id', id)

  if (error) {
    redirect(`/aulas?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/aulas?message=Aula inativada com sucesso')
}

export async function ativarAula(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    'Centro Cultural',
    'Aulas',
    'editar'
  )
  const admin = createAdminClient()

  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/aulas?message=Aula nao encontrada')
  }

  const { error } = await admin
    .from('aulas')
    .update({ status: 'ativa' })
    .eq('id', id)

  if (error) {
    redirect(`/aulas?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/aulas?message=Aula ativada com sucesso')
}
