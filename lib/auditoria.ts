import { createClient } from '@/lib/supabase/server'
import { getContextoPermissoes } from '@/lib/get-permissoes'

type RegistrarAuditoriaInput = {
  acao: string
  modulo: string
  area: string
  entidade?: string
  entidade_id?: string
  detalhes?: Record<string, unknown>
}

export async function registrarAuditoria(input: RegistrarAuditoriaInput) {
  const supabase = await createClient()
  const contexto = await getContextoPermissoes()

  const authUser = contexto.authUser
  const usuarioInterno = contexto.usuarioInterno

  await supabase.from('auditoria_logs').insert({
    auth_user_id: authUser?.id ?? null,
    usuario_interno_id: usuarioInterno?.id ?? null,
    usuario_nome: usuarioInterno?.nome ?? null,
    usuario_email: usuarioInterno?.email ?? null,
    nivel: usuarioInterno?.nivel ?? null,
    acao: input.acao,
    modulo: input.modulo,
    area: input.area,
    entidade: input.entidade ?? null,
    entidade_id: input.entidade_id ?? null,
    detalhes: input.detalhes ?? {},
  })
}