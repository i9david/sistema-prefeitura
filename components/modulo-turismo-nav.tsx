import { ModuloNav } from '@/components/modulo-nav'

type ModuloTurismoNavProps = {
  currentPath?: string
}

export function ModuloTurismoNav({
  currentPath = '',
}: ModuloTurismoNavProps) {
  return (
    <ModuloNav
      titulo="Turismo"
      currentPath={currentPath}
      cor="verde"
      itens={[
        { label: 'Visão do módulo', href: '/turismo' },
        { label: 'Pontos turísticos', href: '/turismo/pontos' },
        { label: 'Demandas', href: '/turismo/demandas' },
        { label: 'Visitantes', href: '/turismo/visitantes' },
        { label: 'Relatórios', href: '/turismo/relatorios' },
      ]}
    />
  )
}