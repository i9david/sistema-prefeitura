'use client'

import { PackageSearch, RefreshCcw } from 'lucide-react'
import Link from 'next/link'
import { ModuloAlmoxarifadoNav } from '@/components/modulo-almoxarifado-nav'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuleErrorState } from '@/components/module/module-state'

type AlmoxarifadoErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AlmoxarifadoError({ error, reset }: AlmoxarifadoErrorProps) {
  return (
    <ModuleLayout sidebar={<ModuloAlmoxarifadoNav currentPath="/almoxarifado" />}>
      <ModuleHeader
        title="Almoxarifado"
        eyebrow="Erro"
        description="Não foi possível carregar os dados do almoxarifado no momento."
        icon={PackageSearch}
        accent="emerald"
        context="Estoque institucional"
      />

      <ModuleErrorState
        title="Falha ao carregar o almoxarifado"
        description={error.message || 'Verifique a estrutura do banco e tente novamente.'}
        action={
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={reset} className="btn-primary justify-center">
              <RefreshCcw size={16} aria-hidden="true" />
              Tentar novamente
            </button>
            <Link href="/almoxarifado" className="btn-secondary justify-center">
              Voltar para a visão geral
            </Link>
          </div>
        }
      />
    </ModuleLayout>
  )
}
