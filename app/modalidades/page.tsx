import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"
import { createClient } from '@/lib/supabase/server'
import { ModuloCentroCulturalNav } from '@/components/modulo-centro-cultural-nav'
import { exigirPermissaoPagina } from '@/lib/seguranca-paginas'
import {
  ativarModalidade,
  atualizarModalidade,
  criarModalidade,
  inativarModalidade,
} from './actions'

type ProfessorRelacionado =
  | { id: string; nome: string }
  | { id: string; nome: string }[]
  | null

type VinculoProfessorModalidade = {
  id: string
  modalidade_id: string
  funcao: string
  professores: ProfessorRelacionado
}

function getProfessorNome(professores: ProfessorRelacionado) {
  if (!professores) return 'Professor'
  if (Array.isArray(professores)) return professores[0]?.nome ?? 'Professor'
  return professores.nome
}

function cardClassName() {
  return 'rounded-3xl border border-slate-200/80 bg-white/95 p-7 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'
}

export default async function ModalidadesPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    busca?: string
    editar?: string
    novo?: string
  }>
}) {
  await exigirPermissaoPagina('Centro Cultural', 'Modalidades', 'visualizar')

  const params = await searchParams
  const busca = params.busca?.trim() || ''
  const editarId = params.editar?.trim() || ''
  const modoNovo = params.novo === '1'

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let query = supabase
    .from('modalidades')
    .select('id, nome, descricao, status, created_at')
    .order('created_at', { ascending: false })

  if (busca) {
    query = query.ilike('nome', `%${busca}%`)
  }

  const { data: modalidades, error } = await query

  if (error) {
    redirect(`/modalidades?message=${encodeURIComponent(error.message)}`)
  }

  const { data: vinculosData, error: erroVinculos } = await supabase
    .from('modalidade_professores')
    .select(`
      id,
      modalidade_id,
      funcao,
      professores:professor_id ( id, nome )
    `)

  if (erroVinculos) {
    redirect(`/modalidades?message=${encodeURIComponent(erroVinculos.message)}`)
  }

  const vinculos = (vinculosData ?? []) as VinculoProfessorModalidade[]

  const modalidadeEditando = editarId
    ? modalidades?.find((modalidade) => modalidade.id === editarId)
    : null

  const mostrarFormulario = modoNovo || !!modalidadeEditando

  function professoresDaModalidade(modalidadeId: string) {
    const lista =
      vinculos
        .filter((vinculo) => vinculo.modalidade_id === modalidadeId)
        .map((vinculo) => {
          const nomeProfessor = getProfessorNome(vinculo.professores)
          const funcao = vinculo.funcao ? ` (${vinculo.funcao})` : ''
          return `${nomeProfessor}${funcao}`
        }) || []

    return lista
  }

  return (
    <main className="min-h-screen p-6 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCentroCulturalNav currentPath="/modalidades" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Modalidades
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Cadastre e organize todas as modalidades do Centro Cultural
                </p>
              </div>

              {!mostrarFormulario && (
                <a
                  href="/modalidades?novo=1"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:from-blue-700 hover:to-indigo-700"
                >
                  ➕ Nova modalidade
                </a>
              )}
            </div>
          </div>

          {mostrarFormulario && (
            <div className={cardClassName()}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900">
                  {modalidadeEditando ? 'Editar modalidade' : 'Nova modalidade'}
                </h2>

                <a
                  href="/modalidades"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Voltar para lista
                </a>
              </div>

              <form
                action={modalidadeEditando ? atualizarModalidade : criarModalidade}
                className="mt-6 grid gap-4"
              >
                {modalidadeEditando && (
                  <input type="hidden" name="id" value={modalidadeEditando.id} />
                )}

                <input
                  name="nome"
                  placeholder="Nome da modalidade"
                  required
                  defaultValue={modalidadeEditando?.nome ?? ''}
                  className="w-full rounded-2xl border px-4 py-3"
                />

                <textarea
                  name="descricao"
                  placeholder="Descrição"
                  defaultValue={modalidadeEditando?.descricao ?? ''}
                  className="min-h-28 w-full rounded-2xl border px-4 py-3"
                />

                <select
                  name="status"
                  required
                  className="w-full rounded-2xl border px-4 py-3"
                  defaultValue={modalidadeEditando?.status ?? ''}
                >
                  <option value="" disabled>
                    Selecione o status
                  </option>
                  <option value="ativa">Ativa</option>
                  <option value="inativa">Inativa</option>
                </select>

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
                    {modalidadeEditando ? 'Atualizar modalidade' : 'Salvar modalidade'}
                  </button>

                  <a
                    href="/modalidades"
                    className="rounded-2xl border border-slate-300 px-6 py-3 text-slate-700"
                  >
                    Cancelar
                  </a>
                </div>
              </form>
            </div>
          )}

          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Lista de modalidades
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Busque, edite, ative e inative modalidades
                </p>
              </div>

              <form method="get" className="flex w-full max-w-md gap-2">
                <input
                  type="text"
                  name="busca"
                  placeholder="Buscar por nome"
                  defaultValue={busca}
                  className="w-full rounded-2xl border px-4 py-3"
                />
                <button
                  type="submit"
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-white"
                >
                  Buscar
                </button>
              </form>
            </div>

            {params.message && !mostrarFormulario && (
              <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {params.message}
              </p>
            )}

            {modalidades && modalidades.length > 0 ? (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="px-4 py-3 text-left">Nome</th>
                      <th className="px-4 py-3 text-left">Descrição</th>
                      <th className="px-4 py-3 text-left">Professores vinculados</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {modalidades.map((modalidade) => {
                      const professores = professoresDaModalidade(modalidade.id)

                      return (
                        <tr key={modalidade.id} className="border-b">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {modalidade.nome}
                          </td>

                          <td className="px-4 py-3">
                            {modalidade.descricao || 'Sem descrição'}
                          </td>

                          <td className="px-4 py-3">
                            {professores.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {professores.map((professor, index) => (
                                  <span
                                    key={`${modalidade.id}-${index}`}
                                    className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                                  >
                                    {professor}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-500">Sem vínculo</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                                modalidade.status === 'ativa'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {modalidade.status}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-2">
                              <a
                                href={`/modalidades?editar=${modalidade.id}${
                                  busca ? `&busca=${encodeURIComponent(busca)}` : ''
                                }`}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-center text-slate-700"
                              >
                                Editar
                              </a>

                              {modalidade.status === 'ativa' ? (
                                <form action={inativarModalidade}>
                                  <input type="hidden" name="id" value={modalidade.id} />
                                  <button
                                    type="submit"
                                    className="w-full rounded-lg bg-red-600 px-3 py-2 text-white"
                                  >
                                    Inativar
                                  </button>
                                </form>
                              ) : (
                                <form action={ativarModalidade}>
                                  <input type="hidden" name="id" value={modalidade.id} />
                                  <button
                                    type="submit"
                                    className="w-full rounded-lg bg-green-600 px-3 py-2 text-white"
                                  >
                                    Ativar
                                  </button>
                                </form>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhuma modalidade encontrada.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}