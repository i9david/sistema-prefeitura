import { redirect } from 'next/navigation'
import { UserPlus, Users } from 'lucide-react'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuleCard } from '@/components/module/module-card'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuloBandaMunicipalNav } from '@/components/modulo-banda-municipal-nav'
import {
  ativarMusico,
  atualizarMusico,
  criarMusico,
  inativarMusico,
} from './actions'

type Musico = {
  id: string
  nome: string
  telefone: string | null
  data_nascimento: string | null
  instrumento_principal: string
  instrumento_secundario: string | null
  funcao: string | null
  bolsa_valor: number | null
  status: string
  observacoes: string | null
  created_at: string
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

function formatarMoeda(valor: number | null | undefined) {
  if (valor == null) return '-'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

export default async function BandaMusicosPage({
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
    .from('banda_municipal_musicos')
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
    redirect(`/banda-municipal/musicos?message=${encodeURIComponent(error.message)}`)
  }

  const musicos = (data ?? []) as Musico[]

  const musicoEditando = editarId
    ? musicos.find((musico) => musico.id === editarId)
    : null

  const mostrarFormulario = modoNovo || !!musicoEditando

  return (
    <ModuleLayout sidebar={<ModuloBandaMunicipalNav currentPath="/banda-municipal/musicos" />}>
      <ModuleHeader
        title="Músicos"
        eyebrow="Cadastros"
        description="Cadastro e gestão dos integrantes da Banda Municipal."
        icon={Users}
        accent="violet"
        context="Banda Municipal"
        action={
          !mostrarFormulario ? (
            <a href="/banda-municipal/musicos?novo=1" className="btn-primary w-full justify-center md:w-auto">
              <UserPlus size={16} aria-hidden="true" />
              Novo músico
            </a>
          ) : null
        }
      />

          {mostrarFormulario && (
            <ModuleCard>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900">
                  {musicoEditando ? 'Editar músico' : 'Novo músico'}
                </h2>

                <a
                  href="/banda-municipal/musicos"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Voltar para lista
                </a>
              </div>

              <form
                action={musicoEditando ? atualizarMusico : criarMusico}
                className="mt-6 grid gap-4"
              >
                {musicoEditando && (
                  <input type="hidden" name="id" value={musicoEditando.id} />
                )}

                <input
                  name="nome"
                  placeholder="Nome completo do músico"
                  required
                  defaultValue={musicoEditando?.nome ?? ''}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="telefone"
                    placeholder="Telefone com DDD"
                    defaultValue={musicoEditando?.telefone ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <input
                    name="data_nascimento"
                    type="date"
                    defaultValue={musicoEditando?.data_nascimento ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="instrumento_principal"
                    placeholder="Instrumento principal"
                    required
                    defaultValue={musicoEditando?.instrumento_principal ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <input
                    name="instrumento_secundario"
                    placeholder="Instrumento secundário"
                    defaultValue={musicoEditando?.instrumento_secundario ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="funcao"
                    placeholder="Função na banda"
                    defaultValue={musicoEditando?.funcao ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />

                  <input
                    name="bolsa_valor"
                    type="number"
                    step="0.01"
                    placeholder="Valor da bolsa"
                    defaultValue={musicoEditando?.bolsa_valor ?? ''}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <textarea
                  name="observacoes"
                  placeholder="Observações"
                  defaultValue={musicoEditando?.observacoes ?? ''}
                  className="min-h-[110px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <select
                  name="status"
                  required
                  defaultValue={musicoEditando?.status ?? 'ativo'}
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
                    className="rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                  >
                    {musicoEditando ? 'Atualizar músico' : 'Salvar músico'}
                  </button>

                  <a
                    href="/banda-municipal/musicos"
                    className="rounded-2xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancelar
                  </a>
                </div>
              </form>
            </ModuleCard>
          )}

          <ModuleCard>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Lista de músicos
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
                  className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
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

            {musicos.length > 0 ? (
              <div className="mt-6 space-y-4">
                {musicos.map((musico) => (
                  <div
                    key={musico.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {musico.nome}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {formatarTelefone(musico.telefone)}
                          </p>
                          <p className="text-sm text-slate-600">
                            Nascimento: {formatarData(musico.data_nascimento)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              musico.status === 'ativo'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {musico.status}
                          </span>

                          <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                            {musico.instrumento_principal}
                          </span>

                          {musico.instrumento_secundario && (
                            <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                              {musico.instrumento_secundario}
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-slate-700">
                          <p>
                            <span className="font-semibold">Função:</span>{' '}
                            {musico.funcao || '-'}
                          </p>
                          <p>
                            <span className="font-semibold">Bolsa:</span>{' '}
                            {formatarMoeda(musico.bolsa_valor)}
                          </p>
                          <p>
                            <span className="font-semibold">Observações:</span>{' '}
                            {musico.observacoes || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/banda-municipal/musicos?editar=${musico.id}${
                            busca ? `&busca=${encodeURIComponent(busca)}` : ''
                          }${
                            statusFiltro ? `&status=${encodeURIComponent(statusFiltro)}` : ''
                          }`}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Editar
                        </a>

                        {musico.status === 'ativo' ? (
                          <form action={inativarMusico}>
                            <input type="hidden" name="id" value={musico.id} />
                            <button
                              type="submit"
                              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                            >
                              Inativar
                            </button>
                          </form>
                        ) : (
                          <form action={ativarMusico}>
                            <input type="hidden" name="id" value={musico.id} />
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
                Nenhum músico encontrado.
              </p>
            )}
          </ModuleCard>
    </ModuleLayout>
  )
}
