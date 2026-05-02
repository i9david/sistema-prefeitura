import { ModuloNav } from '@/components/modulo-nav'

type ModuloCentroCulturalNavProps = {
  currentPath?: string
}

export function ModuloCentroCulturalNav({
  currentPath = '',
}: ModuloCentroCulturalNavProps) {
  return (
    <ModuloNav
      titulo="Centro Cultural"
      currentPath={currentPath}
      cor="azul"
      itens={[
        { label: 'Visão do módulo', href: '/centro-cultural' },
        { label: 'Alunos', href: '/alunos' },
        { label: 'Modalidades', href: '/modalidades' },
        { label: 'Aulas', href: '/aulas' },
        { label: 'Professores', href: '/professores' },
        { label: 'Professores x Aulas', href: '/aula-professores' },
        { label: 'Professores x Modalidades', href: '/modalidade-professores' },
        { label: 'Frequência', href: '/frequencia' },
        { label: 'Terminal de presença', href: '/frequencia-biometria' },
        { label: 'Visitantes', href: '/visitantes' },
        { label: 'Relatório de visitantes', href: '/visitantes/relatorios' },
        { label: 'Comunicação', href: '/contatos' },
        { label: 'Museu', href: '/centro-cultural/museu' },
      ]}
    />
  )
}