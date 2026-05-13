import type { User } from '@supabase/supabase-js'
import { cache } from 'react'
import { getModulosAtivosMunicipioAtual } from '@/lib/saas'
import { createTenantClient as createClient, getMunicipioId } from '@/lib/supabase/tenant-server'
import { usuarioPodeAcessarGestaoExecutiva } from '@/lib/gestao-executiva'
import { getUsuarioAdministrativoAtual } from '@/lib/usuario-atual'

const todosModulos = [
  'centro-cultural',
  'museu',
  'casa-artesao',
  'banda-municipal',
  'turismo',
  'administrativo',
  'projetos-captacao',
  'almoxarifado',
]

export type ContextoNavegacao = {
  modulosPermitidos: string[]
  podeGestaoExecutiva: boolean
  usuario: Awaited<ReturnType<typeof getUsuarioAdministrativoAtual>>
}

async function carregarContextoNavegacao(
  authUser?: User | null
): Promise<ContextoNavegacao> {
  const supabase = await createClient()
  const municipioId = getMunicipioId()
  const modulosAtivos = await getModulosAtivosMunicipioAtual(todosModulos)
  const usuario = await getUsuarioAdministrativoAtual(authUser)

  if (!usuario || usuario.status !== 'ativo') {
    return {
      modulosPermitidos: [],
      podeGestaoExecutiva: false,
      usuario,
    }
  }

  if (usuario.perfil === 'admin') {
    return {
      modulosPermitidos: todosModulos.filter((modulo) => modulosAtivos.includes(modulo)),
      podeGestaoExecutiva: true,
      usuario,
    }
  }

  const { data: acessos } = await supabase
    .from('administrativo_acessos')
    .select('modulo')
    .eq('usuario_id', usuario.id)
    .eq('municipio_id', municipioId)
    .eq('pode_visualizar', true)

  const modulosPermitidos =
    acessos
      ?.map((item) => item.modulo)
      .filter((modulo): modulo is string => Boolean(modulo))
      .filter((modulo) => todosModulos.includes(modulo)) || []

  return {
    modulosPermitidos: modulosPermitidos.filter((modulo) => modulosAtivos.includes(modulo)),
    podeGestaoExecutiva: usuarioPodeAcessarGestaoExecutiva(usuario),
    usuario,
  }
}

export async function buscarModulosPermitidos(authUser?: User | null) {
  const contexto = await buscarContextoNavegacao(authUser)
  return contexto.modulosPermitidos
}

export const buscarContextoNavegacao = cache(carregarContextoNavegacao)
