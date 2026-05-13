import { FileBarChart, LayoutDashboard, Library, Repeat2, Users } from 'lucide-react'
import { ModuloNav } from '@/components/modulo-nav'

type ModuloBibliotecaNavProps = {
  currentPath?: string
}

export function ModuloBibliotecaNav({
  currentPath = '',
}: ModuloBibliotecaNavProps) {
  return (
    <ModuloNav
      titulo="Biblioteca Municipal"
      currentPath={currentPath}
      cor="verde"
      grupos={[
        {
          label: 'Gestão',
          itens: [
            { label: 'Visão geral', href: '/biblioteca', icon: LayoutDashboard },
          ],
        },
        {
          label: 'Cadastros',
          itens: [
            { label: 'Leitores', href: '/biblioteca/leitores', icon: Users },
            { label: 'Acervo', href: '/biblioteca/livros', icon: Library },
          ],
        },
        {
          label: 'Operação',
          itens: [
            { label: 'Empréstimos', href: '/biblioteca/emprestimos', icon: Repeat2 },
          ],
        },
        {
          label: 'Relatórios',
          itens: [
            { label: 'Relatórios', href: '/biblioteca/relatorios', icon: FileBarChart },
          ],
        },
      ]}
    />
  )
}
