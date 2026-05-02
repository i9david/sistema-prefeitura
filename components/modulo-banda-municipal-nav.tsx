import { ModuloNav } from '@/components/modulo-nav'

type ModuloBandaMunicipalNavProps = {
  currentPath?: string
}

export function ModuloBandaMunicipalNav({
  currentPath = '',
}: ModuloBandaMunicipalNavProps) {
  return (
    <ModuloNav
      titulo="Banda Municipal"
      currentPath={currentPath}
      cor="roxo"
      itens={[
        { label: 'Visão do módulo', href: '/banda-municipal' },
        { label: 'Músicos', href: '/banda-municipal/musicos' },
        { label: 'Instrumentos', href: '/banda-municipal/instrumentos' },
        { label: 'Ensaios', href: '/banda-municipal/ensaios' },
        { label: 'Apresentações', href: '/banda-municipal/apresentacoes' },
        { label: 'Relatórios', href: '/banda-municipal/relatorios' },
      ]}
    />
  )
}