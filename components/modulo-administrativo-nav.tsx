import { ModuleSidebar } from '@/components/module/module-sidebar'
import { getModuleConfig } from '@/config/modules'
import { buscarModulosPermitidos } from '@/lib/menu'

type ModuloAdministrativoNavProps = {
  currentPath: string
}

export async function ModuloAdministrativoNav({
  currentPath,
}: ModuloAdministrativoNavProps) {
  const modulos = await buscarModulosPermitidos()

  if (!modulos.includes('administrativo')) {
    return null
  }

  const config = getModuleConfig('administrativo')

  return (
    <ModuleSidebar
      title={config.title}
      currentPath={currentPath}
      groups={config.groups}
      accent={config.accent}
      context="Governança do sistema"
    />
  )
}
