import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { Sidebar } from "@/components/sidebar"
import { ModuloCentroCulturalNav } from '@/components/modulo-centro-cultural-nav'
import { exigirPermissaoPagina } from '@/lib/seguranca-paginas'
import { registrarPresencaBiometria } from './actions'

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

export default async function FrequenciaBiometriaPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    sucesso?: string
    aluno?: string
    turma?: string
    hora?: string
  }>
}) {
  await exigirPermissaoPagina('Centro Cultural', 'Frequência', 'visualizar')

  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCentroCulturalNav currentPath="/frequencia-biometria" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Terminal de presença
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Presença automática por biometria para alunos do Centro Cultural
            </p>
          </div>

          <div className={cardClassName()}>
            <form action={registrarPresencaBiometria} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Identificador biométrico
                </label>
                <input
                  name="identificador_biometrico"
                  placeholder="Leia a digital ou informe o identificador"
                  className="w-full rounded-2xl border border-slate-300 px-5 py-4 text-lg"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="rounded-2xl bg-blue-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-blue-700"
              >
                Registrar presença
              </button>
            </form>
          </div>

          {params.message && (
            <div
              className={`rounded-[28px] border p-8 shadow-[0_12px_32px_rgba(15,23,42,0.08)] ${
                params.sucesso === '1'
                  ? 'border-green-200 bg-green-50'
                  : 'border-amber-200 bg-amber-50'
              }`}
            >
              <p className="text-xl font-bold text-slate-900">{params.message}</p>

              {params.aluno && (
                <p className="mt-3 text-base text-slate-700">
                  Aluno: <strong>{params.aluno}</strong>
                </p>
              )}

              {params.turma && (
                <p className="mt-1 text-base text-slate-700">
                  Turma: <strong>{params.turma}</strong>
                </p>
              )}

              {params.hora && (
                <p className="mt-1 text-base text-slate-700">
                  Horário: <strong>{params.hora}</strong>
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
