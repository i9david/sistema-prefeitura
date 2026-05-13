import {
  Archive,
  ArrowLeftRight,
  FileBarChart,
  Landmark,
  LayoutDashboard,
  Tags,
  UserRoundPlus,
} from 'lucide-react'
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
      grupos={[
        {
          label: 'Gestão',
          itens: [
            { label: 'Visão geral', href: '/centro-cultural/museu', icon: LayoutDashboard },
          ],
        },
        {
          label: 'Cadastros',
          itens: [
            { label: 'Acervo', href: '/centro-cultural/museu/acervo', icon: Archive },
            { label: 'Categorias', href: '/centro-cultural/museu/categorias', icon: Tags },
          ],
        },
        {
          label: 'Operação',
          itens: [
            { label: 'Movimentações', href: '/centro-cultural/museu/movimentacoes', icon: ArrowLeftRight },
            { label: 'Visitantes', href: '/centro-cultural/museu/visitantes', icon: UserRoundPlus },
          ],
        },
        {
          label: 'Relatórios',
          itens: [
            { label: 'Relatórios', href: '/centro-cultural/museu/relatorios', icon: FileBarChart },
          ],
        },
      ]}
    />
  )
}
