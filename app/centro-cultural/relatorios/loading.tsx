import { ModuleLoadingState } from '@/components/module/module-state'
import { ModuloCentroCulturalNav } from '@/components/modulo-centro-cultural-nav'
import { ModuleLayout } from '@/components/module/module-layout'

export default function CentroCulturalRelatoriosLoading() {
  return (
    <ModuleLayout sidebar={<ModuloCentroCulturalNav currentPath="/centro-cultural/relatorios" />}>
      <ModuleLoadingState
        title="Carregando relatórios"
        description="Consolidando dados para gestão pública."
      />
    </ModuleLayout>
  )
}
