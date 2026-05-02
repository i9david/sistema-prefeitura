import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/sidebar'

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

export default async function AdministrativoRelatoriosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <Sidebar />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Relatórios do Administrativo
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Área individual de relatórios do módulo
                </p>
              </div>

              <Link
                href="/administrativo"
                className="inline-flex rounded-2xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Voltar ao módulo
              </Link>
            </div>
          </div>

          <div className={cardClassName()}>
            <p className="text-sm text-slate-600">
              Este relatório está reservado para os indicadores exclusivos do Administrativo.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}