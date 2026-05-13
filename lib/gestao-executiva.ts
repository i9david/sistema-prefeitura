import type { User } from '@supabase/supabase-js'
import {
  getUsuarioAdministrativoAtual,
  type UsuarioAdministrativoAtual,
} from '@/lib/usuario-atual'

const perfisGestaoExecutiva = ['admin', 'gestor']

function getPerfilCompatibilidade(usuario: UsuarioAdministrativoAtual) {
  return String(usuario.perfil || usuario.nivel || '').trim().toLowerCase()
}

export function usuarioPodeAcessarGestaoExecutiva(
  usuario: UsuarioAdministrativoAtual | null
) {
  if (!usuario || usuario.status !== 'ativo') return false

  return perfisGestaoExecutiva.includes(getPerfilCompatibilidade(usuario))
}

export async function podeAcessarGestaoExecutiva(authUser?: User | null) {
  const usuario = await getUsuarioAdministrativoAtual(authUser)
  return usuarioPodeAcessarGestaoExecutiva(usuario)
}
