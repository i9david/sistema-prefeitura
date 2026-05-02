import { ModuloNav } from '@/components/modulo-nav'

type ModuloMuseuNavProps = {
  currentPath?: string
}

export function ModuloMuseuNav({
  currentPath = '',
}: ModuloMuseuNavProps) {
  return (
    <ModuloNav
      titulo="Museu"
      currentPath={currentPath}
      cor="roxo"
      itens={[
        { label: 'Visão do Museu', href: '/centro-cultural/museu' },
        { label: 'Acervo', href: '/centro-cultural/museu/acervo' },
        { label: 'Categorias', href: '/centro-cultural/museu/categorias' },
        { label: 'Movimentações', href: '/centro-cultural/museu/movimentacoes' },
        { label: 'Visitantes', href: '/centro-cultural/museu/visitantes' },
        { label: 'Relatórios', href: '/centro-cultural/museu/relatorios' },
      ]}
    />
  )
}