import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModuloAdministrativoNav } from '@/components/modulo-administrativo-nav'
import {
  atualizarAcesso,
  criarAcesso,
  removerAcesso,
  criarUsuarioAdministrativo,
} from './actions'

type Usuario = {
  id: string
  nome: string | null
  email: string | null
  perfil: string | null
  status: string | null
  created_at: string | null
}

type Acesso = {
  id: string
  usuario_id: string | null
  modulo: string | null
  pode_visualizar: boolean | null
  pode_criar: boolean | null
  pode_editar: boolean | null
  pode_excluir: boolean | null
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function formatarData(data: string | null | undefined) {
  if (!data) return '-'

  const somenteData = data.slice(0, 10)
  const partes = somenteData.split('-')

  if (partes.length !== 3) return data

  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function statusClassName(status: string | null | undefined) {
  if (status === 'ativo') return 'bg-green-100 text-green-700'
  if (status === 'inativo') return 'bg-red-100 text-red-700'
  return 'bg-slate-200 text-slate-700'
}

const modulosSistema = [
  { value: 'centro-cultural', label: 'Centro Cultural' },
  { value: 'museu', label: 'Museu' },
  { value: 'casa-artesao', label: 'Casa do Artesão' },
  { value: 'banda-municipal', label: 'Banda Municipal' },
  { value: 'biblioteca', label: 'Biblioteca' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'turismo', label: 'Turismo' },
]

function getModuloLabel(valor: string | null | undefined) {
  const modulo = modulosSistema.find((item) => item.value === valor)
  return modulo?.label || valor || '-'
}

export default async function AdministrativoUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{
    busca?: string
    status?: string
    message?: string
    novo?: string
  }>
}) {
  const params = await searchParams
  const busca = params.busca?.trim() || ''
  const statusFiltro = params.status?.trim() || ''
  const modoNovo = params.novo === '1'

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let usuariosQuery = supabase
    .from('administrativo_usuarios')
    .select('id, nome, email, perfil, status, created_at')
    .order('nome', { ascending: true })

  if (busca) {
    usuariosQuery = usuariosQuery.or(
      `nome.ilike.%${busca}%,email.ilike.%${busca}%,perfil.ilike.%${busca}%`
    )
  }

  if (statusFiltro) {
    usuariosQuery = usuariosQuery.eq('status', statusFiltro)
  }

  const [
    { data: usuariosData, error: usuariosError },
    { data: acessosData, error: acessosError },
  ] = await Promise.all([
    usuariosQuery,
    supabase
      .from('administrativo_acessos')
      .select(`
        id,
        usuario_id,
        modulo,
        pode_visualizar,
        pode_criar,
        pode_editar,
        pode_excluir
      `)
      .order('modulo', { ascending: true }),
  ])

  const usuarios = (usuariosData ?? []) as Usuario[]
  const acessos = (acessosData ?? []) as Acesso[]

  const erro = usuariosError?.message || acessosError?.message || ''

  function acessosDoUsuario(usuarioId: string) {
    return acessos.filter((acesso) => acesso.usuario_id === usuarioId)
  }

  function modulosDisponiveis(usuarioId: string) {
    const acessosUsuario = acessosDoUsuario(usuarioId)
    const modulosJaUsados = acessosUsuario.map((acesso) => acesso.modulo)

    return modulosSistema.filter(
      (modulo) => !modulosJaUsados.includes(modulo.value)
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloAdministrativoNav currentPath="/administrativo/usuarios" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Usuários e Acessos
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Consulte usuários, cadastre novos usuários e edite permissões por módulo.
                </p>
              </div>

              {!modoNovo && (
                <a
                  href="/administrativo/usuarios?novo=1"
                  className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Novo usuário
                </a>
              )}
            </div>
          </div>

          {modoNovo && (
            <div className={cardClassName()}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Novo usuário
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Cadastre o usuário administrativo para depois liberar os acessos por módulo.
                  </p>
                </div>

                <a
                  href="/administrativo/usuarios"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Voltar para lista
                </a>
              </div>

              <form action={criarUsuarioAdministrativo} className="mt-6 grid gap-4">
                <input
                  name="nome"
                  placeholder="Nome completo"
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <input
                  name="email"
                  type="email"
                  placeholder="E-mail"
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    name="perfil"
                    defaultValue="operador"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="operador">Operador</option>
                    <option value="gestor">Gestor</option>
                    <option value="admin">Administrador</option>
                  </select>

                  <select
                    name="status"
                    defaultValue="ativo"
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

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                  >
                    Salvar usuário
                  </button>

                  <a
                    href="/administrativo/usuarios"
                    className="rounded-2xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancelar
                  </a>
                </div>
              </form>
            </div>
          )}

          <div className={cardClassName()}>
            <form method="get" className="grid gap-3 md:grid-cols-[1fr_220px_180px]">
              <input
                name="busca"
                defaultValue={busca}
                placeholder="Buscar por nome, e-mail ou perfil"
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />

              <select
                name="status"
                defaultValue={statusFiltro}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm"
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

            {params.message && !modoNovo && (
              <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {params.message}
              </p>
            )}

            {erro && (
              <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {erro}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Total de usuários</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {usuarios.length}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Usuários ativos</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {usuarios.filter((usuario) => usuario.status === 'ativo').length}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Acessos cadastrados</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {acessos.length}
              </p>
            </div>
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Lista de usuários
            </h2>

            {usuarios.length > 0 ? (
              <div className="mt-6 space-y-5">
                {usuarios.map((usuario) => {
                  const permissoes = acessosDoUsuario(usuario.id)
                  const disponiveis = modulosDisponiveis(usuario.id)

                  return (
                    <div
                      key={usuario.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {usuario.nome || 'Usuário sem nome'}
                          </h3>

                          <p className="mt-1 text-sm text-slate-600">
                            {usuario.email || '-'}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(
                                usuario.status
                              )}`}
                            >
                              {usuario.status || 'sem status'}
                            </span>

                            <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                              {usuario.perfil || 'sem perfil'}
                            </span>

                            <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                              Criado em {formatarData(usuario.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
                        <h4 className="text-sm font-bold text-slate-700">
                          Adicionar novo acesso
                        </h4>

                        {disponiveis.length > 0 ? (
                          <form
                            action={criarAcesso}
                            className="mt-3 grid gap-3 md:grid-cols-[1fr_180px]"
                          >
                            <input type="hidden" name="usuario_id" value={usuario.id} />

                            <select
                              name="modulo"
                              required
                              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                            >
                              <option value="">Selecione o módulo</option>
                              {disponiveis.map((modulo) => (
                                <option key={modulo.value} value={modulo.value}>
                                  {modulo.label}
                                </option>
                              ))}
                            </select>

                            <button
                              type="submit"
                              className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                            >
                              Criar acesso
                            </button>
                          </form>
                        ) : (
                          <p className="mt-3 text-sm text-slate-600">
                            Todos os módulos já foram vinculados a este usuário.
                          </p>
                        )}
                      </div>

                      <div className="mt-5">
                        <h4 className="text-sm font-bold text-slate-700">
                          Permissões por módulo
                        </h4>

                        {permissoes.length > 0 ? (
                          <div className="mt-3 space-y-3">
                            {permissoes.map((acesso) => (
                              <form
                                key={acesso.id}
                                action={atualizarAcesso}
                                className="rounded-3xl border border-slate-200 bg-white p-4"
                              >
                                <input type="hidden" name="id" value={acesso.id} />
                                <input type="hidden" name="usuario_id" value={usuario.id} />
                                <input
                                  type="hidden"
                                  name="modulo"
                                  value={acesso.modulo || ''}
                                />

                                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                  <div>
                                    <p className="text-base font-bold text-slate-900">
                                      {getModuloLabel(acesso.modulo)}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      Permissões individuais deste módulo
                                    </p>
                                  </div>

                                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <label className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                                      <input
                                        type="checkbox"
                                        name="pode_visualizar"
                                        defaultChecked={!!acesso.pode_visualizar}
                                      />
                                      Visualizar
                                    </label>

                                    <label className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                                      <input
                                        type="checkbox"
                                        name="pode_criar"
                                        defaultChecked={!!acesso.pode_criar}
                                      />
                                      Criar
                                    </label>

                                    <label className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                                      <input
                                        type="checkbox"
                                        name="pode_editar"
                                        defaultChecked={!!acesso.pode_editar}
                                      />
                                      Editar
                                    </label>

                                    <label className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                                      <input
                                        type="checkbox"
                                        name="pode_excluir"
                                        defaultChecked={!!acesso.pode_excluir}
                                      />
                                      Excluir
                                    </label>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="submit"
                                      className="rounded-2xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                                    >
                                      Salvar
                                    </button>

                                    <button
                                      formAction={removerAcesso}
                                      className="rounded-2xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                                    >
                                      Remover
                                    </button>
                                  </div>
                                </div>
                              </form>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                            Nenhum acesso cadastrado para este usuário.
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhum usuário encontrado.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}