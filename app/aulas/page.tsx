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
  ativarAula,
  atualizarAula,
  criarAula,
  inativarAula,
} from './actions'

const diasSemana = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
]

type ModalidadeRelacionada =
  | { id: string; nome: string }
  | { id: string; nome: string }[]
  | null

type Aula = {
  id: string
  nome: string
  modalidade_id: string
  dia_semana: string
  horario_inicio: string
  horario_fim: string
  status: string
  created_at: string
  modalidades: ModalidadeRelacionada
}

function getModalidadeNome(modalidades: ModalidadeRelacionada) {
  if (!modalidades) return 'Sem modalidade'
  if (Array.isArray(modalidades)) return modalidades[0]?.nome ?? 'Sem modalidade'
  return modalidades.nome
}

function cardClassName() {
  return 'rounded-3xl border border-slate-200/80 bg-white/95 p-7 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'
}

export default async function AulasPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    busca?: string
    editar?: string
    novo?: string
  }>
}) {
  await exigirPermissaoPagina('Centro Cultural', 'Aulas', 'visualizar')

  const params = await searchParams
  const busca = params.busca?.trim() || ''
  const editarId = params.editar?.trim() || ''
  const modoNovo = params.novo === '1'

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const {
    data: modalidades,
    error: erroModalidades,
  } = await supabase
    .from('modalidades')
    .select('id, nome, status')
    .eq('status', 'ativa')
    .order('nome', { ascending: true })

  if (erroModalidades) {
    redirect(`/aulas?message=${encodeURIComponent(erroModalidades.message)}`)
  }

  let query = supabase
    .from('aulas')
    .select(`
      id,
      nome,
      modalidade_id,
      dia_semana,
      horario_inicio,
      horario_fim,
      status,
      created_at,
      modalidades:modalidade_id ( id, nome )
    `)
    .order('dia_semana', { ascending: true })
    .order('horario_inicio', { ascending: true })

  if (busca) {
    query = query.ilike('nome', `%${busca}%`)
  }

  const { data: aulasData, error } = await query

  if (error) {
    redirect(`/aulas?message=${encodeURIComponent(error.message)}`)
  }

  const aulas = (aulasData ?? []) as Aula[]

  const aulaEditando = editarId
    ? aulas.find((aula) => aula.id === editarId)
    : null

  const mostrarFormulario = modoNovo || !!aulaEditando

  function aulasDoDia(dia: string) {
    return aulas.filter((aula) => aula.dia_semana === dia)
  }

  return (
    <main className="min-h-screen p-6 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCentroCulturalNav currentPath="/aulas" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Grade de aulas
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Cadastre os dias e horários das aulas do Centro Cultural
                </p>
              </div>

              {!mostrarFormulario && (
                <a
                  href="/aulas?novo=1"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:from-blue-700 hover:to-indigo-700"
                >
                  ➕ Nova aula
                </a>
              )}
            </div>
          </div>

          {mostrarFormulario && (
            <div className={cardClassName()}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900">
                  {aulaEditando ? 'Editar aula' : 'Nova aula'}
                </h2>

                <a
                  href="/aulas"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Voltar para lista
                </a>
              </div>

              <form
                action={aulaEditando ? atualizarAula : criarAula}
                className="mt-6 grid gap-4"
              >
                {aulaEditando && (
                  <input type="hidden" name="id" value={aulaEditando.id} />
                )}

                <input
                  name="nome"
                  placeholder="Nome da aula ou turma"
                  required
                  defaultValue={aulaEditando?.nome ?? ''}
                  className="w-full rounded-2xl border px-4 py-3"
                />

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Modalidade
                  </label>
                  <select
                    name="modalidade_id"
                    required
                    className="w-full rounded-2xl border px-4 py-3"
                    defaultValue={aulaEditando?.modalidade_id ?? ''}
                  >
                    <option value="" disabled>
                      Selecione a modalidade
                    </option>
                    {modalidades?.map((modalidade) => (
                      <option key={modalidade.id} value={modalidade.id}>
                        {modalidade.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Dia da semana
                  </label>
                  <select
                    name="dia_semana"
                    required
                    className="w-full rounded-2xl border px-4 py-3"
                    defaultValue={aulaEditando?.dia_semana ?? ''}
                  >
                    <option value="" disabled>
                      Selecione o dia
                    </option>
                    {diasSemana.map((dia) => (
                      <option key={dia} value={dia}>
                        {dia}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Horário de início
                    </label>
                    <input
                      name="horario_inicio"
                      type="time"
                      required
                      defaultValue={aulaEditando?.horario_inicio ?? ''}
                      className="w-full rounded-2xl border px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Horário de fim
                    </label>
                    <input
                      name="horario_fim"
                      type="time"
                      required
                      defaultValue={aulaEditando?.horario_fim ?? ''}
                      className="w-full rounded-2xl border px-4 py-3"
                    />
                  </div>
                </div>

                <select
                  name="status"
                  required
                  className="w-full rounded-2xl border px-4 py-3"
                  defaultValue={aulaEditando?.status ?? ''}
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
                    {aulaEditando ? 'Atualizar aula' : 'Salvar aula'}
                  </button>

                  <a
                    href="/aulas"
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
                  Lista de aulas
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Busque, edite, ative e inative horários
                </p>
              </div>

              <form method="get" className="flex w-full max-w-md gap-2">
                <input
                  type="text"
                  name="busca"
                  placeholder="Buscar por nome da aula"
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

            {aulas.length > 0 ? (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="px-4 py-3 text-left">Aula</th>
                      <th className="px-4 py-3 text-left">Modalidade</th>
                      <th className="px-4 py-3 text-left">Dia</th>
                      <th className="px-4 py-3 text-left">Início</th>
                      <th className="px-4 py-3 text-left">Fim</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {aulas.map((aula) => (
                      <tr key={aula.id} className="border-b">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {aula.nome}
                        </td>
                        <td className="px-4 py-3">
                          {getModalidadeNome(aula.modalidades)}
                        </td>
                        <td className="px-4 py-3">{aula.dia_semana}</td>
                        <td className="px-4 py-3">{aula.horario_inicio}</td>
                        <td className="px-4 py-3">{aula.horario_fim}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                              aula.status === 'ativa'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {aula.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2">
                            <a
                              href={`/aulas?editar=${aula.id}${
                                busca ? `&busca=${encodeURIComponent(busca)}` : ''
                              }`}
                              className="rounded-lg border border-slate-300 px-3 py-2 text-center text-slate-700"
                            >
                              Editar
                            </a>

                            {aula.status === 'ativa' ? (
                              <form action={inativarAula}>
                                <input type="hidden" name="id" value={aula.id} />
                                <button
                                  type="submit"
                                  className="w-full rounded-lg bg-red-600 px-3 py-2 text-white"
                                >
                                  Inativar
                                </button>
                              </form>
                            ) : (
                              <form action={ativarAula}>
                                <input type="hidden" name="id" value={aula.id} />
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
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhuma aula encontrada.
              </p>
            )}
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold text-slate-900">
              Grade semanal
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Visualização dos dias e horários das aulas
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {diasSemana.map((dia) => {
                const lista = aulasDoDia(dia)

                return (
                  <div
                    key={dia}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <h3 className="text-lg font-bold text-slate-900">{dia}</h3>

                    {lista.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        {lista.map((aula) => (
                          <div
                            key={aula.id}
                            className="rounded-2xl bg-white p-4 shadow-sm"
                          >
                            <p className="font-semibold text-slate-900">
                              {aula.nome}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {getModalidadeNome(aula.modalidades)}
                            </p>
                            <p className="mt-2 text-sm font-medium text-slate-800">
                              {aula.horario_inicio} às {aula.horario_fim}
                            </p>
                            <p className="mt-2">
                              <span
                                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                                  aula.status === 'ativa'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {aula.status}
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">
                        Nenhuma aula cadastrada
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}