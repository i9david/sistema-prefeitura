import { createClient } from '@/lib/supabase/server'

export async function registrarLog({
  acao,
  modulo,
  descricao,
  referenciaId,
}: {
  acao: string
  modulo: string
  descricao?: string
  referenciaId?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from('administrativo_logs').insert({
    usuario_email: user?.email,
    acao,
    modulo,
    descricao,
    referencia_id: referenciaId,
  })
}