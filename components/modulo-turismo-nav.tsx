import { ModuleSidebar } from '@/components/module/module-sidebar'
import { getModuleConfig } from '@/config/modules'

type ModuloTurismoNavProps = {
  currentPath?: string
}

export function ModuloTurismoNav({ currentPath = '' }: ModuloTurismoNavProps) {
  const config = getModuleConfig('turismo')

  return (
    <ModuleSidebar
      title={config.title}
      currentPath={currentPath}
      groups={config.groups}
      accent={config.accent}
      context="Desenvolvimento turístico"
    />
  )
}
