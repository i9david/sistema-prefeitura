import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Activity,
  BarChart3,
  CalendarCheck,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  Minus,
  Music,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'

export const revalidate = 300 // Revalidar cache a cada 5 minutos
import {
  ModuleCard,
  ModuleMetricCard,
} from '@/components/module/module-card'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleEmptyState, ModuleErrorState } from '@/components/module/module-state'
import { UsoSistemaPanel } from '@/components/dashboard/uso-sistema-panel'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { getDashboardExecutivo } from '@/lib/dashboard-executivo'
import { podeAcessarGestaoExecutiva } from '@/lib/gestao-executiva'
import { registrarAcessoDashboardExecutivo } from '@/lib/log'
import { getTenantPath } from '@/lib/tenant-paths-server'
import { getIndicadoresUsoSistema } from '@/lib/uso-sistema'

function formatarPercentual(valor: number) {
  return `${valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

function formatarDataHora(valor: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(valor))
}

function TrendBadge({
  valor,
  label,
}: {
  valor: number
  label: string
}) {
  const positivo = valor > 0
  const negativo = valor < 0
  const Icon = positivo ? TrendingUp : negativo ? TrendingDown : Minus
  const classe = positivo
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : negativo
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-slate-200 bg-slate-50 text-slate-600'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${classe}`}>
      <Icon size={13} aria-hidden="true" />
      {formatarPercentual(valor)} {label}
    </span>
  )
}

export default async function DashboardExecutivoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const podeGestaoExecutiva = await podeAcessarGestaoExecutiva(user)

  if (!podeGestaoExecutiva) {
    redirect('/sem-permissao')
  }

  let indicadores
  let usoSistema
  let erro = ''

  try {
    const [dados, uso] = await Promise.all([
      getDashboardExecutivo(),
      getIndicadoresUsoSistema(),
      registrarAcessoDashboardExecutivo(user),
    ])
    indicadores = dados
    usoSistema = uso
  } catch (error) {
    erro = error instanceof Error ? error.message : 'Erro ao carregar dashboard executivo'
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <ModuleHeader
          title="Dashboard Executivo"
          eyebrow="Gestão pública"
          description="Visão institucional consolidada para acompanhamento de alunos, frequência, visitantes, atividades, participação da Banda Municipal e adoção do sistema."
          icon={BarChart3}
          accent="blue"
          context="Secretaria de Cultura e Turismo"
          meta={
            indicadores && (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                <Clock3 size={13} aria-hidden="true" />
                Última atualização: {formatarDataHora(indicadores.atualizadoEm)}
              </span>
            )
          }
          action={
            <Link href={getTenantPath('/')} className="btn-secondary w-full justify-center md:w-auto">
              Voltar aos módulos
            </Link>
          }
        />

        {erro && (
          <ModuleErrorState
            title="Não foi possível carregar os indicadores"
            description={erro}
          />
        )}

        {!indicadores && !erro && (
          <ModuleEmptyState
            title="Nenhum indicador disponível"
            description="Ainda não há dados suficientes para montar o painel executivo."
          />
        )}

        {indicadores && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <ModuleMetricCard
                label="Alunos ativos"
                value={indicadores.totalAlunosAtivos}
                description="Fotografia atual da base de alunos"
                icon={GraduationCap}
              />
              <ModuleMetricCard
                label="Frequência média"
                value={formatarPercentual(indicadores.frequenciaMedia)}
                description={`${indicadores.totalPresencasFrequencia} presenças em ${indicadores.totalLancamentosFrequencia} lançamentos`}
                icon={ClipboardCheck}
                trend={
                  <span className="text-xs font-semibold text-slate-500">
                    Anterior: {formatarPercentual(indicadores.comparativo.frequenciaMediaAnterior)}
                  </span>
                }
              />
              <ModuleMetricCard
                label="Evasão"
                value={indicadores.totalEvasoes30Dias}
                description="Matrículas encerradas nos últimos 30 dias"
                icon={TrendingDown}
                accent="amber"
              />
              <ModuleMetricCard
                label="Atividades realizadas"
                value={indicadores.atividadesRealizadas}
                description="Eventos, ensaios e apresentações finalizados"
                icon={CalendarCheck}
                trend={
                  <TrendBadge
                    valor={indicadores.comparativo.crescimentoAtividades}
                    label="vs. período anterior"
                  />
                }
              />
              <ModuleMetricCard
                label="Visitantes atendidos"
                value={indicadores.visitantesAtendidos}
                description="Atendimentos registrados no CRM cultural"
                icon={Users}
                accent="emerald"
                trend={
                  <TrendBadge
                    valor={indicadores.comparativo.crescimentoVisitantes}
                    label="vs. período anterior"
                  />
                }
              />
              <ModuleMetricCard
                label="Presença da banda"
                value={formatarPercentual(indicadores.presencaBanda)}
                description={`${indicadores.totalPresencasBanda} presenças em ${indicadores.totalLancamentosBanda} lançamentos`}
                icon={Music}
                accent="violet"
                trend={
                  <span className="text-xs font-semibold text-slate-500">
                    Anterior: {formatarPercentual(indicadores.comparativo.presencaBandaAnterior)}
                  </span>
                }
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <ModuleCard className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-emerald-400 to-violet-500" />
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <Activity size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">
                      Leitura executiva
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      O painel consolida indicadores operacionais do período{' '}
                      {indicadores.periodo.label.toLowerCase()} para apoiar decisões
                      de gestão, prestação de contas e acompanhamento das políticas
                      públicas culturais.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Período atual
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {indicadores.periodo.dataInicio} a {indicadores.periodo.dataFim}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Comparativo
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {indicadores.comparativo.periodoAnterior.label}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Frequência
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {indicadores.totalLancamentosFrequencia} lançamentos
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Banda
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {indicadores.totalLancamentosBanda} lançamentos
                    </p>
                  </div>
                </div>
              </ModuleCard>

              <ModuleCard>
                <h2 className="text-lg font-bold text-slate-950">
                  Ações rápidas
                </h2>
                <div className="mt-4 grid gap-2">
                  <Link href={getTenantPath('/centro-cultural/dashboard')} className="btn-secondary justify-start">
                    <BarChart3 size={16} aria-hidden="true" />
                    Gestão cultural
                  </Link>
                  <Link href={getTenantPath('/banda-municipal/presencas')} className="btn-secondary justify-start">
                    <Music size={16} aria-hidden="true" />
                    Presenças da banda
                  </Link>
                  <Link href={getTenantPath('/visitantes')} className="btn-secondary justify-start">
                    <Users size={16} aria-hidden="true" />
                    Visitantes
                  </Link>
                </div>
              </ModuleCard>
            </div>

            {usoSistema && <UsoSistemaPanel indicadores={usoSistema} />}
          </>
        )}
      </div>
    </main>
  )
}
