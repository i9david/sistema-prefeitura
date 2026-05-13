import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { Sidebar } from "@/components/sidebar"
import { PageEmptyState, PageFilters, PageList, PageShell } from '@/components/page-shell'
import { FormMessage, SelectInput, TextInput } from '@/components/form'

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
    <PageShell
      nav={<Sidebar currentPath="/" />}
      title="CRM de Pessoas"
      subtitle="Cadastro geral navegável da Secretaria com histórico consolidado por pessoa."
      primaryAction={null}
    >
      <PageFilters>
        <form method="get" className="grid gap-4 md:grid-cols-[1fr_260px_140px]">
              <TextInput
                type="text"
                name="busca"
                placeholder="Buscar por nome"
                defaultValue={busca}
              />

              <SelectInput
                name="modulo"
                defaultValue={moduloFiltro}
              >
                <option value="">Todos os módulos</option>
                <option value="Centro Cultural">Centro Cultural</option>
                <option value="Visitantes">Visitantes</option>
                <option value="Biblioteca">Biblioteca</option>
              </SelectInput>

              <button
                type="submit"
                className="btn-primary"
              >
                Filtrar
              </button>
        </form>

        {params.message && (
          <div className="mt-4">
            <FormMessage>{params.message}</FormMessage>
          </div>
        )}
      </PageFilters>

      <PageList
        title="Pessoas cadastradas"
        subtitle="Base única consolidada da Secretaria."
        meta={
          <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
            Registros: {linhas.length}
          </div>
        }
      >

            {linhas.length > 0 ? (
              <div className="overflow-x-auto">
                <table>
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
                            className="btn-primary py-2"
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
              <PageEmptyState>
                Nenhuma pessoa encontrada.
              </PageEmptyState>
            )}
      </PageList>
    </PageShell>
  )
}
