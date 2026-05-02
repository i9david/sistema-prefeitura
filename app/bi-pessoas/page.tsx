import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" { Sidebar } from "@/components/sidebar" currentPath="/" /> } from '@/components/<Sidebar currentPath="/" />'

type Pessoa = {
  id: string
  nome: string
  telefone: string
  data_nascimento: string
  created_at: string
}

type Aluno = {
  id: string
  pessoa_id: string | null
  nome: string
  aula_nome: string | null
  modalidade: string | null
  status: string
}

type Visitante = {
  id: string
  pessoa_id: string | null
  nome: string
  data_visita: string
}

type Leitor = {
  id: string
  pessoa_id: string | null
  nome: string
  status: string
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function formatarTelefone(valor: string | null | undefined) {
  const numeros = String(valor ?? '').replace(/\D/g, '').slice(0, 11)

  if (!numeros) return '-'

  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d+)/, '$1-$2')
  }

  return numeros
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d+)/, '$1-$2')
}

function formatarData(data: string | null | undefined) {
  if (!data) return '-'

  const partes = data.split('-')
  if (partes.length !== 3) return data

  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function percent(valor: number, total: number) {
  if (!total || total <= 0) return 0
  return Math.round((valor / total) * 100)
}

export default async function BIPessoasPage({
  searchParams,
}: {
  searchParams: Promise<{
    busca?: string
    modulo?: string
    message?: string
  }>
}) {
  const params = await searchParams
  const busca = params.busca?.trim().toLowerCase() || ''
  const moduloFiltro = params.modulo?.trim() || ''

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: pessoasData, error: erroPessoas },
    { data: alunosData, error: erroAlunos },
    { data: visitantesData, error: erroVisitantes },
    { data: leitoresData, error: erroLeitores },
  ] = await Promise.all([
    supabase
      .from('pessoas')
      .select('id, nome, telefone, data_nascimento, created_at')
      .order('nome', { ascending: true }),

    supabase
      .from('alunos')
      .select('id, pessoa_id, nome, aula_nome, modalidade, status')
      .order('nome', { ascending: true }),

    supabase
      .from('visitantes')
      .select('id, pessoa_id, nome, data_visita')
      .order('nome', { ascending: true }),

    supabase
      .from('biblioteca_leitores')
      .select('id, pessoa_id, nome, status')
      .order('nome', { ascending: true }),
  ])

  if (erroPessoas) {
    redirect(`/bi-pessoas?message=${encodeURIComponent(erroPessoas.message)}`)
  }

  if (erroAlunos) {
    redirect(`/bi-pessoas?message=${encodeURIComponent(erroAlunos.message)}`)
  }

  if (erroVisitantes) {
    redirect(`/bi-pessoas?message=${encodeURIComponent(erroVisitantes.message)}`)
  }

  if (erroLeitores) {
    redirect(`/bi-pessoas?message=${encodeURIComponent(erroLeitores.message)}`)
  }

  const pessoas = (pessoasData ?? []) as Pessoa[]
  const alunos = (alunosData ?? []) as Aluno[]
  const visitantes = (visitantesData ?? []) as Visitante[]
  const leitores = (leitoresData ?? []) as Leitor[]

  let linhas = pessoas.map((pessoa) => {
    const aluno = alunos.find((item) => item.pessoa_id === pessoa.id)
    const visitante = visitantes.find((item) => item.pessoa_id === pessoa.id)
    const leitor = leitores.find((item) => item.pessoa_id === pessoa.id)

    const modulos: string[] = []

    if (aluno) modulos.push('Centro Cultural')
    if (visitante) modulos.push('Visitantes')
    if (leitor) modulos.push('Biblioteca')

    return {
      pessoa,
      aluno,
      visitante,
      leitor,
      modulos,
      totalVinculos: modulos.length,
    }
  })

  if (busca) {
    linhas = linhas.filter((item) =>
      item.pessoa.nome.toLowerCase().includes(busca)
    )
  }

  if (moduloFiltro) {
    linhas = linhas.filter((item) => item.modulos.includes(moduloFiltro))
  }

  const totalPessoas = pessoas.length
  const totalVinculos = alunos.length + visitantes.length + leitores.length

  const pessoasEm1Modulo = linhas.filter((item) => item.totalVinculos === 1).length
  const pessoasEm2Modulos = linhas.filter((item) => item.totalVinculos === 2).length
  const pessoasEm3Modulos = linhas.filter((item) => item.totalVinculos === 3).length

  const totalCentroCultural = alunos.length
  const totalVisitantes = visitantes.length
  const totalBiblioteca = leitores.length

  const indicadoresModulos = [
    {
      nome: 'Centro Cultural',
      valor: totalCentroCultural,
      corBarra: 'bg-blue-600',
      corBadge: 'bg-blue-100 text-blue-700',
    },
    {
      nome: 'Visitantes',
      valor: totalVisitantes,
      corBarra: 'bg-cyan-600',
      corBadge: 'bg-cyan-100 text-cyan-700',
    },
    {
      nome: 'Biblioteca',
      valor: totalBiblioteca,
      corBarra: 'bg-emerald-600',
      corBadge: 'bg-emerald-100 text-emerald-700',
    },
  ]

  const distribuicaoVinculos = [
    {
      nome: '1 módulo',
      valor: pessoasEm1Modulo,
      corBarra: 'bg-slate-700',
      corBadge: 'bg-slate-200 text-slate-700',
    },
    {
      nome: '2 módulos',
      valor: pessoasEm2Modulos,
      corBarra: 'bg-violet-600',
      corBadge: 'bg-violet-100 text-violet-700',
    },
    {
      nome: '3 módulos',
      valor: pessoasEm3Modulos,
      corBarra: 'bg-amber-500',
      corBadge: 'bg-amber-100 text-amber-700',
    },
  ]

  const maiorModulo = Math.max(...indicadoresModulos.map((item) => item.valor), 1)
  const maiorDistribuicao = Math.max(...distribuicaoVinculos.map((item) => item.valor), 1)

  const percent1 = percent(pessoasEm1Modulo, totalPessoas)
  const percent2 = percent(pessoasEm2Modulos, totalPessoas)
  const percent3 = percent(pessoasEm3Modulos, totalPessoas)

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <<Sidebar currentPath="/" /> />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  B.I. de Pessoas
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Painel consolidado da base única de pessoas da Secretaria
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                Pessoas únicas x vínculos operacionais por módulo
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Pessoas únicas</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {totalPessoas}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Base real consolidada da Secretaria
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Vínculos totais</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {totalVinculos}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Soma dos registros nos módulos
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Pessoas em mais de 1 módulo</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {pessoasEm2Modulos + pessoasEm3Modulos}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Público com circulação entre áreas
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Taxa de múltiplos vínculos</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {percent(pessoasEm2Modulos + pessoasEm3Modulos, totalPessoas)}%
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Pessoas presentes em 2 ou mais módulos
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className={cardClassName()}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Cadastros por módulo
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Volume operacional por área
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Total: {totalVinculos}
                </span>
              </div>

              <div className="mt-6 space-y-5">
                {indicadoresModulos.map((item) => {
                  const largura = Math.max(Math.round((item.valor / maiorModulo) * 100), item.valor > 0 ? 12 : 0)
                  return (
                    <div key={item.nome}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">{item.nome}</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.corBadge}`}>
                          {item.valor}
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${item.corBarra}`}
                          style={{ width: `${largura}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className={cardClassName()}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Distribuição de vínculos
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Quantos módulos cada pessoa ocupa
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Base: {totalPessoas}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">1 módulo</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{pessoasEm1Modulo}</p>
                  <p className="mt-1 text-xs text-slate-500">{percent1}%</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">2 módulos</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{pessoasEm2Modulos}</p>
                  <p className="mt-1 text-xs text-slate-500">{percent2}%</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">3 módulos</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{pessoasEm3Modulos}</p>
                  <p className="mt-1 text-xs text-slate-500">{percent3}%</p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                {distribuicaoVinculos.map((item) => {
                  const largura = Math.max(Math.round((item.valor / maiorDistribuicao) * 100), item.valor > 0 ? 12 : 0)
                  return (
                    <div key={item.nome}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">{item.nome}</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.corBadge}`}>
                          {item.valor}
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${item.corBarra}`}
                          style={{ width: `${largura}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className={cardClassName()}>
            <form method="get" className="grid gap-4 md:grid-cols-[1fr_260px_140px]">
              <input
                type="text"
                name="busca"
                placeholder="Buscar por nome"
                defaultValue={busca}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <select
                name="modulo"
                defaultValue={moduloFiltro}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Todos os módulos</option>
                <option value="Centro Cultural">Centro Cultural</option>
                <option value="Visitantes">Visitantes</option>
                <option value="Biblioteca">Biblioteca</option>
              </select>

              <button
                type="submit"
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Filtrar
              </button>
            </form>

            {params.message && (
              <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {params.message}
              </p>
            )}
          </div>

          <div className={cardClassName()}>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Base consolidada de pessoas
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Visão unificada dos vínculos de cada pessoa nos módulos da Secretaria
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                Registros exibidos: {linhas.length}
              </div>
            </div>

            {linhas.length > 0 ? (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Nome</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Telefone</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Nascimento</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Módulos</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Total vínculos</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Detalhes</th>
                    </tr>
                  </thead>

                  <tbody>
                    {linhas.map((item) => (
                      <tr key={item.pessoa.id} className="bg-slate-50">
                        <td className="rounded-l-2xl px-4 py-4 font-medium text-slate-900">
                          {item.pessoa.nome}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatarTelefone(item.pessoa.telefone)}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatarData(item.pessoa.data_nascimento)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {item.modulos.length > 0 ? (
                              item.modulos.map((modulo) => (
                                <span
                                  key={`${item.pessoa.id}-${modulo}`}
                                  className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                                >
                                  {modulo}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-500">Sem vínculo</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            {item.totalVinculos}
                          </span>
                        </td>
                        <td className="rounded-r-2xl px-4 py-4 text-slate-700">
                          <div className="space-y-1">
                            {item.aluno && (
                              <p>
                                <span className="font-semibold">Centro Cultural:</span>{' '}
                                {item.aluno.aula_nome || item.aluno.modalidade || 'Vinculado'}
                              </p>
                            )}
                            {item.visitante && (
                              <p>
                                <span className="font-semibold">Visitante:</span>{' '}
                                última visita em {formatarData(item.visitante.data_visita)}
                              </p>
                            )}
                            {item.leitor && (
                              <p>
                                <span className="font-semibold">Biblioteca:</span>{' '}
                                {item.leitor.status}
                              </p>
                            )}
                            {!item.aluno && !item.visitante && !item.leitor && (
                              <p className="text-slate-500">Sem detalhe disponível</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhuma pessoa encontrada.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}