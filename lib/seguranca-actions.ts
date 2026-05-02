'use server'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"
import { createClient } from '@/lib/supabase/server'
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
    redirect(
      `/dashboard?message=${encodeURIComponent(
        'Você não tem permissão para executar esta ação'
      )}`
    )
  }

  return {
    supabase,
    user,
    contexto,
    usuarioInterno: contexto.usuarioInterno,
  }
}