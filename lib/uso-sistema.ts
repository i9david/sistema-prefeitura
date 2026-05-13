import { createTenantClient } from '@/lib/supabase/tenant-server'

type LogUsoSistema = {
  usuario_id: string | null
  usuario_email: string | null
  modulo: string | null
  created_at: string
}

export type UsoSistemaIndicadores = {
  periodo: {
    dataInicio: string
    dataFim: string
    label: string
  }
  usuariosAtivos7Dias: number
  usuariosAtivos30Dias: number
  totalAcessos30Dias: number
  acessosPorModulo: Array<{
    modulo: string
    total: number
    percentual: number
  }>
  evolucaoUso: Array<{
    data: string
    total: number
  }>
  horariosMaiorUso: Array<{
    hora: number
    label: string
    total: number
    percentual: number
  }>
}

function dataLocal(data: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(data)
}

function horaLocal(data: Date) {
  return Number(
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      hour12: false,
    }).format(data)
  )
}

function percentual(parte: number, total: number) {
  if (total <= 0) return 0
  return Math.round((parte / total) * 10000) / 100
}

function chaveUsuario(log: LogUsoSistema) {
  return log.usuario_id || log.usuario_email || ''
}

function ordenarPorTotal<T extends { total: number }>(items: T[]) {
  return [...items].sort((a, b) => b.total - a.total)
}

function ultimosDias(quantidade: number) {
  const hoje = new Date()

  return Array.from({ length: quantidade }).map((_, index) => {
    const data = new Date(hoje)
    data.setDate(hoje.getDate() - (quantidade - 1 - index))
    return dataLocal(data)
  })
}

export async function getIndicadoresUsoSistema(): Promise<UsoSistemaIndicadores> {
  const supabase = await createTenantClient()
  const fim = new Date()
  const inicio30 = new Date()
  inicio30.setDate(fim.getDate() - 29)

  const inicio7 = new Date()
  inicio7.setDate(fim.getDate() - 6)

  const dataInicio30 = dataLocal(inicio30)
  const dataInicio7 = dataLocal(inicio7)
  const dataFim = dataLocal(fim)

  const { data, error } = await supabase
    .from('administrativo_logs')
    .select('usuario_id, usuario_email, modulo, created_at')
    .gte('created_at', `${dataInicio30}T00:00:00`)
    .lte('created_at', `${dataFim}T23:59:59`)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const logs = ((data ?? []) as LogUsoSistema[]).filter((log) => log.created_at)
  const usuarios30 = new Set<string>()
  const usuarios7 = new Set<string>()
  const porModulo = new Map<string, number>()
  const porDia = new Map<string, number>()
  const porHora = new Map<number, number>()

  ultimosDias(30).forEach((dia) => porDia.set(dia, 0))

  logs.forEach((log) => {
    const usuario = chaveUsuario(log)
    const dataLog = new Date(log.created_at)
    const dia = dataLocal(dataLog)
    const hora = horaLocal(dataLog)
    const modulo = log.modulo || 'Não informado'

    if (usuario) {
      usuarios30.add(usuario)
      if (dia >= dataInicio7) usuarios7.add(usuario)
    }

    porModulo.set(modulo, (porModulo.get(modulo) ?? 0) + 1)
    porDia.set(dia, (porDia.get(dia) ?? 0) + 1)
    porHora.set(hora, (porHora.get(hora) ?? 0) + 1)
  })

  const totalAcessos30Dias = logs.length

  return {
    periodo: {
      dataInicio: dataInicio30,
      dataFim,
      label: 'Últimos 30 dias',
    },
    usuariosAtivos7Dias: usuarios7.size,
    usuariosAtivos30Dias: usuarios30.size,
    totalAcessos30Dias,
    acessosPorModulo: ordenarPorTotal(
      Array.from(porModulo.entries()).map(([modulo, total]) => ({
        modulo,
        total,
        percentual: percentual(total, totalAcessos30Dias),
      }))
    ).slice(0, 6),
    evolucaoUso: Array.from(porDia.entries()).map(([dia, total]) => ({
      data: dia,
      total,
    })),
    horariosMaiorUso: ordenarPorTotal(
      Array.from(porHora.entries()).map(([hora, total]) => ({
        hora,
        label: `${String(hora).padStart(2, '0')}:00`,
        total,
        percentual: percentual(total, totalAcessos30Dias),
      }))
    ).slice(0, 6),
  }
}
