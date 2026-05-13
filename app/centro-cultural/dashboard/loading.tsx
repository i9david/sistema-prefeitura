import { ModuleLoadingState } from '@/components/module/module-state'
import { ModuloCentroCulturalNav } from '@/components/modulo-centro-cultural-nav'
import { ModuleLayout } from '@/components/module/module-layout'

export default function CentroCulturalDashboardLoading() {
  return (
    <ModuleLayout sidebar={<ModuloCentroCulturalNav currentPath="/centro-cultural/dashboard" />}>
      <ModuleLoadingState
        title="Carregando dashboard"
        description="Calculando indicadores de gestão cultural."
      />
    </ModuleLayout>
  )
}
