import { ModuleSidebar } from '@/components/module/module-sidebar'
import { getModuleConfig } from '@/config/modules'

type ModuloAlmoxarifadoNavProps = {
  currentPath?: string
}

export function ModuloAlmoxarifadoNav({
  currentPath = '',
}: ModuloAlmoxarifadoNavProps) {
  const config = getModuleConfig('almoxarifado')

  return (
    <ModuleSidebar
      title={config.title}
      currentPath={currentPath}
      groups={config.groups}
      accent={config.accent}
      context="Estoque institucional"
    />
  )
}
