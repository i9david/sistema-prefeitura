'use server'

import { redirect } from 'next/navigation'
import { exigirPermissaoAction } from '@/lib/seguranca-actions'
import { createAdminClient } from '@/lib/supabase/admin'

type FrequenciaExistente = {
  aluno_id: string
  origem: string | null
  hora_registro: string | null
}

type AlunoFrequencia = {
  id: string
  status: string
}

type MatriculaAluno = {
  alunos: AlunoFrequencia | AlunoFrequencia[] | null
}

function getAlunoMatricula(matricula: MatriculaAluno) {
  if (!matricula.alunos) return null
  if (Array.isArray(matricula.alunos)) return matricula.alunos[0] ?? null
  return matricula.alunos
}

export async function salvarFrequencia(formData: FormData) {
  const { supabase, usuarioInterno } = await exigirPermissaoAction(
    'Centro Cultural',
    'Frequência',
    'editar'
  )
  const admin = createAdminClient()

  const aulaId = String(formData.get('aula_id') ?? '').trim()
  const dataAula = String(formData.get('data_aula') ?? '').trim()

  if (!aulaId || !dataAula) {
    redirect('/frequencia?message=Turma e data são obrigatórias')
  }

  if (usuarioInterno.professor_id) {
    const { data: aulaPermitida, error: aulaError } = await supabase
      .from('aula_professores')
      .select('id')
      .eq('aula_id', aulaId)
      .eq('professor_id', usuarioInterno.professor_id)
      .maybeSingle()

    if (aulaError) {
      redirect(`/frequencia?message=${encodeURIComponent(aulaError.message)}`)
    }

    if (!aulaPermitida) {
      redirect('/frequencia?message=Você não tem permissão para lançar frequência nesta turma')
    }
  }

  const { data: matriculasData, error: matriculasError } = await supabase
    .from('aluno_matriculas')
    .select(`
      alunos:aluno_id!aluno_matriculas_aluno_id_fkey (
        id,
        status
      )
    `)
    .eq('aula_id', aulaId)
    .eq('status', 'ativo')
    .lte('data_inicio', dataAula)
    .or(`data_fim.is.null,data_fim.gte.${dataAula}`)

  if (matriculasError) {
    redirect(`/frequencia?message=${encodeURIComponent(matriculasError.message)}`)
  }

  let alunos = ((matriculasData ?? []) as MatriculaAluno[])
    .map(getAlunoMatricula)
    .filter((aluno): aluno is AlunoFrequencia => Boolean(aluno && aluno.status === 'ativo'))

  const { data: matriculasAtivasDaTurma, error: matriculasAtivasDaTurmaError } =
    alunos.length === 0
      ? await supabase
          .from('aluno_matriculas')
          .select('id')
          .eq('aula_id', aulaId)
          .eq('status', 'ativo')
          .limit(1)
      : { data: [], error: null }

  if (matriculasAtivasDaTurmaError) {
    redirect(`/frequencia?message=${encodeURIComponent(matriculasAtivasDaTurmaError.message)}`)
  }

  const usarFallbackLegado =
    alunos.length === 0 && (matriculasAtivasDaTurma ?? []).length === 0

  if (usarFallbackLegado) {
    const { data: alunosData, error: alunosError } = await supabase
      .from('alunos')
      .select('id, status')
      .eq('aula_id', aulaId)
      .eq('status', 'ativo')

    if (alunosError) {
      redirect(`/frequencia?message=${encodeURIComponent(alunosError.message)}`)
    }

    alunos = (alunosData ?? []) as AlunoFrequencia[]
  }

  if (alunos.length === 0) {
    redirect('/frequencia?message=Não existem alunos ativos nesta turma')
  }

  const registros = alunos.map((aluno) => {
    const status = String(formData.get(`status_${aluno.id}`) ?? '').trim()
    const observacoes = String(formData.get(`observacoes_${aluno.id}`) ?? '').trim()

    return {
      aula_id: aulaId,
      aluno_id: aluno.id,
      data_aula: dataAula,
      status,
      observacoes: observacoes || null,
      origem: 'manual',
    }
  })

  const registrosValidos = registros.filter((item) => item.status)

  if (registrosValidos.length === 0) {
    redirect(
      `/frequencia?aula_id=${encodeURIComponent(
        aulaId
      )}&data_aula=${encodeURIComponent(dataAula)}&message=Preencha a frequência dos alunos`
    )
  }

  const alunoIds = registrosValidos.map((registro) => registro.aluno_id)

  const { data: frequenciasExistentes, error: frequenciasExistentesError } =
    await supabase
      .from('frequencias')
      .select('aluno_id, origem, hora_registro')
      .eq('aula_id', aulaId)
      .eq('data_aula', dataAula)
      .in('aluno_id', alunoIds)

  if (frequenciasExistentesError) {
    redirect(`/frequencia?message=${encodeURIComponent(frequenciasExistentesError.message)}`)
  }

  const frequenciasPorAluno = new Map(
    ((frequenciasExistentes ?? []) as FrequenciaExistente[]).map((frequencia) => [
      frequencia.aluno_id,
      frequencia,
    ])
  )

  const registrosParaSalvar = registrosValidos.map((registro) => {
    const frequenciaExistente = frequenciasPorAluno.get(registro.aluno_id)

    return {
      ...registro,
      origem: frequenciaExistente?.origem ?? registro.origem,
      hora_registro: frequenciaExistente?.hora_registro ?? null,
    }
  })

  const { error: upsertError } = await admin
    .from('frequencias')
    .upsert(registrosParaSalvar, {
      onConflict: 'municipio_id,aula_id,aluno_id,data_aula',
    })

  if (upsertError) {
    redirect(`/frequencia?message=${encodeURIComponent(upsertError.message)}`)
  }

  redirect(
    `/frequencia?aula_id=${encodeURIComponent(
      aulaId
    )}&data_aula=${encodeURIComponent(dataAula)}&message=Frequência salva com sucesso`
  )
}
