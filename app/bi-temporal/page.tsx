import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"Sidebar currentPath="/" /> } from '@/components/<Sidebar currentPath="/" />'

type RegistroSimples = {
  created_at?: string | null
}

type Frequencia = {
  data_aula?: string | null
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function obterMesAno(data: string | null | undefined) {
  if (!data) return null
  const d = new Date(data)
  if (Number.isNaN(d.getTime())) return null

  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  return `${ano}-${mes}`
}

function formatarMesAno(chave: string) {
  const [ano, mes] = chave.split('-')
  const nomes = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ]
  return `${nomes[Number(mes) - 1]}/${ano}`
}

function gerarUltimosMeses(quantidade: number) {
  const resultado: string[] = []
  const hoje = new Date()

  for (let i = quantidade - 1; i >= 0; i--) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    resultado.push(`${ano}-${mes}`)
  }

  return resultado
}

function contarPorMes(registros: RegistroSimples[], meses: string[]) {
  const mapa = Object.fromEntries(meses.map((mes) => [mes, 0]))

  for (const item of registros) {
    const chave = obterMesAno(item.created_at)
    if (chave && chave in mapa) {
      mapa[chave] += 1
    }
  }

  return mapa
}

function contarFrequenciasPorMes(registros: Frequencia[], meses: string[]) {
  const mapa = Object.fromEntries(meses.map((mes) => [mes, 0]))

  for (const item of registros) {
    const chave = obterMesAno(item.data_aula)
    if (chave && chave in mapa) {
      mapa[chave] += 1
    }
  }

  return mapa
}

function maiorValor(valores: number[]) {
  return Math.max(...valores, 1)
}

export default async function BITemporalPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const meses = gerarUltimosMeses(6)

  const [
    { data: pessoasData, error: erroPessoas },
    { data: alunosData, error: erroAlunos },
    { data: visitantesData, error: erroVisitantes },
    { data: leitoresData, error: erroLeitores },
    { data: frequenciasData, error: erroFrequencias },
  ] = await Promise.all([
    supabase.from('pessoas').select('created_at'),
    supabase.from('alunos').select('created_at'),
    supabase.from('visitantes').select('created_at'),
    supabase.from('biblioteca_leitores').select('created_at'),
    supabase.from('frequencias').select('data_aula'),
  ])

  if (erroPessoas) {
    redirect(`/bi-temporal?message=${encodeURIComponent(erroPessoas.message)}`)
  }

  if (erroAlunos) {
    redirect(`/bi-temporal?message=${encodeURIComponent(erroAlunos.message)}`)
  }

  if (erroVisitantes) {
    redirect(`/bi-temporal?message=${encodeURIComponent(erroVisitantes.message)}`)
  }

  if (erroLeitores) {
    redirect(`/bi-temporal?message=${encodeURIComponent(erroLeitores.message)}`)
  }

  if (erroFrequencias) {
    redirect(`/bi-temporal?message=${encodeURIComponent(erroFrequencias.message)}`)
  }

  const pessoas = (pessoasData ?? []) as RegistroSimples[]
  const alunos = (alunosData ?? []) as RegistroSimples[]
  const visitantes = (visitantesData ?? []) as RegistroSimples[]
  const leitores = (leitoresData ?? []) as RegistroSimples[]
  const frequencias = (frequenciasData ?? []) as Frequencia[]

  const pessoasPorMes = contarPorMes(pessoas, meses)
  const alunosPorMes = contarPorMes(alunos, meses)
  const visitantesPorMes = contarPorMes(visitantes, meses)
  const leitoresPorMes = contarPorMes(leitores, meses)
  const frequenciasPorMes = contarFrequenciasPorMes(frequencias, meses)

  const linhas = meses.map((mes) => ({
    mes,
    pessoas: pessoasPorMes[mes] ?? 0,
    alunos: alunosPorMes[mes] ?? 0,
    visitantes: visitantesPorMes[mes] ?? 0,
    leitores: leitoresPorMes[mes] ?? 0,
    frequencias: frequenciasPorMes[mes] ?? 0,
  }))

  const maiorCadastros = maiorValor(
    linhas.flatMap((item) => [item.pessoas, item.alunos, item.visitantes, item.leitores])
  )
  const maiorFrequencia = maiorValor(linhas.map((item) => item.frequencias))

  const ultimoMes = linhas[linhas.length - 1]
  const totalPessoasPeriodo = linhas.reduce((acc, item) => acc + item.pessoas, 0)
  const totalAlunosPeriodo = linhas.reduce((acc, item) => acc + item.alunos, 0)
  const totalVisitantesPeriodo = linhas.reduce((acc, item) => acc + item.visitantes, 0)
  const totalLeitoresPeriodo = linhas.reduce((acc, item) => acc + item.leitores, 0)
  const totalFrequenciasPeriodo = linhas.reduce((acc, item) => acc + item.frequencias, 0)

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <<Sidebar currentPath="/" /> />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  B.I. Temporal
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Evolução histórica dos últimos 6 meses da Secretaria
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                Período analisado: {formatarMesAno(meses[0])} até {formatarMesAno(meses[meses.length - 1])}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Pessoas no período</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {totalPessoasPeriodo}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Alunos no período</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {totalAlunosPeriodo}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Visitantes no período</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {totalVisitantesPeriodo}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Leitores no período</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {totalLeitoresPeriodo}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Frequências no período</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {totalFrequenciasPeriodo}
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className={cardClassName()}>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Cadastros por mês
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Pessoas, alunos, visitantes e leitores
              </p>

              <div className="mt-6 space-y-6">
                {linhas.map((item) => (
                  <div key={item.mes} className="rounded-2xl bg-slate-50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">
                        {formatarMesAno(item.mes)}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {[
                        { nome: 'Pessoas', valor: item.pessoas, cor: 'bg-slate-700' },
                        { nome: 'Alunos', valor: item.alunos, cor: 'bg-blue-600' },
                        { nome: 'Visitantes', valor: item.visitantes, cor: 'bg-cyan-600' },
                        { nome: 'Leitores', valor: item.leitores, cor: 'bg-emerald-600' },
                      ].map((linha) => {
                        const largura = Math.max(
                          Math.round((linha.valor / maiorCadastros) * 100),
                          linha.valor > 0 ? 10 : 0
                        )

                        return (
                          <div key={`${item.mes}-${linha.nome}`}>
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-sm text-slate-700">{linha.nome}</span>
                              <span className="text-sm font-semibold text-slate-900">
                                {linha.valor}
                              </span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className={`h-full rounded-full ${linha.cor}`}
                                style={{ width: `${largura}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={cardClassName()}>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Frequências por mês
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Evolução dos lançamentos de presença
              </p>

              <div className="mt-6 space-y-4">
                {linhas.map((item) => {
                  const largura = Math.max(
                    Math.round((item.frequencias / maiorFrequencia) * 100),
                    item.frequencias > 0 ? 10 : 0
                  )

                  return (
                    <div key={`freq-${item.mes}`}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm text-slate-700">{formatarMesAno(item.mes)}</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {item.frequencias}
                        </span>
                      </div>
                      <div className="h-4 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-violet-600"
                          style={{ width: `${largura}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-8 rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Último mês analisado</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Pessoas</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{ultimoMes?.pessoas ?? 0}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Frequências</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{ultimoMes?.frequencias ?? 0}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Visitantes</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{ultimoMes?.visitantes ?? 0}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Leitores</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{ultimoMes?.leitores ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Tabela consolidada mensal
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Comparativo dos principais indicadores por mês
            </p>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Mês</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Pessoas</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Alunos</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Visitantes</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Leitores</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Frequências</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((item) => (
                    <tr key={`linha-${item.mes}`} className="bg-slate-50">
                      <td className="rounded-l-2xl px-4 py-4 font-medium text-slate-900">
                        {formatarMesAno(item.mes)}
                      </td>
                      <td className="px-4 py-4 text-slate-700">{item.pessoas}</td>
                      <td className="px-4 py-4 text-slate-700">{item.alunos}</td>
                      <td className="px-4 py-4 text-slate-700">{item.visitantes}</td>
                      <td className="px-4 py-4 text-slate-700">{item.leitores}</td>
                      <td className="rounded-r-2xl px-4 py-4 text-slate-700">{item.frequencias}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Acesso rápido aos módulos
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { titulo: 'Centro Cultural', href: '/centro-cultural', cor: 'bg-blue-600' },
                { titulo: 'Biblioteca', href: '/biblioteca', cor: 'bg-emerald-600' },
                { titulo: 'B.I. de Pessoas', href: '/bi-pessoas', cor: 'bg-slate-800' },
                { titulo: 'Comunicação', href: '/contatos', cor: 'bg-cyan-600' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-6 transition hover:bg-slate-100"
                >
                  <h3 className="text-lg font-bold tracking-tight text-slate-900">
                    {item.titulo}
                  </h3>
                  <span className={`mt-4 inline-flex rounded-xl ${item.cor} px-4 py-2 text-sm font-semibold text-white`}>
                    Acessar
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}