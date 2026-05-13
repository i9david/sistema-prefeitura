'use server'

import { redirect } from 'next/navigation'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { getContextoPermissoes } from '@/lib/get-permissoes'
import { podeAcessar } from '@/lib/permissoes'

export type AcaoPermissao = 'visualizar' | 'criar' | 'editar' | 'excluir'

export async function exigirPermissaoAction(
  modulo: string,
  tela: string,
  acao: AcaoPermissao
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const contexto = await getContextoPermissoes()

  if (!contexto.usuarioInterno) {
    redirect('/login')
  }

  const permitido = podeAcessar(
    contexto.usuarioInterno.nivel,
    contexto.permissoes,
    modulo,
    tela,
    acao
  )

  if (!permitido) {
    redirect('/sem-permissao')
  }

  return {
    supabase,
    user,
    contexto,
    usuarioInterno: contexto.usuarioInterno,
  }
}
