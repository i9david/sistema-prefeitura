import { ModuleLoadingState, ModuleSkeletonGrid } from '@/components/module/module-state'

export default function DashboardExecutivoLoading() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <ModuleLoadingState
          title="Carregando dashboard executivo"
          description="Consolidando indicadores institucionais da gestão pública."
        />
        <ModuleSkeletonGrid items={6} />
      </div>
    </main>
  )
}
