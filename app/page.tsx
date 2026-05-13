import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import {
  Building2,
  Landmark,
  Palette,
  Music,
  Map,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  LogOut,
  UserCircle,
  FolderKanban,
  PackageSearch,
} from 'lucide-react'
import { buscarContextoNavegacao } from '@/lib/menu'
import { logout } from '@/app/logout/actions'
import { getTenantPath } from '@/lib/tenant-paths-server'

function pode(modulos: string[], modulo: string) {
  return modulos.includes(modulo)
}

function getNomeUsuario(email?: string) {
  if (!email) return 'Usuário'
  return email.split('@')[0]
}

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const contextoNavegacao = await buscarContextoNavegacao(user)
  const modulosPermitidos = contextoNavegacao.modulosPermitidos
  const podeGestaoExecutiva = contextoNavegacao.podeGestaoExecutiva

  const modulos = [
    {
      nome: 'Centro Cultural',
      descricao: 'Gestão de alunos, aulas, professores, frequência e visitantes.',
      href: '/centro-cultural',
      permissao: 'centro-cultural',
      icon: Building2,
      cor: 'text-blue-700 bg-blue-50 ring-1 ring-blue-100',
    },
    {
      nome: 'Museu',
      descricao: 'Controle de acervo, categorias, peças e memória histórica.',
      href: '/centro-cultural/museu',
      permissao: 'museu',
      icon: Landmark,
      cor: 'text-violet-700 bg-violet-50 ring-1 ring-violet-100',
    },
    {
      nome: 'Casa do Artesão',
      descricao: 'Artesãos, produtos, estoque, vendas e caixa.',
      href: '/casa-artesao',
      permissao: 'casa-artesao',
      icon: Palette,
      cor: 'text-amber-700 bg-amber-50 ring-1 ring-amber-100',
    },
    {
      nome: 'Banda Municipal',
      descricao: 'Músicos, instrumentos, frequência e atividades.',
      href: '/banda-municipal',
      permissao: 'banda-municipal',
      icon: Music,
      cor: 'text-rose-700 bg-rose-50 ring-1 ring-rose-100',
    },
    {
      nome: 'Turismo',
      descricao: 'Pontos turísticos, demandas, visitantes e BI turístico.',
      href: '/turismo',
      permissao: 'turismo',
      icon: Map,
      cor: 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-100',
    },
    {
      nome: 'Projetos e Captação',
      descricao:
        'Carteira de projetos, análise técnica, fontes de recursos e oportunidades de captação.',
      href: '/projetos-captacao',
      permissao: 'projetos-captacao',
      icon: FolderKanban,
      cor: 'text-purple-700 bg-purple-50 ring-1 ring-purple-100',
    },
    {
      nome: 'Almoxarifado',
      descricao: 'Categorias, produtos, estoque mínimo e movimentações de materiais.',
      href: '/almoxarifado',
      permissao: 'almoxarifado',
      icon: PackageSearch,
      cor: 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-100',
    },
    {
      nome: 'Administrativo',
      descricao: 'Usuários, acessos, configurações e controle geral.',
      href: '/administrativo',
      permissao: 'administrativo',
      icon: ShieldCheck,
      cor: 'text-slate-800 bg-slate-100 ring-1 ring-slate-200',
    },
  ]

  const modulosVisiveis = modulos.filter((modulo) =>
    pode(modulosPermitidos, modulo.permissao)
  )

  return (
    <main className="app-shell">
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Prefeitura de Mineiros
            </p>
            <h1 className="mt-1 text-xl font-bold text-slate-950">
              Secretaria de Cultura e Turismo
            </h1>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="btn-danger"
            >
              <LogOut size={16} />
              Sair
            </button>
          </form>
        </div>
      </div>

      <div className="app-container">
        <section className="ui-card-elevated overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-950 px-5 py-6 text-white sm:px-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                  Sistema de Gestão Institucional
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">
                  Painel Administrativo
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Ambiente integrado para organização das ações, controle dos módulos,
                  acompanhamento administrativo e tomada de decisão da Secretaria.
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                <div className="flex items-center gap-3">
                  <UserCircle size={34} />
                  <div>
                    <p className="text-xs text-slate-300">Usuário conectado</p>
                    <p className="text-sm font-bold">
                      {getNomeUsuario(user.email)}
                    </p>
                    <p className="text-xs text-slate-300">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-600">
                Módulos liberados
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {modulosVisiveis.length}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-600">
                Total de módulos
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {modulos.length}
              </p>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-sm font-medium text-emerald-700">
                Status do sistema
              </p>
              <p className="mt-2 text-3xl font-bold text-emerald-800">
                Online
              </p>
            </div>
          </div>
        </section>

        {podeGestaoExecutiva && (
          <section className="mt-6">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                Gestão Executiva
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">
                Área estratégica
              </h2>
            </div>

            <Link
              href={getTenantPath('/dashboard')}
              className="group block overflow-hidden rounded-lg border border-blue-200 bg-white shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[var(--shadow-card)]"
            >
              <div className="grid gap-0 lg:grid-cols-[1fr_260px]">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                      <BarChart3 size={24} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                        Exclusivo para admin e gestor
                      </p>
                      <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                        Dashboard Executivo
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        Indicadores consolidados para acompanhamento institucional,
                        prestação de contas e tomada de decisão da gestão pública.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700">
                    Abrir painel estratégico
                    <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                  </div>
                </div>

                <div className="border-t border-blue-100 bg-blue-50 p-6 lg:border-l lg:border-t-0">
                  <p className="text-sm font-semibold text-blue-900">
                    Área separada da operação diária para leitura executiva dos dados.
                  </p>
                  <p className="mt-3 text-xs leading-5 text-blue-700">
                    Acesso liberado somente para perfis com responsabilidade de gestão.
                  </p>
                </div>
              </div>
            </Link>
          </section>
        )}

        <section className="mt-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Áreas do sistema
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">
                Módulos disponíveis
              </h2>
            </div>
          </div>

          {modulosVisiveis.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {modulosVisiveis.map((modulo) => {
                const Icon = modulo.icon
                return (
                  <Link
                    key={modulo.href}
                    href={getTenantPath(modulo.href)}
                    className="ui-card group block p-5 transition hover:border-blue-200 hover:shadow-[var(--shadow-card)]"
                  >
                    <div className={`flex size-12 items-center justify-center rounded-lg ${modulo.cor}`}>
                      <Icon size={24} />
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-slate-950">
                      {modulo.nome}
                    </h3>
                    <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                      {modulo.descricao}
                    </p>

                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700">
                      Acessar
                      <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
              Nenhum módulo liberado
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
