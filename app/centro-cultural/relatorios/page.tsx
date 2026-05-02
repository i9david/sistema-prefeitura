import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/sidebar'

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

export default async function CentroCulturalRelatoriosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const hoje = new Date().toISOString().split('T')[0]

  const [
    { count: totalAlunos },
    { count: totalProfessores },
    { count: totalVisitantes },
    { count: totalFrequenciasHoje },
    { count: totalFrequencias },
  ] = await Promise.all([
    supabase.from('alunos').select('*', { count: 'exact', head: true }),
    supabase.from('professores').select('*', { count: 'exact', head: true }),
    supabase.from('visitantes').select('*', { count: 'exact', head: true }),
    supabase.from('frequencias').select('*', { count: 'exact', head: true }).eq('data_aula', hoje),
    supabase.from('frequencias').select('*', { count: 'exact', head: true }),
  ])

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <Sidebar />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Relatórios do Centro Cultural
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Indicadores exclusivos do módulo Centro Cultural
                </p>
              </div>

              <Link
                href="/centro-cultural"
                className="inline-flex rounded-2xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Voltar ao módulo
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Alunos</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{totalAlunos ?? 0}</p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Professores</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{totalProfessores ?? 0}</p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Visitantes</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{totalVisitantes ?? 0}</p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Frequências hoje</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{totalFrequenciasHoje ?? 0}</p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Frequências totais</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{totalFrequencias ?? 0}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}