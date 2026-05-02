import { ModuloBandaMunicipalNav } from '@/components/modulo-banda-municipal-nav'

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

export default function BandaMunicipalPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloBandaMunicipalNav currentPath="/banda-municipal" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Banda Municipal
            </h1>
            <p className="mt-3 text-slate-600">
              Gestão de músicos, instrumentos, ensaios, apresentações e relatórios.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <a
              href="/banda-municipal/musicos"
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
            >
              <h2 className="text-lg font-bold text-slate-900">Músicos</h2>
              <p className="mt-2 text-sm text-slate-600">
                Cadastro e acompanhamento dos integrantes.
              </p>
            </a>

            <a
              href="/banda-municipal/instrumentos"
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
            >
              <h2 className="text-lg font-bold text-slate-900">Instrumentos</h2>
              <p className="mt-2 text-sm text-slate-600">
                Controle de instrumentos e situação de uso.
              </p>
            </a>

            <a
              href="/banda-municipal/ensaios"
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
            >
              <h2 className="text-lg font-bold text-slate-900">Ensaios</h2>
              <p className="mt-2 text-sm text-slate-600">
                Agenda e controle dos ensaios da Banda Municipal.
              </p>
            </a>

            <a
              href="/banda-municipal/apresentacoes"
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
            >
              <h2 className="text-lg font-bold text-slate-900">Apresentações</h2>
              <p className="mt-2 text-sm text-slate-600">
                Registro e acompanhamento de apresentações oficiais.
              </p>
            </a>

            <a
              href="/banda-municipal/relatorios"
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
            >
              <h2 className="text-lg font-bold text-slate-900">Relatórios</h2>
              <p className="mt-2 text-sm text-slate-600">
                Visão consolidada do módulo da Banda Municipal.
              </p>
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}