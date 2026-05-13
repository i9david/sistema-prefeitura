import type { LucideIcon } from 'lucide-react'
import {
  ModuleSidebar,
  type ModuleAccent,
  type ModuleSidebarGroup,
} from '@/components/module/module-sidebar'

type ModuloNavItem = {
  label: string
  href: string
  icon?: LucideIcon
}

type ModuloNavGrupo = {
  label: string
  itens: ModuloNavItem[]
}

type ModuloNavProps = {
  titulo: string
  currentPath?: string
  itens?: ModuloNavItem[]
  grupos?: ModuloNavGrupo[]
  cor?: 'azul' | 'verde' | 'roxo' | 'laranja'
  contexto?: string
}

function mapAccent(cor: ModuloNavProps['cor']): ModuleAccent {
  switch (cor) {
    case 'verde':
      return 'emerald'
    case 'roxo':
      return 'violet'
    case 'laranja':
      return 'amber'
    default:
      return 'blue'
  }
}

function mapGroups(grupos: ModuloNavGrupo[] | undefined, itens: ModuloNavItem[]) {
  const gruposNavegacao =
    grupos && grupos.length > 0 ? grupos : [{ label: 'Navegação', itens }]

  return gruposNavegacao.map<ModuleSidebarGroup>((grupo) => ({
    label: grupo.label,
    items: grupo.itens,
  }))
}

export function ModuloNav({
  titulo,
  currentPath = '',
  itens = [],
  grupos,
  cor = 'azul',
  contexto,
}: ModuloNavProps) {
  return (
    <ModuleSidebar
      title={titulo}
      currentPath={currentPath}
      groups={mapGroups(grupos, itens)}
      accent={mapAccent(cor)}
      context={contexto}
    />
  )
}
