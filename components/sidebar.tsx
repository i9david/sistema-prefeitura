import { buscarContextoNavegacao } from '@/lib/menu'
import { getNomeSistemaAtual } from '@/lib/system-config'
import { getTenantPath } from '@/lib/tenant-paths-server'
import { SidebarClient } from '@/components/sidebar-client'

type Props = {
  currentPath: string
}

export async function Sidebar({ currentPath }: Props) {
  const [contexto, nomeSistema] = await Promise.all([
    buscarContextoNavegacao(),
    getNomeSistemaAtual(),
  ])

  return (
    <SidebarClient
      currentPath={currentPath}
      modulos={contexto.modulosPermitidos}
      nomeSistema={nomeSistema}
      podeGestaoExecutiva={contexto.podeGestaoExecutiva}
      homeHref={getTenantPath('/')}
      links={{
        inicio: getTenantPath('/'),
        dashboardExecutivo: getTenantPath('/dashboard'),
        centroCultural: getTenantPath('/centro-cultural'),
        museu: getTenantPath('/centro-cultural/museu'),
        bandaMunicipal: getTenantPath('/banda-municipal'),
        casaArtesao: getTenantPath('/casa-artesao'),
        turismo: getTenantPath('/turismo'),
        projetosCaptacao: getTenantPath('/projetos-captacao'),
        almoxarifado: getTenantPath('/almoxarifado'),
        administrativo: getTenantPath('/administrativo'),
        configuracoes: getTenantPath('/administrativo/configuracoes'),
        agenda: getTenantPath('/administrativo/agenda'),
        relatorios: getTenantPath('/administrativo/relatorios'),
      }}
    />
  )
}
