import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/import { Sidebar } from "@/components/sidebar" currentPath="/" /> } from '@/components/<Sidebar currentPath="/" />'

type Pessoa = {
  id: string
  nome: string
  telefone: string
  data_nascimento: string
  created_at: string
}

type Aluno = {
  pessoa_id: string | null
}

type Visitante = {
  pessoa_id: string | null
}

type Leitor = {
  pessoa_id: string | null
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

export default async function PessoasPage({
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
    supabase.from('pessoas').select('id, nome, telefone, data_nascimento, created_at').order('nome', { ascending: true }),
    supabase.from('alunos').select('pessoa_id'),
    supabase.from('visitantes').select('pessoa_id'),
    supabase.from('biblioteca_leitores').select('pessoa_id'),
  ])

  if (erroPessoas) redirect(`/pessoas?message=${encodeURIComponent(erroPessoas.message)}`)
  if (erroAlunos) redirect(`/pessoas?message=${encodeURIComponent(erroAlunos.message)}`)
  if (erroVisitantes) redirect(`/pessoas?message=${encodeURIComponent(erroVisitantes.message)}`)
  if (erroLeitores) redirect(`/pessoas?message=${encodeURIComponent(erroLeitores.message)}`)

  const pessoas = (pessoasData ?? []) as Pessoa[]
  const alunos = (alunosData ?? []) as Aluno[]
  const visitantes = (visitantesData ?? []) as Visitante[]
  const leitores = (leitoresData ?? []) as Leitor[]

  let linhas = pessoas.map((pessoa) => {
    const modulos: string[] = []

    if (alunos.some((item) => item.pessoa_id === pessoa.id)) modulos.push('Centro Cultural')
    if (visitantes.some((item) => item.pessoa_id === pessoa.id)) modulos.push('Visitantes')
    if (leitores.some((item) => item.pessoa_id === pessoa.id)) modulos.push('Biblioteca')

    return {
      ...pessoa,
      modulos,
      totalVinculos: modulos.length,
    }
  })

  if (busca) {
    linhas = linhas.filter((item) => item.nome.toLowerCase().includes(busca))
  }

  if (moduloFiltro) {
    linhas = linhas.filter((item) => item.modulos.includes(moduloFiltro))
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <<Sidebar currentPath="/" /> />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              CRM de Pessoas
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Cadastro geral navegável da Secretaria com histórico consolidado por pessoa
            </p>
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Pessoas cadastradas
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Base única consolidada da Secretaria
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                Registros: {linhas.length}
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
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Vínculos</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((item) => (
                      <tr key={item.id} className="bg-slate-50">
                        <td className="rounded-l-2xl px-4 py-4 font-medium text-slate-900">
                          {item.nome}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatarTelefone(item.telefone)}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatarData(item.data_nascimento)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {item.modulos.length > 0 ? (
                              item.modulos.map((modulo) => (
                                <span
                                  key={`${item.id}-${modulo}`}
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
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            {item.totalVinculos}
                          </span>
                        </td>
                        <td className="rounded-r-2xl px-4 py-4">
                          <Link
                            href={`/pessoas/${item.id}`}
                            className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            Ver perfil
                          </Link>
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