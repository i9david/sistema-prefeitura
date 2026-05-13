import { createTenantClient } from '@/lib/supabase/tenant-server'

type PessoaBairro = {
  id: string
  bairro: string | null
}

type AlunoPessoa = {
  pessoa_id: string | null
  status: string | null
}

type VisitaPessoa = {
  pessoa_id: string | null
}

export type IndicadorBairro = {
  bairro: string
  pessoasCadastradas: number
  pessoasAtendidas: number
  alunosAtivos: number
  visitantes: number
  taxaCobertura: number
}

export type IndicadoresBairros = {
  resumo: {
    bairrosMapeados: number
    pessoasCadastradas: number
    pessoasAtendidas: number
    taxaCoberturaGeral: number
  }
  rankingBairros: IndicadorBairro[]
  bairrosMenorCobertura: IndicadorBairro[]
}

function normalizarBairro(valor: string | null | undefined) {
  const bairro = String(valor ?? '').trim()
  return bairro || 'Não informado'
}

function percentual(parte: number, total: number) {
  if (total <= 0) return 0
  return Math.round((parte / total) * 10000) / 100
}

export async function getIndicadoresBairros(): Promise<IndicadoresBairros> {
  const supabase = await createTenantClient()

  const [
    { data: pessoasData, error: pessoasError },
    { data: alunosData, error: alunosError },
    { data: visitasData, error: visitasError },
  ] = await Promise.all([
    supabase.from('pessoas').select('id, bairro'),
    supabase.from('alunos').select('pessoa_id, status'),
    supabase.from('visitante_visitas').select('pessoa_id'),
  ])

  const erros = [
    pessoasError?.message,
    alunosError?.message,
    visitasError?.message,
  ].filter(Boolean)

  if (erros.length > 0) {
    throw new Error(erros.join(' | '))
  }

  const pessoas = (pessoasData ?? []) as PessoaBairro[]
  const alunos = (alunosData ?? []) as AlunoPessoa[]
  const visitas = (visitasData ?? []) as VisitaPessoa[]

  const bairroPorPessoa = new Map<string, string>()
  const indicadores = new Map<string, IndicadorBairro>()

  function obterLinha(bairro: string) {
    const atual =
      indicadores.get(bairro) ??
      {
        bairro,
        pessoasCadastradas: 0,
        pessoasAtendidas: 0,
        alunosAtivos: 0,
        visitantes: 0,
        taxaCobertura: 0,
      }

    indicadores.set(bairro, atual)
    return atual
  }

  pessoas.forEach((pessoa) => {
    const bairro = normalizarBairro(pessoa.bairro)
    bairroPorPessoa.set(pessoa.id, bairro)
    obterLinha(bairro).pessoasCadastradas += 1
  })

  const pessoasAtendidas = new Set<string>()
  const visitantesPorPessoa = new Set<string>()

  alunos.forEach((aluno) => {
    if (!aluno.pessoa_id) return

    const bairro = bairroPorPessoa.get(aluno.pessoa_id) ?? 'Não informado'
    pessoasAtendidas.add(aluno.pessoa_id)

    if (aluno.status === 'ativo') {
      obterLinha(bairro).alunosAtivos += 1
    }
  })

  visitas.forEach((visita) => {
    if (!visita.pessoa_id) return

    const bairro = bairroPorPessoa.get(visita.pessoa_id) ?? 'Não informado'
    pessoasAtendidas.add(visita.pessoa_id)
    visitantesPorPessoa.add(visita.pessoa_id)
    obterLinha(bairro).visitantes += 1
  })

  pessoasAtendidas.forEach((pessoaId) => {
    const bairro = bairroPorPessoa.get(pessoaId) ?? 'Não informado'
    obterLinha(bairro).pessoasAtendidas += 1
  })

  visitantesPorPessoa.forEach((pessoaId) => {
    const bairro = bairroPorPessoa.get(pessoaId) ?? 'Não informado'
    obterLinha(bairro)
  })

  const linhas = Array.from(indicadores.values()).map((linha) => ({
    ...linha,
    taxaCobertura: percentual(linha.pessoasAtendidas, linha.pessoasCadastradas),
  }))

  const rankingBairros = [...linhas].sort(
    (a, b) => b.pessoasAtendidas - a.pessoasAtendidas || a.bairro.localeCompare(b.bairro)
  )

  const bairrosMenorCobertura = [...linhas]
    .filter((linha) => linha.pessoasCadastradas > 0)
    .sort(
      (a, b) =>
        a.taxaCobertura - b.taxaCobertura ||
        a.pessoasAtendidas - b.pessoasAtendidas ||
        a.bairro.localeCompare(b.bairro)
    )
    .slice(0, 10)

  const totalPessoasCadastradas = linhas.reduce(
    (total, linha) => total + linha.pessoasCadastradas,
    0
  )
  const totalPessoasAtendidas = linhas.reduce(
    (total, linha) => total + linha.pessoasAtendidas,
    0
  )

  return {
    resumo: {
      bairrosMapeados: linhas.filter((linha) => linha.bairro !== 'Não informado').length,
      pessoasCadastradas: totalPessoasCadastradas,
      pessoasAtendidas: totalPessoasAtendidas,
      taxaCoberturaGeral: percentual(totalPessoasAtendidas, totalPessoasCadastradas),
    },
    rankingBairros,
    bairrosMenorCobertura,
  }
}
