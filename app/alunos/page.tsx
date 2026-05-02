import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModuloCentroCulturalNav } from '@/components/modulo-centro-cultural-nav'
import { exigirPermissaoPagina } from '@/lib/seguranca-paginas'
import {
  ativarAluno,
  atualizarAluno,
  criarAluno,
  inativarAluno,
} from './actions'

type ModalidadeRelacionada =
  | { id: string; nome: string }
  | { id: string; nome: string }[]
  | null

type AulaRelacionada =
  | {
      id: string
      nome: string
      modalidade_id: string
      dia_semana: string
      horario_inicio: string
      horario_fim: string
      modalidades: ModalidadeRelacionada
    }
  | {
      id: string
      nome: string
      modalidade_id: string
      dia_semana: string
      horario_inicio: string
      horario_fim: string
      modalidades: ModalidadeRelacionada
    }[]
  | null

type Aluno = {
  id: string
  nome: string
  telefone: string | null
  data_nascimento: string | null
  aula_id: string
  status: string
  biometria_cadastrada: boolean
  aulas: AulaRelacionada
}

type AulaOpcao = {
  id: string
  nome: string
  modalidade_id: string
  dia_semana: string
  horario_inicio: string
  horario_fim: string
  status: string
  modalidades: ModalidadeRelacionada
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function getNomeRelacao(relacao: ModalidadeRelacionada, fallback = '-') {
  if (!relacao) return fallback
  if (Array.isArray(relacao)) return relacao[0]?.nome ?? fallback
  return relacao.nome
}

function getAula(aluno: Aluno) {
  if (!aluno.aulas) return null
  if (Array.isArray(aluno.aulas)) return aluno.aulas[0] ?? null
  return aluno.aulas
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

function getDescricaoAula(aula: AulaOpcao) {
  const modalidadeNome = getNomeRelacao(aula.modalidades, 'Sem modalidade')
  return `${aula.nome} • ${modalidadeNome} • ${aula.dia_semana} • ${aula.horario_inicio} às ${aula.horario_fim}`
}

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    busca?: string
    editar?: string
    novo?: string
    aula_id?: string
    status?: string
  }>
}) {
  await exigirPermissaoPagina('Centro Cultural', 'Alunos', 'visualizar')

  const params = await searchParams
  const busca = params.busca?.trim() || ''
  const editarId = params.editar?.trim() || ''
  const modoNovo = params.novo === '1'
  const aulaFiltro = params.aula_id?.trim() || ''
  const statusFiltro = params.status?.trim() || ''

  const supabase = await createClient()

  const { data: aulasData, error: aulasError } = await supabase
    .from('aulas')
    .select(`
      id,
      nome,
      modalidade_id,
      dia_semana,
      horario_inicio,
      horario_fim,
      status,
      modalidades:modalidade_id ( id, nome )
    `)
    .eq('status', 'ativa')
    .order('nome', { ascending: true })

  if (aulasError) {
    redirect(`/alunos?message=${encodeURIComponent(aulasError.message)}`)
  }

  let query = supabase
    .from('alunos')
    .select(`
      id,
      nome,
      telefone,
      data_nascimento,
      aula_id,
      status,
      biometria_cadastrada,
      aulas:aula_id (
        id,
        nome,
        modalidade_id,
        dia_semana,
        horario_inicio,
        horario_fim,
        modalidades:modalidade_id ( id, nome )
      )
    `)
    .order('nome', { ascending: true })

  if (busca) query = query.ilike('nome', `%${busca}%`)
  if (aulaFiltro) query = query.eq('aula_id', aulaFiltro)
  if (statusFiltro) query = query.eq('status', statusFiltro)

  const { data: alunosData, error } = await query

  if (error) {
    redirect(`/alunos?message=${encodeURIComponent(error.message)}`)
  }

  const aulas = (aulasData ?? []) as AulaOpcao[]
  const alunos = (alunosData ?? []) as Aluno[]

  const alunoEditando = editarId
    ? alunos.find((aluno) => aluno.id === editarId)
    : null

  const mostrarFormulario = modoNovo || !!alunoEditando

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCentroCulturalNav currentPath="/alunos" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Alunos
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Cadastro e gestão dos alunos do Centro Cultural
                </p>
              </div>

              {!mostrarFormulario && (
                <a
                  href="/alunos?novo=1"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Novo aluno
                </a>
              )}
            </div>
          </div>

          {mostrarFormulario && (
            <div className={cardClassName()}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {alunoEditando ? 'Editar aluno' : 'Novo aluno'}
                </h2>

                <a
                  href="/alunos"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Voltar para lista
                </a>
              </div>

              <form
                action={alunoEditando ? atualizarAluno : criarAluno}
                className="mt-6 grid gap-4"
              >
                {alunoEditando && (
                  <input type="hidden" name="id" value={alunoEditando.id} />
                )}

                <input
                  name="nome"
                  placeholder="Nome completo do aluno"
                  required
                  defaultValue={alunoEditando?.nome ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="telefone"
                    placeholder="Telefone"
                    defaultValue={alunoEditando?.telefone ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <input
                    name="data_nascimento"
                    type="date"
                    defaultValue={alunoEditando?.data_nascimento ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Turma
                  </label>
                  <select
                    name="aula_id"
                    required
                    defaultValue={alunoEditando?.aula_id ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="" disabled>
                      Selecione a turma
                    </option>
                    {aulas.map((aula) => (
                      <option key={aula.id} value={aula.id}>
                        {getDescricaoAula(aula)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <select
                    name="status"
                    required
                    defaultValue={alunoEditando?.status ?? 'ativo'}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
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
                    className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    {alunoEditando ? 'Atualizar aluno' : 'Salvar aluno'}
                  </button>

                  <a
                    href="/alunos"
                    className="rounded-2xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Lista de alunos
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Busque, filtre, edite, ative e inative registros
                </p>
              </div>

              <form method="get" className="grid w-full max-w-5xl gap-2 md:grid-cols-4">
                <input
                  type="text"
                  name="busca"
                  placeholder="Buscar por nome"
                  defaultValue={busca}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />

                <select
                  name="aula_id"
                  defaultValue={aulaFiltro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todas as turmas</option>
                  {aulas.map((aula) => (
                    <option key={aula.id} value={aula.id}>
                      {aula.nome}
                    </option>
                  ))}
                </select>

                <select
                  name="status"
                  defaultValue={statusFiltro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todos os status</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>

                <button
                  type="submit"
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
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

            {alunos.length > 0 ? (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Nome</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Telefone</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Nascimento</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Modalidade</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Turma</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Biometria</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {alunos.map((aluno) => {
                      const aula = getAula(aluno)

                      return (
                        <tr key={aluno.id} className="bg-slate-50">
                          <td className="rounded-l-2xl px-4 py-4 font-medium text-slate-900">
                            {aluno.nome}
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {formatarTelefone(aluno.telefone)}
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {formatarData(aluno.data_nascimento)}
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {aula ? getNomeRelacao(aula.modalidades, '-') : '-'}
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {aula?.nome || '-'}
                          </td>

                          <td className="px-4 py-4">
                            {aluno.biometria_cadastrada ? (
                              <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                Biometria cadastrada
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                Sem biometria
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                aluno.status === 'ativo'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {aluno.status}
                            </span>
                          </td>

                          <td className="rounded-r-2xl px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <a
                                href={`/alunos?editar=${aluno.id}${
                                  busca ? `&busca=${encodeURIComponent(busca)}` : ''
                                }${
                                  aulaFiltro ? `&aula_id=${encodeURIComponent(aulaFiltro)}` : ''
                                }${
                                  statusFiltro ? `&status=${encodeURIComponent(statusFiltro)}` : ''
                                }`}
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                Editar
                              </a>

                              <a
                                href={`/alunos/biometria/${aluno.id}`}
                                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                              >
                                Biometria
                              </a>

                              {aluno.status === 'ativo' ? (
                                <form action={inativarAluno}>
                                  <input type="hidden" name="id" value={aluno.id} />
                                  <button
                                    type="submit"
                                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                                  >
                                    Inativar
                                  </button>
                                </form>
                              ) : (
                                <form action={ativarAluno}>
                                  <input type="hidden" name="id" value={aluno.id} />
                                  <button
                                    type="submit"
                                    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
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
                Nenhum aluno encontrado.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}