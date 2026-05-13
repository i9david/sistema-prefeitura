import { BarChart3, Clock3, MousePointerClick, Users } from 'lucide-react'
import { ModuleCard, ModuleMetricCard } from '@/components/module/module-card'
import type { UsoSistemaIndicadores } from '@/lib/uso-sistema'

function formatarDataCurta(data: string) {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}`
}

function ProgressBar({
  value,
  tone = 'blue',
}: {
  value: number
  tone?: 'blue' | 'emerald' | 'violet'
}) {
  const cor =
    tone === 'emerald'
      ? 'bg-emerald-500'
      : tone === 'violet'
        ? 'bg-violet-500'
        : 'bg-blue-600'

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${cor}`}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  )
}

export function UsoSistemaPanel({
  indicadores,
}: {
  indicadores: UsoSistemaIndicadores
}) {
  const maiorDia = Math.max(...indicadores.evolucaoUso.map((item) => item.total), 1)

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          Uso do sistema
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-950">
          Indicadores estratégicos de adoção
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ModuleMetricCard
          label="Usuários ativos em 7 dias"
          value={indicadores.usuariosAtivos7Dias}
          description="Usuários internos com atividade registrada na última semana."
          icon={Users}
          accent="emerald"
        />
        <ModuleMetricCard
          label="Usuários ativos em 30 dias"
          value={indicadores.usuariosAtivos30Dias}
          description="Base ativa recente considerando usuário interno ou e-mail legado."
          icon={Users}
        />
        <ModuleMetricCard
          label="Eventos registrados"
          value={indicadores.totalAcessos30Dias}
          description="Logs administrativos capturados nos últimos 30 dias."
          icon={MousePointerClick}
          accent="violet"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ModuleCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-950">Acessos por módulo</h3>
              <p className="mt-1 text-sm text-slate-500">
                Distribuição dos eventos registrados por área do sistema.
              </p>
            </div>
            <BarChart3 size={20} className="text-blue-700" aria-hidden="true" />
          </div>

          <div className="mt-5 space-y-4">
            {indicadores.acessosPorModulo.length > 0 ? (
              indicadores.acessosPorModulo.map((item) => (
                <div key={item.modulo} className="space-y-2">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-semibold text-slate-700">{item.modulo}</span>
                    <span className="font-bold text-slate-950">{item.total}</span>
                  </div>
                  <ProgressBar value={item.percentual} />
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Ainda não há logs no período.</p>
            )}
          </div>
        </ModuleCard>

        <ModuleCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-950">Horários de maior uso</h3>
              <p className="mt-1 text-sm text-slate-500">
                Faixas horárias com maior concentração de atividade.
              </p>
            </div>
            <Clock3 size={20} className="text-violet-700" aria-hidden="true" />
          </div>

          <div className="mt-5 space-y-4">
            {indicadores.horariosMaiorUso.length > 0 ? (
              indicadores.horariosMaiorUso.map((item) => (
                <div key={item.hora} className="space-y-2">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    <span className="font-bold text-slate-950">{item.total}</span>
                  </div>
                  <ProgressBar value={item.percentual} tone="violet" />
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Ainda não há horários para exibir.</p>
            )}
          </div>
        </ModuleCard>
      </div>

      <ModuleCard>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-950">Evolução de uso</h3>
            <p className="mt-1 text-sm text-slate-500">
              Volume diário de eventos nos últimos 30 dias.
            </p>
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            {formatarDataCurta(indicadores.periodo.dataInicio)} a{' '}
            {formatarDataCurta(indicadores.periodo.dataFim)}
          </span>
        </div>

        <div className="mt-6 flex h-44 items-end gap-1.5 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3">
          {indicadores.evolucaoUso.map((item) => (
            <div key={item.data} className="flex min-w-2 flex-1 flex-col items-center justify-end gap-2">
              <div
                className="w-full rounded-t bg-blue-600 transition hover:bg-blue-700"
                title={`${formatarDataCurta(item.data)}: ${item.total}`}
                style={{ height: `${Math.max((item.total / maiorDia) * 100, item.total > 0 ? 6 : 0)}%` }}
              />
            </div>
          ))}
        </div>
      </ModuleCard>
    </section>
  )
}
