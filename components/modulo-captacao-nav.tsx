import { ModuleSidebar } from '@/components/module/module-sidebar'
import { getModuleConfig } from '@/config/modules'

type ModuloCaptacaoNavProps = {
  currentPath?: string
}

export function ModuloCaptacaoNav({
  currentPath = '',
}: ModuloCaptacaoNavProps) {
  const config = getModuleConfig('projetos-captacao')

  return (
    <ModuleSidebar
      title={config.title}
      currentPath={currentPath}
      groups={config.groups}
      accent={config.accent}
      context="Estratégia e recursos"
    />
  )
}
