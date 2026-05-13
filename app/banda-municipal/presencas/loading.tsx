import { ModuleLoadingState } from '@/components/module/module-state'
import { ModuloBandaMunicipalNav } from '@/components/modulo-banda-municipal-nav'
import { ModuleLayout } from '@/components/module/module-layout'

export default function BandaPresencasLoading() {
  return (
    <ModuleLayout sidebar={<ModuloBandaMunicipalNav currentPath="/banda-municipal/presencas" />}>
      <ModuleLoadingState
        title="Carregando presenças"
        description="Preparando eventos, músicos ativos e registros de chamada."
      />
    </ModuleLayout>
  )
}
