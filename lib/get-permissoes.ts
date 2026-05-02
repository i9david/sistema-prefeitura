import { createClient } from '@/lib/supabase/server'

export type UsuarioInternoPermissao = {
  id: string
  nome: string
  email: string
  nivel: string
  status: string
  auth_user_id: string | null
  professor_id: string | null
}

export type PermissaoUsuario = {
  id: string
  usuario_id: string
  modulo: string
  area: string
  pode_visualizar: boolean
  pode_criar: boolean
  pode_editar: boolean
  pode_excluir: boolean
}

export async function getContextoPermissoes() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      authUser: null,
      usuarioInterno: null,
      permissoes: [],
    }
  }

  const { data: usuarioInterno } = await supabase
  .from('administrativo_usuarios')
  .select('id, nome, email, nivel, status, auth_user_id, professor_id')
  .eq('auth_user_id', user.id)
  .maybeSingle()

  if (!usuarioInterno) {
    return {
      authUser: user,
      usuarioInterno: null,
      permissoes: [],
    }
  }

  const { data: permissoes } = await supabase
    .from('administrativo_permissoes')
    .select('*')
    .eq('usuario_id', usuarioInterno.id)

  return {
    authUser: user,
    usuarioInterno: usuarioInterno as UsuarioInternoPermissao,
    permissoes: (permissoes ?? []) as PermissaoUsuario[],
  }
}