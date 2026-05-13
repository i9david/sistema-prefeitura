import { PackageSearch } from 'lucide-react'
import { ModuloAlmoxarifadoNav } from '@/components/modulo-almoxarifado-nav'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuleLoadingState, ModuleSkeletonGrid } from '@/components/module/module-state'

export default function AlmoxarifadoLoading() {
  return (
    <ModuleLayout sidebar={<ModuloAlmoxarifadoNav currentPath="/almoxarifado" />}>
      <ModuleHeader
        title="Almoxarifado"
        eyebrow="Carregando"
        description="Preparando dados de categorias, produtos, movimentações e relatórios."
        icon={PackageSearch}
        accent="emerald"
        context="Estoque institucional"
      />

      <ModuleLoadingState
        title="Carregando almoxarifado"
        description="Aguarde enquanto os dados do estoque institucional são sincronizados."
      />

      <ModuleSkeletonGrid items={6} />
    </ModuleLayout>
  )
}
