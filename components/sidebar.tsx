import Link from 'next/link'
import {
  LayoutDashboard,
  Building2,
  Landmark,
  BookOpen,
  Music,
  Palette,
  Map,
  ShieldCheck,
  Settings,
  CalendarDays,
  FileBarChart,
  LogOut,
  ChevronLeft,
} from 'lucide-react'
import { buscarModulosPermitidos } from '@/lib/menu'

type Props = {
  currentPath: string
}

export async function <Sidebar currentPath="/" />({ currentPath }: Props) {
  const modulos = await buscarModulosPermitidos()

  function pode(modulo: string) {
    return modulos.includes(modulo)
  }

  function linkClass(path: string) {
    const ativo = currentPath === path

    return `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
      ativo
        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow'
        : 'text-slate-700 hover:bg-violet-50 hover:text-violet-700'
    }`
  }

  return (
    <aside className="sticky top-6 h-fit rounded-[30px] border bg-white p-5 shadow">

      {/* HEADER */}
      <div className="rounded-[24px] bg-gradient-to-br from-violet-600 to-purple-600 p-6 text-white">
        <p className="text-xs uppercase opacity-80">Sistema</p>
        <h2 className="text-xl font-bold mt-1">
          Cultura e Turismo
        </h2>
      </div>

      {/* AÇÕES */}
      <div className="mt-5 space-y-2">
        <Link href="/" className="flex items-center gap-2 text-sm">
          <ChevronLeft size={16} />
          Voltar ao início
        </Link>

        <Link href="/logout" className="flex items-center gap-2 text-sm text-red-600">
          <LogOut size={16} />
          Sair
        </Link>
      </div>

      {/* MÓDULOS */}
      <div className="mt-6 space-y-2">

        {pode('centro-cultural') && (
          <Link href="/centro-cultural" className={linkClass('/centro-cultural')}>
            <Building2 size={18} />
            Centro Cultural
          </Link>
        )}

        {pode('museu') && (
          <Link href="/centro-cultural/museu" className={linkClass('/centro-cultural/museu')}>
            <Landmark size={18} />
            Museu
          </Link>
        )}

        {pode('biblioteca') && (
          <Link href="/biblioteca" className={linkClass('/biblioteca')}>
            <BookOpen size={18} />
            Biblioteca
          </Link>
        )}

        {pode('banda-municipal') && (
          <Link href="/banda" className={linkClass('/banda')}>
            <Music size={18} />
            Banda Municipal
          </Link>
        )}

        {pode('casa-artesao') && (
          <Link href="/artesao" className={linkClass('/artesao')}>
            <Palette size={18} />
            Casa do Artesão
          </Link>
        )}

        {pode('turismo') && (
          <Link href="/turismo" className={linkClass('/turismo')}>
            <Map size={18} />
            Turismo
          </Link>
        )}

        {pode('administrativo') && (
          <Link href="/administrativo" className={linkClass('/administrativo')}>
            <ShieldCheck size={18} />
            Administrativo
          </Link>
        )}

      </div>

      {/* ADMIN EXTRA */}
      {pode('administrativo') && (
        <div className="mt-6 border-t pt-4 space-y-2">

          <Link href="/administrativo/configuracoes" className={linkClass('/administrativo/configuracoes')}>
            <Settings size={18} />
            Configurações
          </Link>

          <Link href="/administrativo/agenda" className={linkClass('/administrativo/agenda')}>
            <CalendarDays size={18} />
            Agenda
          </Link>

          <Link href="/administrativo/relatorios" className={linkClass('/administrativo/relatorios')}>
            <FileBarChart size={18} />
            Relatórios
          </Link>

        </div>
      )}

    </aside>
  )
}