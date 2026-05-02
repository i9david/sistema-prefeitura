import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ModuloTurismoNav } from '@/components/modulo-turismo-nav'

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function moduloCardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5'
}

export default async function TurismoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: pontosData },
    { data: demandasData },
    { data: visitantesData },
  ] = await Promise.all([
    supabase.from('turismo_pontos').select('id, status'),
    supabase.from('turismo_demandas').select('id, status'),
    supabase.from('turismo_visitantes').select('id, data_visita'),
  ])

  const pontos = pontosData ?? []
  const demandas = demandasData ?? []
  const visitantes = visitantesData ?? []

  const pontosAtivos = pontos.filter((item) => item.status === 'ativo').length
  const demandasPendentes = demandas.filter((item) => item.status === 'pendente').length
  const demandasConcluidas = demandas.filter((item) => item.status === 'concluida').length

  const hoje = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  const visitantesHoje = visitantes.filter((item) => item.data_visita === hoje).length

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloTurismoNav currentPath="/turismo" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Turismo
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Gestão dos pontos turísticos, demandas, visitantes e ações estratégicas para o desenvolvimento turístico de Mineiros.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Pontos cadastrados</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {pontos.length}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Pontos ativos</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {pontosAtivos}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Demandas pendentes</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {demandasPendentes}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Visitantes hoje</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {visitantesHoje}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Link href="/turismo/pontos" className={moduloCardClassName()}>
              <h2 className="text-lg font-bold text-slate-900">
                Pontos turísticos
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Cadastro dos atrativos, localização, contatos e situação atual.
              </p>
            </Link>

            <Link href="/turismo/demandas" className={moduloCardClassName()}>
              <h2 className="text-lg font-bold text-slate-900">
                Demandas
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Controle de melhorias, sinalização, limpeza, acesso e estrutura.
              </p>
            </Link>

            <Link href="/turismo/visitantes" className={moduloCardClassName()}>
              <h2 className="text-lg font-bold text-slate-900">
                Visitantes
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Registro de visitantes, origem e pontos visitados.
              </p>
            </Link>

            <Link href="/turismo/relatorios" className={moduloCardClassName()}>
              <h2 className="text-lg font-bold text-slate-900">
                Relatórios
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Indicadores turísticos, demandas e fluxo de visitação.
              </p>
            </Link>
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Resumo estratégico
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Demandas concluídas</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {demandasConcluidas}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Total de demandas</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {demandas.length}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Visitantes registrados</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {visitantes.length}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}