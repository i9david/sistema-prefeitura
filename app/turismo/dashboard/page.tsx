import { redirect } from 'next/navigation'
import { BarChart3, CheckCircle2, MapPin, Users } from 'lucide-react'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuleCard, ModuleMetricCard } from '@/components/module/module-card'
import { ModuleGrid } from '@/components/module/module-grid'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuloTurismoNav } from '@/components/modulo-turismo-nav'
import { cache } from 'react'

export const revalidate = 300 // Revalidar cache a cada 5 minutos

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

const carregarMetricasTurismo = cache(async (mes: string) => {
  const supabase = await createClient()

  const inicio = `${mes}-01`
  const fim = getUltimoDiaMes(mes)

  // Buscar visitantes do mês
  const { data: visitantes } = await supabase
    .from('turismo_visitantes')
    .select('cidade_origem, ponto_visitado, data_visita')
    .gte('data_visita', inicio)
    .lte('data_visita', fim)

  // Buscar demandas
  const { data: demandas } = await supabase
    .from('turismo_demandas')
    .select('status')

  const lista = visitantes || []
  const demandasLista = demandas || []

  // Calcular métricas agregadas
  const cidades: Record<string, number> = {}
  const pontos: Record<string, number> = {}
  const dias: Record<string, number> = {}

  lista.forEach((v: any) => {
    cidades[v.cidade_origem || 'N/I'] = (cidades[v.cidade_origem || 'N/I'] || 0) + 1
    pontos[v.ponto_visitado || 'N/I'] = (pontos[v.ponto_visitado || 'N/I'] || 0) + 1
    dias[v.data_visita || ''] = (dias[v.data_visita || ''] || 0) + 1
  })

  const topCidade = Object.entries(cidades).sort((a, b) => b[1] - a[1])[0]
  const topPonto = Object.entries(pontos).sort((a, b) => b[1] - a[1])[0]

  const pendentes = demandasLista.filter((d: any) => d.status === 'pendente').length
  const concluidas = demandasLista.filter((d: any) => d.status === 'concluida').length

  return {
    totalVisitantes: lista.length,
    topCidade: topCidade?.[0] || '-',
    topPonto: topPonto?.[0] || '-',
    demandasConcluidas: concluidas,
    fluxoDiario: Object.entries(dias)
      .map(([data, quantidade]) => ({ data, quantidade }))
      .sort((a, b) => a.data.localeCompare(b.data))
  }
})

export default async function Page({ searchParams }: any) {
  const params = await searchParams
  const mes = normalizarMes(params.mes)

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const metricas = await carregarMetricasTurismo(mes)

  return (
    <ModuleLayout sidebar={<ModuloTurismoNav currentPath="/turismo/dashboard" />}>
      <ModuleHeader
        title="Dashboard de Turismo"
        description="Indicadores de fluxo turístico, origem dos visitantes, pontos mais visitados e andamento das demandas."
        eyebrow="Gestão"
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
        <ModuleMetricCard label="Visitantes no mês" value={metricas.totalVisitantes} icon={Users} accent="emerald" />
        <ModuleMetricCard label="Cidade destaque" value={metricas.topCidade} icon={MapPin} accent="blue" />
        <ModuleMetricCard label="Ponto destaque" value={metricas.topPonto} icon={MapPin} accent="violet" />
        <ModuleMetricCard label="Demandas concluídas" value={metricas.demandasConcluidas} icon={CheckCircle2} accent="amber" />
      </ModuleGrid>

      <ModuleCard>
        <h2 className="text-xl font-bold text-slate-950">Fluxo diário</h2>
        <div className="mt-5 space-y-3">
          {metricas.fluxoDiario.map((dia) => (
            <div key={dia.data} className="flex items-center gap-3">
              <span className="w-28 text-sm text-slate-600">{dia.data}</span>
              <div className="h-3 rounded bg-emerald-500" style={{ width: `${dia.quantidade * 10}px` }} />
              <span className="text-sm font-semibold text-slate-700">{dia.quantidade}</span>
            </div>
          ))}
        </div>
      </ModuleCard>

      <ModuleGrid columns={2}>
        <ModuleMetricCard label="Demandas pendentes" value={0} icon={BarChart3} accent="amber" />
        <ModuleMetricCard label="Demandas concluídas" value={metricas.demandasConcluidas} icon={CheckCircle2} accent="emerald" />
      </ModuleGrid>
    </ModuleLayout>
  )
}
