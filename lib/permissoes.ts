import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'

export type PermissaoModulo = {
  pode_visualizar: boolean
  pode_criar: boolean
  pode_editar: boolean
  pode_excluir: boolean
}

export async function buscarPermissaoModulo(
  modulo: string
): Promise<PermissaoModulo> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return {
      pode_visualizar: false,
      pode_criar: false,
      pode_editar: false,
      pode_excluir: false,
    }
  }

  const { data: usuario } = await supabase
    .from('administrativo_usuarios')
    .select('id, email, perfil, status')
    .eq('email', user.email)
    .maybeSingle()

  if (!usuario || usuario.status !== 'ativo') {
    return {
      pode_visualizar: false,
      pode_criar: false,
      pode_editar: false,
      pode_excluir: false,
    }
  }

  if (usuario.perfil === 'admin') {
    return {
      pode_visualizar: true,
      pode_criar: true,
      pode_editar: true,
      pode_excluir: true,
    }
  }

  const { data: acesso } = await supabase
    .from('administrativo_acessos')
    .select('pode_visualizar, pode_criar, pode_editar, pode_excluir')
    .eq('usuario_id', usuario.id)
    .eq('modulo', modulo)
    .maybeSingle()

  return {
    pode_visualizar: !!acesso?.pode_visualizar,
    pode_criar: !!acesso?.pode_criar,
    pode_editar: !!acesso?.pode_editar,
    pode_excluir: !!acesso?.pode_excluir,
  }
}

/**
 * Função de compatibilidade para páginas antigas.
 * Evita erro em arquivos antigos que ainda chamam podeAcessar().
 */
export function podeAcessar(
  nivel: string | null | undefined,
  permissoes: any[] = [],
  modulo: string,
  recurso?: string,
  acao: 'visualizar' | 'criar' | 'editar' | 'excluir' = 'visualizar'
) {
  if (nivel === 'admin') return true

  if (!Array.isArray(permissoes)) return false

  const permissao = permissoes.find((item) => {
    if (recurso) {
      return item.modulo === modulo && (item.recurso === recurso || item.area === recurso)
    }

    return item.modulo === modulo
  })

  if (!permissao) return false

  return permissao[`pode_${acao}`] === true
}
