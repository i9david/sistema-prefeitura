import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { Sidebar } from "@/components/sidebar"
import { ModuloCentroCulturalNav } from '@/components/modulo-centro-cultural-nav'
import { exigirPermissaoPagina } from '@/lib/seguranca-paginas'
import { PageEmptyState, PageFilters, PageList, PageShell } from '@/components/page-shell'
import {
  FormActions,
  FormField,
  FormMessage,
  SelectInput,
  TextAreaInput,
  TextInput,
} from '@/components/form'
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
  return 'ui-card p-5'
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
      professores:professor_id!modalidade_professores_professor_id_fkey ( id, nome )
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
    <PageShell
      nav={<ModuloCentroCulturalNav currentPath="/modalidades" />}
      title="Modalidades"
      subtitle="Cadastre e organize todas as modalidades do Centro Cultural."
      primaryAction={
        !mostrarFormulario
          ? { label: 'Nova modalidade', href: '/modalidades?novo=1' }
          : null
      }
    >

          {mostrarFormulario && (
            <div className={cardClassName()}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900">
                  {modalidadeEditando ? 'Editar modalidade' : 'Nova modalidade'}
                </h2>

                <a
                  href="/modalidades"
                  className="btn-secondary"
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

                <FormField label="Nome da modalidade">
                  <TextInput
                    name="nome"
                    placeholder="Ex: Ballet, violão, teatro"
                    required
                    defaultValue={modalidadeEditando?.nome ?? ''}
                  />
                </FormField>

                <FormField label="Descrição" hint="Use uma descrição curta para orientar equipe e relatórios.">
                  <TextAreaInput
                    name="descricao"
                    placeholder="Descreva a modalidade"
                    defaultValue={modalidadeEditando?.descricao ?? ''}
                  />
                </FormField>

                <FormField label="Status">
                  <SelectInput
                    name="status"
                    required
                    defaultValue={modalidadeEditando?.status ?? ''}
                  >
                    <option value="" disabled>
                      Selecione o status
                    </option>
                    <option value="ativa">Ativa</option>
                    <option value="inativa">Inativa</option>
                  </SelectInput>
                </FormField>

                <FormMessage>{params.message}</FormMessage>

                <FormActions>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {modalidadeEditando ? 'Atualizar modalidade' : 'Salvar modalidade'}
                  </button>

                  <a
                    href="/modalidades"
                    className="btn-secondary"
                  >
                    Cancelar
                  </a>
                </FormActions>
              </form>
            </div>
          )}

          <PageFilters>
              <form method="get" className="flex w-full max-w-md gap-2">
                <TextInput
                  type="text"
                  name="busca"
                  placeholder="Buscar por nome"
                  defaultValue={busca}
                />
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Buscar
                </button>
              </form>

            {params.message && !mostrarFormulario && (
              <div className="mt-4">
                <FormMessage>{params.message}</FormMessage>
              </div>
            )}
          </PageFilters>

          <PageList
            title="Lista de modalidades"
            subtitle="Busque, edite, ative e inative modalidades."
          >
            {modalidades && modalidades.length > 0 ? (
              <div className="overflow-x-auto">
                <table>
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
                                className="btn-secondary py-2"
                              >
                                Editar
                              </a>

                              {modalidade.status === 'ativa' ? (
                                <form action={inativarModalidade}>
                                  <input type="hidden" name="id" value={modalidade.id} />
                                  <button
                                    type="submit"
                                    className="btn-danger w-full py-2"
                                  >
                                    Inativar
                                  </button>
                                </form>
                              ) : (
                                <form action={ativarModalidade}>
                                  <input type="hidden" name="id" value={modalidade.id} />
                                  <button
                                    type="submit"
                                    className="w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white"
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
              <PageEmptyState>
                Nenhuma modalidade encontrada.
              </PageEmptyState>
            )}
          </PageList>
    </PageShell>
  )
}
