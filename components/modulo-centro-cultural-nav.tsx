import { ModuleSidebar } from '@/components/module/module-sidebar'
import { getModuleConfig } from '@/config/modules'

type ModuloCentroCulturalNavProps = {
  currentPath?: string
}

export function ModuloCentroCulturalNav({
  currentPath = '',
}: ModuloCentroCulturalNavProps) {
  const config = getModuleConfig('centro-cultural')

  return (
    <ModuleSidebar
      title={config.title}
      currentPath={currentPath}
      groups={config.groups}
      accent={config.accent}
      context="Gestão cultural"
    />
  )
}
