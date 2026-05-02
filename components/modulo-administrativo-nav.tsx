import Link from 'next/link'
import {
  CalendarDays,
  ChevronLeft,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { buscarModulosPermitidos } from '@/lib/menu'

type ModuloAdministrativoNavProps = {
  currentPath: string
}

export async function ModuloAdministrativoNav({
  currentPath,
}: ModuloAdministrativoNavProps) {
  const modulos = await buscarModulosPermitidos()

  function pode(modulo: string) {
    return modulos.includes(modulo)
  }

  function linkClass(path: string) {
    const ativo = currentPath === path

    return `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
      ativo
        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_10px_24px_rgba(124,58,237,0.28)]'
        : 'text-slate-700 hover:bg-violet-50 hover:text-violet-700'
    }`
  }

  return (
    <aside className="sticky top-6 h-fit rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
      <div className="rounded-[24px] bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 p-6 text-white shadow-[0_14px_30px_rgba(124,58,237,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-100">
          Módulo
        </p>
        <h2 className="mt-2 text-2xl font-bold">
          Administrativo
        </h2>
      </div>

      <div className="mt-5 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ChevronLeft size={18} />
          Voltar ao início
        </Link>

        <Link
          href="/logout"
          className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
          <LogOut size={18} />
          Sair do sistema
        </Link>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="mb-3 px-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
          Navegação
        </p>

        <nav className="space-y-2">
          {pode('administrativo') && (
            <Link href="/administrativo" className={linkClass('/administrativo')}>
              <LayoutDashboard size={18} />
              Visão do módulo
            </Link>
          )}

          {pode('administrativo') && (
            <Link href="/administrativo/usuarios" className={linkClass('/administrativo/usuarios')}>
              <ShieldCheck size={18} />
              Usuários e Acessos
            </Link>
          )}

          {pode('administrativo') && (
            <Link href="/administrativo/comunicacao" className={linkClass('/administrativo/comunicacao')}>
              <MessageCircle size={18} />
              Comunicação
            </Link>
          )}

          {pode('administrativo') && (
            <Link href="/administrativo/configuracoes" className={linkClass('/administrativo/configuracoes')}>
              <Settings size={18} />
              Configurações do Sistema
            </Link>
          )}

          {pode('administrativo') && (
            <Link href="/administrativo/agenda" className={linkClass('/administrativo/agenda')}>
              <CalendarDays size={18} />
              Agenda Institucional
            </Link>
          )}

          {pode('administrativo') && (
            <Link href="/administrativo/relatorios" className={linkClass('/administrativo/relatorios')}>
              <FileBarChart size={18} />
              Relatórios Gerais
            </Link>
          )}
        </nav>
      </div>
    </aside>
  )
}