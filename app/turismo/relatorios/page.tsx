import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"
import { createClient } from '@/lib/supabase/server'
import { ModuloTurismoNav } from '@/components/modulo-turismo-nav'

function card() {
  return 'rounded-[28px] border border-slate-200 bg-white p-6 shadow'
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

  const listaVisitantes = visitantes || []
  const listaDemandas = demandas || []

  // 🔹 AGRUPAMENTOS

  const porCidade: Record<string, number> = {}
  const porPonto: Record<string, number> = {}
  const porDia: Record<string, number> = {}

  listaVisitantes.forEach(v => {
    const cidade = v.cidade_origem || 'Não informado'
    const ponto = v.ponto_visitado || 'Não informado'
    const dia = v.data_visita || 'Sem data'

    porCidade[cidade] = (porCidade[cidade] || 0) + 1
    porPonto[ponto] = (porPonto[ponto] || 0) + 1
    porDia[dia] = (porDia[dia] || 0) + 1
  })

  const topCidades = Object.entries(porCidade).sort((a,b) => b[1]-a[1])
  const topPontos = Object.entries(porPonto).sort((a,b) => b[1]-a[1])
  const dias = Object.entries(porDia).sort((a,b) => b[0].localeCompare(a[0]))

  const demandasPendentes = listaDemandas.filter(d => d.status === 'pendente').length
  const demandasConcluidas = listaDemandas.filter(d => d.status === 'concluida').length

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="grid lg:grid-cols-[300px_1fr] gap-6 max-w-7xl mx-auto">

        <ModuloTurismoNav currentPath="/turismo/relatorios" />

        <section className="space-y-6">

          {/* HEADER */}
          <div className={card()}>
            <h1 className="text-3xl font-bold">
              Relatório de Turismo
            </h1>

            <form className="mt-4 flex gap-3">
              <input
                type="month"
                name="mes"
                defaultValue={mes}
                className="border p-3 rounded-xl"
              />

              <button className="bg-violet-600 text-white px-4 rounded-xl">
                Atualizar
              </button>
            </form>
          </div>

          {/* KPIs */}
          <div className="grid md:grid-cols-4 gap-4">

            <div className={card()}>
              <p>Total visitantes</p>
              <p className="text-2xl font-bold">{listaVisitantes.length}</p>
            </div>

            <div className={card()}>
              <p>Cidades atendidas</p>
              <p className="text-2xl font-bold">{Object.keys(porCidade).length}</p>
            </div>

            <div className={card()}>
              <p>Demandas pendentes</p>
              <p className="text-2xl font-bold text-red-600">{demandasPendentes}</p>
            </div>

            <div className={card()}>
              <p>Demandas concluídas</p>
              <p className="text-2xl font-bold text-green-600">{demandasConcluidas}</p>
            </div>

          </div>

          {/* TOP CIDADES */}
          <div className={card()}>
            <h2 className="font-bold text-xl mb-4">Cidades que mais visitam</h2>

            {topCidades.map(([cidade, total]) => (
              <div key={cidade} className="flex justify-between border-b py-2">
                <span>{cidade}</span>
                <strong>{total}</strong>
              </div>
            ))}
          </div>

          {/* TOP PONTOS */}
          <div className={card()}>
            <h2 className="font-bold text-xl mb-4">Pontos mais visitados</h2>

            {topPontos.map(([ponto, total]) => (
              <div key={ponto} className="flex justify-between border-b py-2">
                <span>{ponto}</span>
                <strong>{total}</strong>
              </div>
            ))}
          </div>

          {/* MOVIMENTO POR DIA */}
          <div className={card()}>
            <h2 className="font-bold text-xl mb-4">Movimento por dia</h2>

            {dias.map(([dia, total]) => (
              <div key={dia} className="flex justify-between border-b py-2">
                <span>{dia}</span>
                <strong>{total}</strong>
              </div>
            ))}
          </div>

        </section>
      </div>
    </main>
  )
}