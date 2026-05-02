import { ModuloNav } from '@/components/modulo-nav'

type ModuloCasaArtesaoNavProps = {
  currentPath?: string
}

export function ModuloCasaArtesaoNav({
  currentPath = '',
}: ModuloCasaArtesaoNavProps) {
  return (
    <ModuloNav
      titulo="Casa do Artesão"
      currentPath={currentPath}
      cor="laranja"
      itens={[
        { label: 'Visão do módulo', href: '/casa-artesao' },
        { label: 'Artesãos', href: '/casa-artesao/artesaos' },
        { label: 'Produtos', href: '/casa-artesao/produtos' },
        { label: 'Estoque', href: '/casa-artesao/estoque' },
        { label: 'Caixa', href: '/casa-artesao/caixa' },
        { label: 'Relatórios', href: '/casa-artesao/relatorios' },
        { label: 'Fechamentos', href: '/casa-artesao/fechamentos' },
        { label: 'Configurações', href: '/casa-artesao/configuracoes' },
      ]}
    />
  )
}