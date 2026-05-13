import { redirect } from 'next/navigation'
import { BarChart3, CheckCircle2, MapPin, Users } from 'lucide-react'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuleCard, ModuleMetricCard } from '@/components/module/module-card'
import { ModuleGrid } from '@/components/module/module-grid'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuloTurismoNav } from '@/components/modulo-turismo-nav'

function getMesAtual() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date())
}

function normalizarMes(valor: unknown) {
  const mes = String(valor || '')
  return /^\d{4}-\d{2}$/.test(mes) ? mes : getMesAtual()
}

function getUltimoDiaMes(mes: string) {
  const [ano, mesNumero] = mes.split('-').map(Number)

  if (!ano || !mesNumero) {
    return getUltimoDiaMes(getMesAtual())
  }

  return new Date(Date.UTC(ano, mesNumero, 0)).toISOString().slice(0, 10)
}

export default async function Page({ searchParams }: any) {
  const params = await searchParams
  const mes = normalizarMes(params.mes)

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const inicio = `${mes}-01`
  const fim = getUltimoDiaMes(mes)

  const { data: visitantes } = await supabase
    .from('turismo_visitantes')
    .select('*')
    .gte('data_visita', inicio)
    .lte('data_visita', fim)

  const { data: demandas } = await supabase
    .from('turismo_demandas')
    .select('*')

  const listaVisitantes = visitantes || []
  const listaDemandas = demandas || []

  const porCidade: Record<string, number> = {}
  const porPonto: Record<string, number> = {}
  const porDia: Record<string, number> = {}

  listaVisitantes.forEach((v: any) => {
    const cidade = v.cidade_origem || 'Não informado'
    const ponto = v.ponto_visitado || 'Não informado'
    const dia = v.data_visita || 'Sem data'

    porCidade[cidade] = (porCidade[cidade] || 0) + 1
    porPonto[ponto] = (porPonto[ponto] || 0) + 1
    porDia[dia] = (porDia[dia] || 0) + 1
  })

  const topCidades = Object.entries(porCidade).sort((a, b) => b[1] - a[1])
  const topPontos = Object.entries(porPonto).sort((a, b) => b[1] - a[1])
  const dias = Object.entries(porDia).sort((a, b) => b[0].localeCompare(a[0]))

  const demandasPendentes = listaDemandas.filter((d: any) => d.status === 'pendente').length
  const demandasConcluidas = listaDemandas.filter((d: any) => d.status === 'concluida').length

  return (
    <ModuleLayout sidebar={<ModuloTurismoNav currentPath="/turismo/relatorios" />}>
      <ModuleHeader
        title="Relatório de Turismo"
        description="Análise mensal de visitantes, cidades de origem, pontos visitados e andamento das demandas."
        eyebrow="Relatórios"
        icon={BarChart3}
        accent="emerald"
        action={
          <form className="flex gap-3">
            <input type="month" name="mes" defaultValue={mes} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
              Atualizar
            </button>
          </form>
        }
      />

      <ModuleGrid columns={4}>
        <ModuleMetricCard label="Total visitantes" value={listaVisitantes.length} icon={Users} accent="emerald" />
        <ModuleMetricCard label="Cidades atendidas" value={Object.keys(porCidade).length} icon={MapPin} accent="blue" />
        <ModuleMetricCard label="Demandas pendentes" value={demandasPendentes} icon={BarChart3} accent="amber" />
        <ModuleMetricCard label="Demandas concluídas" value={demandasConcluidas} icon={CheckCircle2} accent="violet" />
      </ModuleGrid>

      <ModuleCard>
        <h2 className="text-xl font-bold text-slate-950">Cidades que mais visitam</h2>
        <div className="mt-5 divide-y divide-slate-100">
          {topCidades.map(([cidade, total]) => (
            <div key={cidade} className="flex justify-between py-3 text-sm">
              <span className="text-slate-700">{cidade}</span>
              <strong className="text-slate-950">{total}</strong>
            </div>
          ))}
        </div>
      </ModuleCard>

      <ModuleCard>
        <h2 className="text-xl font-bold text-slate-950">Pontos mais visitados</h2>
        <div className="mt-5 divide-y divide-slate-100">
          {topPontos.map(([ponto, total]) => (
            <div key={ponto} className="flex justify-between py-3 text-sm">
              <span className="text-slate-700">{ponto}</span>
              <strong className="text-slate-950">{total}</strong>
            </div>
          ))}
        </div>
      </ModuleCard>

      <ModuleCard>
        <h2 className="text-xl font-bold text-slate-950">Movimento por dia</h2>
        <div className="mt-5 divide-y divide-slate-100">
          {dias.map(([dia, total]) => (
            <div key={dia} className="flex justify-between py-3 text-sm">
              <span className="text-slate-700">{dia}</span>
              <strong className="text-slate-950">{total}</strong>
            </div>
          ))}
        </div>
      </ModuleCard>
    </ModuleLayout>
  )
}
