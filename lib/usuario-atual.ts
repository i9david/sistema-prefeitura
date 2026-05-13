import type { User } from '@supabase/supabase-js'
import { cache } from 'react'
import {
  createTenantClient as createClient,
  getMunicipioId,
} from '@/lib/supabase/tenant-server'

export type UsuarioAdministrativoAtual = {
  id: string
  nome: string | null
  email: string | null
  perfil: string | null
  nivel: string | null
  status: string | null
}

function normalizarUsuarioCompatibilidade(
  usuario: UsuarioAdministrativoAtual | null
) {
  if (!usuario) return null

  const perfilCompatibilidade = usuario.perfil || usuario.nivel || null
  const nivelCompatibilidade = usuario.nivel || usuario.perfil || null

  return {
    ...usuario,
    perfil: perfilCompatibilidade,
    nivel: nivelCompatibilidade,
  }
}

async function carregarUsuarioAdministrativoAtual(email: string, authUser?: User | null) {
  const supabase = await createClient()
  const municipioId = getMunicipioId()

  let { data: usuario } = await supabase
    .from('administrativo_usuarios')
    .select('id, nome, email, perfil, nivel, status')
    .eq('email', email)
    .eq('municipio_id', municipioId)
    .maybeSingle()

  if (!usuario) {
    const nome =
      authUser?.user_metadata?.name ||
      authUser?.user_metadata?.full_name ||
      email.split('@')[0]

    const { data: novoUsuario } = await supabase
      .from('administrativo_usuarios')
      .insert({
        nome,
        email,
        perfil: 'usuario',
        nivel: 'usuario',
        status: 'ativo',
        municipio_id: municipioId,
      })
      .select('id, nome, email, perfil, nivel, status')
      .single()

    usuario = novoUsuario
  }

  return normalizarUsuarioCompatibilidade(
    (usuario ?? null) as UsuarioAdministrativoAtual | null
  )
}

const carregarUsuarioAdministrativoAtualCache = cache(carregarUsuarioAdministrativoAtual)

export async function getUsuarioAdministrativoAtual(authUser?: User | null) {
  const supabase = await createClient()

  const user =
    authUser ??
    (
      await supabase.auth.getUser()
    ).data.user

  if (!user?.email) return null

  return carregarUsuarioAdministrativoAtualCache(user.email.toLowerCase(), user)
}
