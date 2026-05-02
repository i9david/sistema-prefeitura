import { ModuloNav } from '@/components/modulo-nav'

type ModuloCaptacaoNavProps = {
  currentPath?: string
}

export function ModuloCaptacaoNav({
  currentPath = '',
}: ModuloCaptacaoNavProps) {
  return (
    <ModuloNav
      titulo="Projetos e Captação"
      currentPath={currentPath}
      cor="roxo"
      itens={[
        { label: 'Visão do módulo', href: '/projetos-captacao' },
        { label: 'Projetos', href: '/projetos-captacao/projetos' },
        { label: 'Análise técnica', href: '/projetos-captacao/analises' },
        { label: 'Fontes de recursos', href: '/projetos-captacao/fontes' },
        { label: 'Oportunidades', href: '/projetos-captacao/oportunidades' },
        { label: 'Radar automático', href: '/projetos-captacao/radar' },
        { label: 'Matching', href: '/projetos-captacao/matching' },
        { label: 'Relatórios', href: '/projetos-captacao/relatorios' },
      ]}
    />
  )
}