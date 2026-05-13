import { ModuleSidebar } from '@/components/module/module-sidebar'
import { getModuleConfig } from '@/config/modules'

type ModuloCasaArtesaoNavProps = {
  currentPath?: string
}

export function ModuloCasaArtesaoNav({
  currentPath = '',
}: ModuloCasaArtesaoNavProps) {
  const config = getModuleConfig('casa-artesao')

  return (
    <ModuleSidebar
      title={config.title}
      currentPath={currentPath}
      groups={config.groups}
      accent={config.accent}
      context="Vendas e estoque"
    />
  )
}
