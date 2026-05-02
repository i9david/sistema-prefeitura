import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModuloTurismoNav } from '@/components/modulo-turismo-nav'

function card() {
  return 'rounded-[30px] border bg-white p-6 shadow'
}

function badge(valor: number) {
  return valor > 50
    ? 'text-green-600'
    : valor > 20
    ? 'text-yellow-600'
    : 'text-red-600'
}

function getMesAtual() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date())
}

export default async function Page({ searchParams }: any) {
  const params = await searchParams
  const mes = params.mes || getMesAtual()

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const inicio = `${mes}-01`
  const fim = `${mes}-31`

  const { data: visitantes } = await supabase
    .from('turismo_visitantes')
    .select('*')
    .gte('data_visita', inicio)
    .lte('data_visita', fim)

  const { data: demandas } = await supabase
    .from('turismo_demandas')
    .select('*')

  const lista = visitantes || []
  const demandasLista = demandas || []

  const cidades: Record<string, number> = {}
  const pontos: Record<string, number> = {}
  const dias: Record<string, number> = {}

  lista.forEach(v => {
    cidades[v.cidade_origem || 'N/I'] = (cidades[v.cidade_origem] || 0) + 1
    pontos[v.ponto_visitado || 'N/I'] = (pontos[v.ponto_visitado] || 0) + 1
    dias[v.data_visita || ''] = (dias[v.data_visita] || 0) + 1
  })

  const topCidade = Object.entries(cidades).sort((a,b)=>b[1]-a[1])[0]
  const topPonto = Object.entries(pontos).sort((a,b)=>b[1]-a[1])[0]

  const pendentes = demandasLista.filter(d=>d.status==='pendente').length
  const concluidas = demandasLista.filter(d=>d.status==='concluida').length

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="grid lg:grid-cols-[300px_1fr] gap-6 max-w-7xl mx-auto">

        <ModuloTurismoNav currentPath="/turismo/dashboard" />

        <section className="space-y-6">

          {/* HEADER */}
          <div className="rounded-[30px] bg-gradient-to-r from-emerald-600 to-green-500 p-6 text-white shadow-lg">
            <h1 className="text-3xl font-bold">
              Dashboard BI Turismo
            </h1>

            <form className="mt-4 flex gap-3">
              <input type="month" name="mes" defaultValue={mes} className="text-black p-2 rounded-xl"/>
              <button className="bg-black px-4 py-2 rounded-xl text-white">
                Atualizar
              </button>
            </form>
          </div>

          {/* KPIs */}
          <div className="grid md:grid-cols-4 gap-4">

            <div className={card()}>
              <p className="text-sm">Visitantes no mês</p>
              <p className="text-3xl font-bold">{lista.length}</p>
            </div>

            <div className={card()}>
              <p className="text-sm">Cidade destaque</p>
              <p className="text-xl font-bold">{topCidade?.[0] || '-'}</p>
            </div>

            <div className={card()}>
              <p className="text-sm">Ponto destaque</p>
              <p className="text-xl font-bold">{topPonto?.[0] || '-'}</p>
            </div>

            <div className={card()}>
              <p className="text-sm">Eficiência</p>
              <p className={`text-2xl font-bold ${badge(concluidas)}`}>
                {concluidas}
              </p>
            </div>

          </div>

          {/* GRÁFICO SIMULADO */}
          <div className={card()}>
            <h2 className="font-bold mb-4">Fluxo diário</h2>

            {Object.entries(dias).map(([dia, total]) => (
              <div key={dia} className="flex items-center gap-3 mb-2">
                <span className="w-24 text-sm">{dia}</span>
                <div className="bg-green-500 h-3 rounded" style={{ width: `${total * 10}px` }} />
                <span>{total}</span>
              </div>
            ))}
          </div>

          {/* DEMANDAS */}
          <div className="grid md:grid-cols-2 gap-4">

            <div className={card()}>
              <p>Demandas pendentes</p>
              <p className="text-2xl font-bold text-red-600">{pendentes}</p>
            </div>

            <div className={card()}>
              <p>Demandas concluídas</p>
              <p className="text-2xl font-bold text-green-600">{concluidas}</p>
            </div>

          </div>

        </section>
      </div>
    </main>
  )
}