import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  Landmark,
  Palette,
  Music,
  Map,
  ShieldCheck,
  ArrowRight,
  LogOut,
  CheckCircle2,
  Grid3X3,
  UserCircle,
  FolderKanban,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { buscarModulosPermitidos } from '@/lib/menu'
import { logout } from '@/app/logout/actions'

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

  const modulosPermitidos = await buscarModulosPermitidos()

  const modulos = [
    {
      nome: 'Centro Cultural',
      descricao: 'Gestão de alunos, aulas, professores, frequência e visitantes.',
      href: '/centro-cultural',
      permissao: 'centro-cultural',
      icon: Building2,
      cor: 'text-blue-700 bg-blue-50 border-blue-100',
    },
    {
      nome: 'Museu',
      descricao: 'Controle de acervo, categorias, peças e memória histórica.',
      href: '/centro-cultural/museu',
      permissao: 'museu',
      icon: Landmark,
      cor: 'text-violet-700 bg-violet-50 border-violet-100',
    },
    {
      nome: 'Casa do Artesão',
      descricao: 'Artesãos, produtos, estoque, vendas e caixa.',
      href: '/casa-artesao',
      permissao: 'casa-artesao',
      icon: Palette,
      cor: 'text-amber-700 bg-amber-50 border-amber-100',
    },
    {
      nome: 'Banda Municipal',
      descricao: 'Músicos, instrumentos, frequência e atividades.',
      href: '/banda-municipal',
      permissao: 'banda-municipal',
      icon: Music,
      cor: 'text-rose-700 bg-rose-50 border-rose-100',
    },
    {
      nome: 'Turismo',
      descricao: 'Pontos turísticos, demandas, visitantes e BI turístico.',
      href: '/turismo',
      permissao: 'turismo',
      icon: Map,
      cor: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    },
    {
  nome: 'Projetos e Captação',
  descricao: 'Carteira de projetos, análise técnica, fontes de recursos e oportunidades de captação.',
  href: '/projetos-captacao',
  permissao: 'projetos-captacao',
  icon: FolderKanban,
  cor: 'text-purple-700 bg-purple-50 border-purple-100',
},
    {
      nome: 'Administrativo',
      descricao: 'Usuários, acessos, configurações e controle geral.',
      href: '/administrativo',
      permissao: 'administrativo',
      icon: ShieldCheck,
      cor: 'text-slate-800 bg-slate-100 border-slate-200',
    },
  ]

  const modulosVisiveis = modulos.filter((modulo) =>
    pode(modulosPermitidos, modulo.permissao)
  )

  return (
    <main className="min-h-screen bg-[#f4f6f8]">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
              Prefeitura de Mineiros
            </p>
            <h1 className="text-xl font-bold text-slate-900">
              Secretaria de Cultura e Turismo
            </h1>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              <LogOut size={16} />
              Sair
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-200 bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 px-7 py-7 text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">
                  Sistema de Gestão Institucional
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight">
                  Painel Administrativo
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50">
                  Ambiente integrado para organização das ações, controle dos módulos,
                  acompanhamento administrativo e tomada de decisão da Secretaria.
                </p>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <UserCircle size={34} />
                  <div>
                    <p className="text-xs text-blue-100">Usuário conectado</p>
                    <p className="text-sm font-bold">{getNomeUsuario(user.email)}</p>
                    <p className="text-xs text-blue-100">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">
                  Módulos liberados
                </p>
                <Grid3X3 size={20} className="text-blue-700" />
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {modulosVisiveis.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">
                  Total de módulos
                </p>
                <ShieldCheck size={20} className="text-slate-700" />
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {modulos.length}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-emerald-700">
                  Status do sistema
                </p>
                <CheckCircle2 size={20} className="text-emerald-700" />
              </div>
              <p className="mt-2 text-3xl font-bold text-emerald-800">
                Online
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                Acesso aos módulos
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Módulos disponíveis
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Selecione uma área para iniciar o atendimento, consulta ou gestão.
              </p>
            </div>
          </div>

          {modulosVisiveis.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {modulosVisiveis.map((modulo) => {
                const Icon = modulo.icon

                return (
                  <Link
                    key={modulo.href}
                    href={modulo.href}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${modulo.cor}`}
                      >
                        <Icon size={22} />
                      </div>

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:bg-blue-700 group-hover:text-white">
                        <ArrowRight size={17} />
                      </div>
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-slate-900">
                      {modulo.nome}
                    </h3>

                    <p className="mt-2 min-h-[44px] text-sm leading-6 text-slate-600">
                      {modulo.descricao}
                    </p>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
              <h3 className="font-bold">Nenhum módulo liberado</h3>
              <p className="mt-1 text-sm">
                Seu usuário ainda não possui permissões cadastradas. Solicite liberação ao administrador.
              </p>
            </div>
          )}
        </section>

        <footer className="py-5 text-center text-xs text-slate-500">
          Sistema de Gestão Institucional • Secretaria Municipal de Cultura e Turismo
        </footer>
      </div>
    </main>
  )
}