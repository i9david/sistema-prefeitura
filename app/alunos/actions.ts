'use server'

import { redirect } from 'next/navigation'
import { exigirPermissaoAction } from '@/lib/seguranca-actions'

type StatusAluno = 'ativo' | 'inativo'

type SupabaseTenant = Awaited<ReturnType<typeof exigirPermissaoAction>>['supabase']

const ERRO_ALUNO_JA_MATRICULADO_MODALIDADE =
  'Aluno j\u00e1 matriculado nesta modalidade'
const ERRO_CONFLITO_HORARIO = 'Conflito de hor\u00e1rio com outra aula'

type MatriculaAtiva = {
  id: string
  aula_id: string
  modalidade_id: string
  data_inicio: string
  data_fim: string | null
}

type AulaDaMatricula = {
  id: string
  dia_semana: string
  horario_inicio: string
  horario_fim: string
}

function obterAulaDaMatricula(
  matricula: MatriculaAtiva,
  aulasById: Map<string, AulaDaMatricula>
) {
  return aulasById.get(matricula.aula_id) ?? null
}

type AulaAtiva = {
  id: string
  modalidade_id: string
  dia_semana: string
  horario_inicio: string
  horario_fim: string
  status: string
}

type ResultadoSincronizacaoMatricula = {
  matriculaCriadaId: string | null
}

function normalizarTelefone(valor: string) {
  return valor.replace(/\D/g, '').slice(0, 11)
}

function validarStatus(valor: string): StatusAluno {
  return valor === 'inativo' ? 'inativo' : 'ativo'
}

function dataHoje() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function intervalosSeSobrepoem({
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

function aulasTemConflitoDeHorario(
  aulaAtual: AulaDaMatricula | null,
  novaAula: AulaAtiva
) {
  const aula = Array.isArray(aulaAtual) ? aulaAtual[0] : aulaAtual

  if (!aula) return false
  if (aula.dia_semana !== novaAula.dia_semana) return false

  return horariosSeSobrepoem({
    inicioAtual: aula.horario_inicio,
    fimAtual: aula.horario_fim,
    novoInicio: novaAula.horario_inicio,
    novoFim: novaAula.horario_fim,
  })
}

function validarTelefoneObrigatorio(telefone: string, redirectUrl: string) {
  if (telefone.length !== 11) {
    redirect(`${redirectUrl}&message=Informe um telefone com DDD e 11 dígitos`)
  }
}

async function buscarOuCriarPessoa({
  supabase,
  nome,
  telefone,
  dataNascimento,
}: {
  supabase: SupabaseTenant
  nome: string
  telefone: string
  dataNascimento: string
}) {
  const { data: pessoasPorTelefone, error: erroBuscaTelefone } = await supabase
    .from('pessoas')
    .select('id')
    .eq('telefone', telefone)
    .limit(1)

  if (erroBuscaTelefone) {
    redirect(`/alunos?novo=1&message=${encodeURIComponent(erroBuscaTelefone.message)}`)
  }

  const pessoaExistente = pessoasPorTelefone?.[0]

  if (pessoaExistente?.id) {
    const { error: erroPessoa } = await supabase
      .from('pessoas')
      .update({
        nome,
        telefone,
        data_nascimento: dataNascimento || null,
      })
      .eq('id', pessoaExistente.id)

    if (erroPessoa) {
      redirect(`/alunos?novo=1&message=${encodeURIComponent(erroPessoa.message)}`)
    }

    return pessoaExistente.id as string
  }

  const { data: novaPessoa, error: erroNovaPessoa } = await supabase
    .from('pessoas')
    .insert({
      nome,
      telefone,
      data_nascimento: dataNascimento || null,
    })
    .select('id')
    .single()

  if (erroNovaPessoa) {
    redirect(`/alunos?novo=1&message=${encodeURIComponent(erroNovaPessoa.message)}`)
  }

  return novaPessoa.id as string
}

async function validarAulaAtiva(
  supabase: SupabaseTenant,
  aulaId: string,
  redirectUrl: string
) {
  const { data: aula, error } = await supabase
    .from('aulas')
    .select('id, modalidade_id, dia_semana, horario_inicio, horario_fim, status')
    .eq('id', aulaId)
    .maybeSingle()

  if (error) {
    redirect(`${redirectUrl}&message=${encodeURIComponent(error.message)}`)
  }

  if (!aula || aula.status !== 'ativa') {
    redirect(`${redirectUrl}&message=Selecione uma turma ativa`)
  }

  return aula as AulaAtiva
}

async function sincronizarMatriculaAtiva({
  supabase,
  alunoId,
  aula,
  redirectUrl,
}: {
  supabase: SupabaseTenant
  alunoId: string
  aula: AulaAtiva
  redirectUrl: string
}): Promise<ResultadoSincronizacaoMatricula> {
  const { data: matriculasAtivas, error: erroMatriculas } = await supabase
    .from('aluno_matriculas')
    .select('id, aula_id, modalidade_id, data_inicio, data_fim')
    .eq('aluno_id', alunoId)
    .eq('status', 'ativo')

  if (erroMatriculas) {
    redirect(`${redirectUrl}&message=${encodeURIComponent(erroMatriculas.message)}`)
  }

  const matriculas = (matriculasAtivas ?? []) as MatriculaAtiva[]
  const aulaIdsAtivas = Array.from(
    new Set(matriculas.map((matricula) => matricula.aula_id).filter(Boolean))
  )

  const { data: aulasAtivas, error: erroAulasAtivas } =
    aulaIdsAtivas.length > 0
      ? await supabase
          .from('aulas')
          .select('id, dia_semana, horario_inicio, horario_fim')
          .in('id', aulaIdsAtivas)
      : { data: [], error: null }

  if (erroAulasAtivas) {
    redirect(`${redirectUrl}&message=${encodeURIComponent(erroAulasAtivas.message)}`)
  }

  const aulasById = new Map(
    (aulasAtivas ?? []).map((aula) => [aula.id, aula as AulaDaMatricula])
  )
  const hoje = dataHoje()
  const matriculaAtual = matriculas.find(
    (matricula) =>
      matricula.aula_id === aula.id &&
      intervalosSeSobrepoem({
        inicioAtual: matricula.data_inicio,
        fimAtual: matricula.data_fim,
        novoInicio: hoje,
        novoFim: null,
      })
  )

  if (matriculaAtual) {
    return { matriculaCriadaId: null }
  }

  const matriculaMesmaModalidade = matriculas.find(
    (matricula) =>
      matricula.aula_id !== aula.id &&
      matricula.modalidade_id === aula.modalidade_id &&
      intervalosSeSobrepoem({
        inicioAtual: matricula.data_inicio,
        fimAtual: matricula.data_fim,
        novoInicio: hoje,
        novoFim: null,
      })
  )

  if (matriculaMesmaModalidade) {
    redirect(
      `${redirectUrl}&message=${encodeURIComponent(
        ERRO_ALUNO_JA_MATRICULADO_MODALIDADE
      )}`
    )
  }

  const matriculaComConflitoDeHorario = matriculas.find(
    (matricula) =>
      matricula.aula_id !== aula.id &&
      intervalosSeSobrepoem({
        inicioAtual: matricula.data_inicio,
        fimAtual: matricula.data_fim,
        novoInicio: hoje,
        novoFim: null,
      }) &&
      aulasTemConflitoDeHorario(obterAulaDaMatricula(matricula, aulasById), aula)
  )

  if (matriculaComConflitoDeHorario) {
    redirect(`${redirectUrl}&message=${encodeURIComponent(ERRO_CONFLITO_HORARIO)}`)
  }

  const { data: matriculasDaAula, error: erroMatriculasDaAula } = await supabase
    .from('aluno_matriculas')
    .select('id, data_inicio, data_fim, status')
    .eq('aluno_id', alunoId)
    .eq('aula_id', aula.id)
    .eq('status', 'ativo')
    .or(`data_fim.is.null,data_fim.gte.${hoje}`)

  if (erroMatriculasDaAula) {
    redirect(`${redirectUrl}&message=${encodeURIComponent(erroMatriculasDaAula.message)}`)
  }

  const existeSobreposicaoNaAula = (matriculasDaAula ?? []).some((matricula) =>
    intervalosSeSobrepoem({
      inicioAtual: matricula.data_inicio as string,
      fimAtual: (matricula.data_fim as string | null) ?? null,
      novoInicio: hoje,
      novoFim: null,
    })
  )

  if (existeSobreposicaoNaAula) {
    redirect(
      `${redirectUrl}&message=Já existe matrícula ativa para este aluno nesta turma no período informado`
    )
  }

  const { data: novaMatricula, error: erroNovaMatricula } = await supabase
    .from('aluno_matriculas')
    .insert({
      aluno_id: alunoId,
      modalidade_id: aula.modalidade_id,
      aula_id: aula.id,
      data_inicio: hoje,
      status: 'ativo',
    })
    .select('id')
    .single()

  if (erroNovaMatricula || !novaMatricula) {
    redirect(
      `${redirectUrl}&message=${encodeURIComponent(
        erroNovaMatricula?.message ?? 'Matrícula não criada'
      )}`
    )
  }

  return { matriculaCriadaId: novaMatricula.id as string }
}

async function desfazerMatriculaCriada({
  supabase,
  matriculaId,
  redirectUrl,
  erroOriginal,
}: {
  supabase: SupabaseTenant
  matriculaId: string | null
  redirectUrl: string
  erroOriginal: string
}) {
  if (!matriculaId) {
    redirect(`${redirectUrl}&message=${encodeURIComponent(erroOriginal)}`)
  }

  const { error: erroRollback } = await supabase
    .from('aluno_matriculas')
    .update({
      status: 'trancado',
      data_fim: dataHoje(),
    })
    .eq('id', matriculaId)

  if (erroRollback) {
    redirect(
      `${redirectUrl}&message=${encodeURIComponent(
        `${erroOriginal}. Matrícula criada, mas não foi possível desfazer: ${erroRollback.message}`
      )}`
    )
  }

  redirect(`${redirectUrl}&message=${encodeURIComponent(erroOriginal)}`)
}

export async function criarAluno(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    'Centro Cultural',
    'Alunos',
    'criar'
  )

  const nome = String(formData.get('nome') ?? '').trim()
  const telefone = normalizarTelefone(String(formData.get('telefone') ?? ''))
  const dataNascimento = String(formData.get('data_nascimento') ?? '').trim()
  const aulaId = String(formData.get('aula_id') ?? '').trim()
  const status = validarStatus(String(formData.get('status') ?? 'ativo').trim())
  const redirectUrl = '/alunos?novo=1'

  if (!nome || !aulaId) {
    redirect(`${redirectUrl}&message=Preencha os campos obrigatórios`)
  }

  validarTelefoneObrigatorio(telefone, redirectUrl)
  const aula = await validarAulaAtiva(supabase, aulaId, redirectUrl)

  const pessoaId = await buscarOuCriarPessoa({
    supabase,
    nome,
    telefone,
    dataNascimento,
  })

  const { data: alunoCriado, error } = await supabase
    .from('alunos')
    .insert({
      pessoa_id: pessoaId,
      nome,
      telefone,
      data_nascimento: dataNascimento || null,
      aula_id: aulaId,
      status,
    })
    .select('id')
    .single()

  if (error || !alunoCriado) {
    redirect(
      `${redirectUrl}&message=${encodeURIComponent(
        error?.message ?? 'Aluno não cadastrado'
      )}`
    )
  }

  await sincronizarMatriculaAtiva({
    supabase,
    alunoId: alunoCriado.id,
    aula,
    redirectUrl,
  })

  redirect('/alunos?message=Aluno cadastrado com sucesso')
}

export async function atualizarAluno(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    'Centro Cultural',
    'Alunos',
    'editar'
  )

  const id = String(formData.get('id') ?? '').trim()
  const nome = String(formData.get('nome') ?? '').trim()
  const telefone = normalizarTelefone(String(formData.get('telefone') ?? ''))
  const dataNascimento = String(formData.get('data_nascimento') ?? '').trim()
  const aulaId = String(formData.get('aula_id') ?? '').trim()
  const status = validarStatus(String(formData.get('status') ?? 'ativo').trim())
  const redirectUrl = id ? `/alunos?editar=${encodeURIComponent(id)}` : '/alunos'

  if (!id || !nome || !aulaId) {
    redirect(`${redirectUrl}&message=Preencha os campos obrigatórios`)
  }

  validarTelefoneObrigatorio(telefone, redirectUrl)
  const aula = await validarAulaAtiva(supabase, aulaId, redirectUrl)

  const { data: alunoAtual, error: erroAlunoAtual } = await supabase
    .from('alunos')
    .select('id, pessoa_id')
    .eq('id', id)
    .maybeSingle()

  if (erroAlunoAtual) {
    redirect(`${redirectUrl}&message=${encodeURIComponent(erroAlunoAtual.message)}`)
  }

  if (!alunoAtual) {
    redirect('/alunos?message=Aluno não encontrado')
  }

  let pessoaId = alunoAtual.pessoa_id as string | null

  if (pessoaId) {
    const { error: erroPessoa } = await supabase
      .from('pessoas')
      .update({
        nome,
        telefone,
        data_nascimento: dataNascimento || null,
      })
      .eq('id', pessoaId)

    if (erroPessoa) {
      redirect(`${redirectUrl}&message=${encodeURIComponent(erroPessoa.message)}`)
    }
  } else {
    pessoaId = await buscarOuCriarPessoa({
      supabase,
      nome,
      telefone,
      dataNascimento,
    })
  }

  const { matriculaCriadaId } = await sincronizarMatriculaAtiva({
    supabase,
    alunoId: id,
    aula,
    redirectUrl,
  })

  const { error } = await supabase
    .from('alunos')
    .update({
      pessoa_id: pessoaId,
      nome,
      telefone,
      data_nascimento: dataNascimento || null,
      aula_id: aulaId,
      status,
    })
    .eq('id', id)

  if (error) {
    await desfazerMatriculaCriada({
      supabase,
      matriculaId: matriculaCriadaId,
      redirectUrl,
      erroOriginal: error.message,
    })
  }

  redirect('/alunos?message=Aluno atualizado com sucesso')
}

export async function inativarAluno(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    'Centro Cultural',
    'Alunos',
    'excluir'
  )

  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/alunos?message=Aluno não encontrado')
  }

  const { error } = await supabase
    .from('alunos')
    .update({ status: 'inativo' })
    .eq('id', id)

  if (error) {
    redirect(`/alunos?message=${encodeURIComponent(error.message)}`)
  }

  const { error: erroEncerrarMatricula } = await supabase
    .from('aluno_matriculas')
    .update({
      status: 'concluido',
      data_fim: dataHoje(),
    })
    .eq('aluno_id', id)
    .eq('status', 'ativo')

  if (erroEncerrarMatricula) {
    redirect(`/alunos?message=${encodeURIComponent(erroEncerrarMatricula.message)}`)
  }

  redirect('/alunos?message=Aluno inativado com sucesso')
}

export async function ativarAluno(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    'Centro Cultural',
    'Alunos',
    'editar'
  )

  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/alunos?message=Aluno não encontrado')
  }

  const { data: alunoAtual, error: erroAlunoAtual } = await supabase
    .from('alunos')
    .select('id, aula_id')
    .eq('id', id)
    .maybeSingle()

  if (erroAlunoAtual) {
    redirect(`/alunos?message=${encodeURIComponent(erroAlunoAtual.message)}`)
  }

  if (!alunoAtual) {
    redirect('/alunos?message=Aluno não encontrado')
  }

  const { error } = await supabase
    .from('alunos')
    .update({ status: 'ativo' })
    .eq('id', id)

  if (error) {
    redirect(`/alunos?message=${encodeURIComponent(error.message)}`)
  }

  if (alunoAtual.aula_id) {
    const aula = await validarAulaAtiva(
      supabase,
      alunoAtual.aula_id as string,
      '/alunos'
    )

    await sincronizarMatriculaAtiva({
      supabase,
      alunoId: id,
      aula,
      redirectUrl: '/alunos',
    })
  }

  redirect('/alunos?message=Aluno ativado com sucesso')
}
