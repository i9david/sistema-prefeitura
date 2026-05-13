import { ModuleLoadingState } from '@/components/module/module-state'

export default function AdministrativoRelatoriosLoading() {
  return (
    <main className="min-h-screen bg-[var(--color-page)] p-6">
      <div className="mx-auto max-w-7xl">
        <ModuleLoadingState
          title="Preparando relatórios"
          description="Aguarde enquanto os indicadores institucionais são consolidados."
        />
      </div>
    </main>
  )
}
