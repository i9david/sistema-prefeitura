import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ModuloCentroCulturalNav } from '@/components/modulo-centro-cultural-nav'

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function moduloCardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5'
}

export default async function CentroCulturalPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCentroCulturalNav currentPath="/centro-cultural" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Centro Cultural
            </h1>
            <p className="mt-3 text-slate-600">
              Gestão de alunos, aulas, professores, frequência, visitantes, comunicação e áreas integradas como o Museu.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-slate-900">
              Áreas do módulo
            </h2>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Link
                href="/alunos"
                className={moduloCardClassName()}
              >
                <h3 className="text-lg font-bold text-slate-900">Alunos</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Cadastro, edição, status e biometria.
                </p>
              </Link>

              <Link
                href="/aulas"
                className={moduloCardClassName()}
              >
                <h3 className="text-lg font-bold text-slate-900">Aulas</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Grade semanal, horários e modalidades.
                </p>
              </Link>

              <Link
                href="/professores"
                className={moduloCardClassName()}
              >
                <h3 className="text-lg font-bold text-slate-900">Professores</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Cadastro, vínculos e acompanhamento de turmas.
                </p>
              </Link>

              <Link
                href="/aula-professores"
                className={moduloCardClassName()}
              >
                <h3 className="text-lg font-bold text-slate-900">Professores x Aulas</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Vinculação de professores às aulas e funções.
                </p>
              </Link>

              <Link
                href="/frequencia"
                className={moduloCardClassName()}
              >
                <h3 className="text-lg font-bold text-slate-900">Frequência</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Chamada por turma e controle de presença.
                </p>
              </Link>

              <Link
                href="/frequencia-biometria"
                className={moduloCardClassName()}
              >
                <h3 className="text-lg font-bold text-slate-900">Terminal de presença</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Registro rápido por biometria.
                </p>
              </Link>

              <Link
                href="/visitantes"
                className={moduloCardClassName()}
              >
                <h3 className="text-lg font-bold text-slate-900">Visitantes</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Entrada, permanência e encerramento de visitas.
                </p>
              </Link>

              <Link
                href="/centro-cultural/museu"
                className={moduloCardClassName()}
              >
                <h3 className="text-lg font-bold text-slate-900">Museu</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Acervo, categorias, movimentações, visitantes e relatórios do museu.
                </p>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}