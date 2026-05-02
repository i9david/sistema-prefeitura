import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModuloCentroCulturalNav } from '@/components/modulo-centro-cultural-nav'
import {
  atualizarVinculoProfessorAula,
  excluirVinculoProfessorAula,
  vincularProfessorNaAula,
} from './actions'

type RelacaoItem =
  | { id: string; nome: string }
  | { id: string; nome: string }[]
  | null

type Vinculo = {
  id: string
  funcao: string
  created_at: string
  aulas: RelacaoItem
  professores: RelacaoItem
}

function getRelacaoId(relacao: RelacaoItem) {
  if (!relacao) return ''
  if (Array.isArray(relacao)) return relacao[0]?.id ?? ''
  return relacao.id
}

function getRelacaoNome(relacao: RelacaoItem, fallback: string) {
  if (!relacao) return fallback
  if (Array.isArray(relacao)) return relacao[0]?.nome ?? fallback
  return relacao.nome
}

function cardClassName() {
  return 'rounded-3xl border border-slate-200/80 bg-white/95 p-7 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'
}

export default async function AulaProfessoresPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    editar?: string
    novo?: string
  }>
}) {
  const params = await searchParams
  const editarId = params.editar?.trim() || ''
  const modoNovo = params.novo === '1'

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: aulas, error: erroAulas },
    { data: professores, error: erroProfessores },
    { data: vinculosData, error: erroVinculos },
  ] = await Promise.all([
    supabase
      .from('aulas')
      .select('id, nome, status')
      .eq('status', 'ativa')
      .order('nome', { ascending: true }),

    supabase
      .from('professores')
      .select('id, nome, status')
      .eq('status', 'ativo')
      .order('nome', { ascending: true }),

    supabase
      .from('aula_professores')
      .select(`
        id,
        funcao,
        created_at,
        aulas:aula_id ( id, nome ),
        professores:professor_id ( id, nome )
      `)
      .order('created_at', { ascending: false }),
  ])

  if (erroAulas) {
    redirect(`/aula-professores?message=${encodeURIComponent(erroAulas.message)}`)
  }

  if (erroProfessores) {
    redirect(`/aula-professores?message=${encodeURIComponent(erroProfessores.message)}`)
  }

  if (erroVinculos) {
    redirect(`/aula-professores?message=${encodeURIComponent(erroVinculos.message)}`)
  }

  const vinculos = (vinculosData ?? []) as Vinculo[]

  const vinculoEditando = editarId
    ? vinculos.find((vinculo) => vinculo.id === editarId)
    : null

  const mostrarFormulario = modoNovo || !!vinculoEditando

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCentroCulturalNav currentPath="/aula-professores" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Professores x Aulas
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Vincule cada professor às suas turmas
                </p>
              </div>

              {!mostrarFormulario && (
                <a
                  href="/aula-professores?novo=1"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:from-blue-700 hover:to-indigo-700"
                >
                  ➕ Novo vínculo
                </a>
              )}
            </div>
          </div>

          {mostrarFormulario && (
            <div className={cardClassName()}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900">
                  {vinculoEditando ? 'Editar vínculo' : 'Novo vínculo'}
                </h2>

                <a
                  href="/aula-professores"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Voltar para lista
                </a>
              </div>

              <form
                action={vinculoEditando ? atualizarVinculoProfessorAula : vincularProfessorNaAula}
                className="mt-6 grid gap-4"
              >
                {vinculoEditando && (
                  <input type="hidden" name="id" value={vinculoEditando.id} />
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Aula
                  </label>
                  <select
                    name="aula_id"
                    required
                    className="w-full rounded-2xl border px-4 py-3"
                    defaultValue={getRelacaoId(vinculoEditando?.aulas ?? null)}
                  >
                    <option value="" disabled>
                      Selecione a aula
                    </option>
                    {aulas?.map((aula) => (
                      <option key={aula.id} value={aula.id}>
                        {aula.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Professor
                  </label>
                  <select
                    name="professor_id"
                    required
                    className="w-full rounded-2xl border px-4 py-3"
                    defaultValue={getRelacaoId(vinculoEditando?.professores ?? null)}
                  >
                    <option value="" disabled>
                      Selecione o professor
                    </option>
                    {professores?.map((professor) => (
                      <option key={professor.id} value={professor.id}>
                        {professor.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Função
                  </label>
                  <select
                    name="funcao"
                    required
                    className="w-full rounded-2xl border px-4 py-3"
                    defaultValue={vinculoEditando?.funcao ?? ''}
                  >
                    <option value="" disabled>
                      Selecione a função
                    </option>
                    <option value="principal">Principal</option>
                    <option value="auxiliar">Auxiliar</option>
                    <option value="monitor">Monitor</option>
                  </select>
                </div>

                {params.message && (
                  <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    {params.message}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="rounded-2xl bg-slate-900 px-6 py-3 text-white"
                  >
                    {vinculoEditando ? 'Atualizar vínculo' : 'Salvar vínculo'}
                  </button>

                  <a
                    href="/aula-professores"
                    className="rounded-2xl border border-slate-300 px-6 py-3 text-slate-700"
                  >
                    Cancelar
                  </a>
                </div>
              </form>
            </div>
          )}

          <div className={cardClassName()}>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Lista de vínculos
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Veja quais professores estão vinculados a quais aulas
              </p>
            </div>

            {params.message && !mostrarFormulario && (
              <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {params.message}
              </p>
            )}

            {vinculos.length > 0 ? (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="px-4 py-3 text-left">Aula</th>
                      <th className="px-4 py-3 text-left">Professor</th>
                      <th className="px-4 py-3 text-left">Função</th>
                      <th className="px-4 py-3 text-left">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {vinculos.map((vinculo) => (
                      <tr key={vinculo.id} className="border-b">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {getRelacaoNome(vinculo.aulas, 'Aula')}
                        </td>
                        <td className="px-4 py-3">
                          {getRelacaoNome(vinculo.professores, 'Professor')}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {vinculo.funcao}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2">
                            <a
                              href={`/aula-professores?editar=${vinculo.id}`}
                              className="rounded-lg border border-slate-300 px-3 py-2 text-center text-slate-700"
                            >
                              Editar
                            </a>

                            <form action={excluirVinculoProfessorAula}>
                              <input type="hidden" name="id" value={vinculo.id} />
                              <button
                                type="submit"
                                className="w-full rounded-lg bg-red-600 px-3 py-2 text-white"
                              >
                                Remover
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhum vínculo encontrado.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}