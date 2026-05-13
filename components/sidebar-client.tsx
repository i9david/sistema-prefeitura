'use client'

import { memo, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileBarChart,
  FolderKanban,
  Grid3X3,
  Landmark,
  LogOut,
  Map,
  Menu,
  Music,
  PackageSearch,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
} from 'lucide-react'

type SidebarClientProps = {
  currentPath: string
  modulos: string[]
  nomeSistema: string
  podeGestaoExecutiva: boolean
  homeHref: string
  links: {
    inicio: string
    dashboardExecutivo: string
    centroCultural: string
    museu: string
    bandaMunicipal: string
    casaArtesao: string
    turismo: string
    projetosCaptacao: string
    almoxarifado: string
    administrativo: string
    configuracoes: string
    agenda: string
    relatorios: string
  }
}

function compactName(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()
}

function SidebarClientComponent({
  currentPath,
  modulos,
  nomeSistema,
  podeGestaoExecutiva,
  homeHref,
  links,
}: SidebarClientProps) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem('app-sidebar-collapsed')
    setCollapsed(stored === 'true')
  }, [])

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value
      window.localStorage.setItem('app-sidebar-collapsed', String(next))
      return next
    })
  }

  const modulosPermitidos = useMemo(() => new Set(modulos), [modulos])

  function isActive(path: string) {
    return currentPath === path || currentPath.startsWith(`${path}/`)
  }

  const menuItems = useMemo(
    () => [
      {
        key: 'centro-cultural',
        label: 'Centro Cultural',
        href: links.centroCultural,
        path: '/centro-cultural',
        icon: Building2,
      },
      {
        key: 'museu',
        label: 'Museu',
        href: links.museu,
        path: '/centro-cultural/museu',
        icon: Landmark,
      },
      {
        key: 'banda-municipal',
        label: 'Banda Municipal',
        href: links.bandaMunicipal,
        path: '/banda-municipal',
        icon: Music,
      },
      {
        key: 'casa-artesao',
        label: 'Casa do Artesão',
        href: links.casaArtesao,
        path: '/casa-artesao',
        icon: Palette,
      },
      {
        key: 'turismo',
        label: 'Turismo',
        href: links.turismo,
        path: '/turismo',
        icon: Map,
      },
      {
        key: 'projetos-captacao',
        label: 'Projetos e Captação',
        href: links.projetosCaptacao,
        path: '/projetos-captacao',
        icon: FolderKanban,
      },
      {
        key: 'almoxarifado',
        label: 'Almoxarifado',
        href: links.almoxarifado,
        path: '/almoxarifado',
        icon: PackageSearch,
      },
      {
        key: 'administrativo',
        label: 'Administrativo',
        href: links.administrativo,
        path: '/administrativo',
        icon: ShieldCheck,
      },
    ],
    [links]
  )

  const adminItems = [
    {
      label: 'Configurações',
      href: links.configuracoes,
      path: '/administrativo/configuracoes',
      icon: Settings,
    },
    {
      label: 'Agenda',
      href: links.agenda,
      path: '/administrativo/agenda',
      icon: CalendarDays,
    },
    {
      label: 'Relatórios',
      href: links.relatorios,
      path: '/administrativo/relatorios',
      icon: FileBarChart,
    },
  ]

  const gestaoExecutivaItems = [
    {
      label: 'Dashboard Executivo',
      href: links.dashboardExecutivo,
      path: '/dashboard',
      icon: FileBarChart,
    },
  ]

  const visibleMenuItems = useMemo(
    () => menuItems.filter((item) => modulosPermitidos.has(item.key)),
    [menuItems, modulosPermitidos]
  )

  return (
    <aside
      className={`sidebar-shell transition-all duration-300 ${
        collapsed ? 'w-[84px]' : 'w-full lg:w-[300px]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <Link
          href={homeHref}
          className={`flex min-w-0 items-center gap-3 rounded-lg p-2 transition hover:bg-slate-50 ${
            collapsed ? 'justify-center' : 'flex-1'
          }`}
          title={nomeSistema}
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white shadow-sm">
            {collapsed ? compactName(nomeSistema) || <Grid3X3 size={19} /> : <Grid3X3 size={19} />}
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                Sistema
              </p>
              <h2 className="truncate text-base font-bold leading-5 text-slate-950">
                {nomeSistema}
              </h2>
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={toggleCollapsed}
          className="hidden size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 lg:inline-flex"
          aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <div className="mt-5 grid gap-2">
        <Link
          href={links.inicio}
          className={`btn-ghost ${collapsed ? 'px-0' : 'justify-start'}`}
          title="Voltar ao início"
        >
          <ChevronLeft size={16} />
          {!collapsed && 'Voltar ao início'}
        </Link>

        <Link
          href="/logout"
          className={`btn-danger ${collapsed ? 'px-0' : 'justify-start'}`}
          title="Sair"
        >
          <LogOut size={16} />
          {!collapsed && 'Sair'}
        </Link>
      </div>

      <div className="mt-6 space-y-2">
        {!collapsed && <p className="sidebar-section-label">Módulos</p>}

        <nav className="space-y-1.5">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`sidebar-link ${collapsed ? 'justify-center px-0' : ''} ${
                  isActive(item.path) ? 'sidebar-link-active' : ''
                }`}
                title={item.label}
              >
                <Icon size={18} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && isActive(item.path) && (
                  <ChevronRight size={15} className="ml-auto opacity-80" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {podeGestaoExecutiva && (
        <div className="mt-6 space-y-2 border-t border-slate-200 pt-4">
          {!collapsed && <p className="sidebar-section-label">Gestão Executiva</p>}

          <nav className="space-y-1.5">
            {gestaoExecutivaItems.map((item) => {
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${collapsed ? 'justify-center px-0' : ''} ${
                    isActive(item.path) ? 'sidebar-link-active' : ''
                  }`}
                  title={item.label}
                >
                  <Icon size={18} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && isActive(item.path) && (
                    <ChevronRight size={15} className="ml-auto opacity-80" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      )}

      {modulosPermitidos.has('administrativo') && (
        <div className="mt-6 space-y-2 border-t border-slate-200 pt-4">
          {!collapsed && <p className="sidebar-section-label">Gestão</p>}

          <nav className="space-y-1.5">
            {adminItems.map((item) => {
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${collapsed ? 'justify-center px-0' : ''} ${
                    isActive(item.path) ? 'sidebar-link-active' : ''
                  }`}
                  title={item.label}
                >
                  <Icon size={18} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )
            })}
          </nav>
        </div>
      )}

      <button
        type="button"
        onClick={toggleCollapsed}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 lg:hidden"
      >
        <Menu size={16} />
        {collapsed ? 'Expandir menu' : 'Recolher menu'}
      </button>
    </aside>
  )
}

export const SidebarClient = memo(SidebarClientComponent)
