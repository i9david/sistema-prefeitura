import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModuloCasaArtesaoNav } from '@/components/modulo-casa-artesao-nav'
import {
  ativarArtesao,
  atualizarArtesao,
  criarArtesao,
  inativarArtesao,
} from './actions'

type Artesao = {
  id: string
  nome: string
  telefone: string | null
  chave_pix: string | null
  tipo_chave_pix: string | null
  observacoes: string | null
  status: string
  created_at: string
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

export default async function CasaArtesaoArtesaosPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    busca?: string
    editar?: string
    novo?: string
    status?: string
  }>
}) {
  const params = await searchParams
  const busca = params.busca?.trim() || ''
  const editarId = params.editar?.trim() || ''
  const modoNovo = params.novo === '1'
  const statusFiltro = params.status?.trim() || ''

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let query = supabase
    .from('casa_artesao_artesaos')
    .select('*')
    .order('created_at', { ascending: false })

  if (busca) {
    query = query.ilike('nome', `%${busca}%`)
  }

  if (statusFiltro) {
    query = query.eq('status', statusFiltro)
  }

  const { data, error } = await query

  if (error) {
    redirect(`/casa-artesao/artesaos?message=${encodeURIComponent(error.message)}`)
  }

  const artesaos = (data ?? []) as Artesao[]

  const artesaoEditando = editarId
    ? artesaos.find((artesao) => artesao.id === editarId)
    : null

  const mostrarFormulario = modoNovo || !!artesaoEditando

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCasaArtesaoNav currentPath="/casa-artesao/artesaos" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Artesãos
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Cadastro e gestão dos artesãos vinculados à Casa do Artesão.
                </p>
              </div>

              {!mostrarFormulario && (
                <a
                  href="/casa-artesao/artesaos?novo=1"
                  className="inline-flex rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
                >
                  Novo artesão
                </a>
              )}
            </div>
          </div>

          {mostrarFormulario && (
            <div className={cardClassName()}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900">
                  {artesaoEditando ? 'Editar artesão' : 'Novo artesão'}
                </h2>

                <a
                  href="/casa-artesao/artesaos"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Voltar para lista
                </a>
              </div>

              <form
                action={artesaoEditando ? atualizarArtesao : criarArtesao}
                className="mt-6 grid gap-4"
              >
                {artesaoEditando && (
                  <input type="hidden" name="id" value={artesaoEditando.id} />
                )}

                <input
                  name="nome"
                  placeholder="Nome completo do artesão"
                  required
                  defaultValue={artesaoEditando?.nome ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <input
                  name="telefone"
                  placeholder="Telefone com DDD"
                  defaultValue={artesaoEditando?.telefone ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="chave_pix"
                    placeholder="Chave Pix"
                    defaultValue={artesaoEditando?.chave_pix ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <select
                    name="tipo_chave_pix"
                    defaultValue={artesaoEditando?.tipo_chave_pix ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="">Tipo da chave Pix</option>
                    <option value="cpf">CPF</option>
                    <option value="telefone">Telefone</option>
                    <option value="email">E-mail</option>
                    <option value="aleatoria">Aleatória</option>
                  </select>
                </div>

                <textarea
                  name="observacoes"
                  placeholder="Observações"
                  defaultValue={artesaoEditando?.observacoes ?? ''}
                  className="min-h-[110px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <select
                  name="status"
                  required
                  defaultValue={artesaoEditando?.status ?? 'ativo'}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>

                {params.message && (
                  <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    {params.message}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="rounded-2xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
                  >
                    {artesaoEditando ? 'Atualizar artesão' : 'Salvar artesão'}
                  </button>

                  <a
                    href="/casa-artesao/artesaos"
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
                  Lista de artesãos
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Busque, edite, ative e inative registros
                </p>
              </div>

              <form method="get" className="grid w-full max-w-4xl gap-2 md:grid-cols-3">
                <input
                  type="text"
                  name="busca"
                  placeholder="Buscar por nome"
                  defaultValue={busca}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />

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
                  className="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
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

            {artesaos.length > 0 ? (
              <div className="mt-6 space-y-4">
                {artesaos.map((artesao) => (
                  <div
                    key={artesao.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {artesao.nome}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {formatarTelefone(artesao.telefone)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              artesao.status === 'ativo'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {artesao.status}
                          </span>
                        </div>

                        <div className="text-sm text-slate-700">
                          <p>
                            <span className="font-semibold">Chave Pix:</span>{' '}
                            {artesao.chave_pix || '-'}
                          </p>
                          <p>
                            <span className="font-semibold">Tipo da chave:</span>{' '}
                            {artesao.tipo_chave_pix || '-'}
                          </p>
                          <p>
                            <span className="font-semibold">Observações:</span>{' '}
                            {artesao.observacoes || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/casa-artesao/artesaos?editar=${artesao.id}${
                            busca ? `&busca=${encodeURIComponent(busca)}` : ''
                          }${
                            statusFiltro ? `&status=${encodeURIComponent(statusFiltro)}` : ''
                          }`}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Editar
                        </a>

                        {artesao.status === 'ativo' ? (
                          <form action={inativarArtesao}>
                            <input type="hidden" name="id" value={artesao.id} />
                            <button
                              type="submit"
                              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                            >
                              Inativar
                            </button>
                          </form>
                        ) : (
                          <form action={ativarArtesao}>
                            <input type="hidden" name="id" value={artesao.id} />
                            <button
                              type="submit"
                              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                            >
                              Ativar
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhum artesão encontrado.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}