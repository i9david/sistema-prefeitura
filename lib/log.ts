import type { User } from '@supabase/supabase-js'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { getUsuarioAdministrativoAtual } from '@/lib/usuario-atual'

type LogAdministrativoPayload = {
  usuario_id?: string | null
  usuario_email?: string | null
  acao: string
  modulo: string
  descricao?: string | null
  referencia_id?: string | null
}

function erroColunaUsuarioId(error: { message?: string } | null) {
  return String(error?.message ?? '')
    .toLowerCase()
    .includes('usuario_id')
}

async function inserirLogAdministrativo(payload: LogAdministrativoPayload) {
  const supabase = await createClient()
  const { error } = await supabase.from('administrativo_logs').insert(payload)

  if (!error || !erroColunaUsuarioId(error)) return

  const { usuario_id: _usuarioId, ...payloadLegado } = payload
  await supabase.from('administrativo_logs').insert(payloadLegado)
}

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

  const usuario = await getUsuarioAdministrativoAtual(user)

  await inserirLogAdministrativo({
    usuario_id: usuario?.id ?? null,
    usuario_email: user?.email ?? usuario?.email ?? null,
    acao,
    modulo,
    descricao,
    referencia_id: referenciaId,
  })
}

export async function registrarAcessoDashboardExecutivo(user?: User | null) {
  if (!user?.email) return

  try {
    const supabase = await createClient()
    const usuario = await getUsuarioAdministrativoAtual(user)
    const rota = '/dashboard'
    const janelaDeduplicacao = new Date(Date.now() - 15 * 60 * 1000).toISOString()

    let logRecente: { id: string }[] | null = null

    if (usuario?.id) {
      const { data, error } = await supabase
        .from('administrativo_logs')
        .select('id')
        .eq('usuario_id', usuario.id)
        .eq('modulo', 'Dashboard Executivo')
        .eq('acao', 'acesso')
        .eq('descricao', rota)
        .gte('created_at', janelaDeduplicacao)
        .limit(1)

      if (!error) {
        logRecente = data as { id: string }[] | null
      }
    }

    if (!logRecente) {
      const { data } = await supabase
        .from('administrativo_logs')
        .select('id')
        .eq('usuario_email', user.email)
        .eq('modulo', 'Dashboard Executivo')
        .eq('acao', 'acesso')
        .eq('descricao', rota)
        .gte('created_at', janelaDeduplicacao)
        .limit(1)

      logRecente = data as { id: string }[] | null
    }

    if (logRecente && logRecente.length > 0) return

    await inserirLogAdministrativo({
      usuario_id: usuario?.id ?? null,
      usuario_email: user.email,
      acao: 'acesso',
      modulo: 'Dashboard Executivo',
      descricao: rota,
      referencia_id: user.id,
    })
  } catch {
    /*
     * A auditoria nao deve bloquear a leitura executiva.
     * Falhas permanecem rastreaveis pela plataforma e pelo Supabase.
     */
  }
}
