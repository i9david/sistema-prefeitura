import { ModuleSidebar } from '@/components/module/module-sidebar'
import { getModuleConfig } from '@/config/modules'

type ModuloBandaMunicipalNavProps = {
  currentPath?: string
}

export function ModuloBandaMunicipalNav({
  currentPath = '',
}: ModuloBandaMunicipalNavProps) {
  const config = getModuleConfig('banda-municipal')

  return (
    <ModuleSidebar
      title={config.title}
      currentPath={currentPath}
      groups={config.groups}
      accent={config.accent}
      context="Operação musical"
    />
  )
}
