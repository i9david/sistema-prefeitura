import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { salvarBiometria } from './actions'
import { exigirPermissaoPagina } from '@/lib/seguranca-paginas'
import { ModuloCentroCulturalNav } from '@/components/modulo-centro-cultural-nav'

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

export default async function BiometriaAlunoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await exigirPermissaoPagina('Centro Cultural', 'Alunos', 'editar')

  const { id } = await params
  const supabase = await createClient()

  const { data: aluno, error } = await supabase
    .from('alunos')
    .select('id, nome, biometria_cadastrada')
    .eq('id', id)
    .maybeSingle()

  if (error || !aluno) {
    redirect('/alunos?message=Aluno não encontrado')
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCentroCulturalNav currentPath="/alunos" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Cadastro de biometria
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Vincule a biometria ao aluno para presença automática
                </p>
              </div>

              <Link
                href="/alunos"
                className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Voltar para alunos
              </Link>
            </div>
          </div>

          <div className={cardClassName()}>
            <div className="mb-6">
              <p className="text-sm text-slate-500">Aluno</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                {aluno.nome}
              </h2>

              <div className="mt-3">
                {aluno.biometria_cadastrada ? (
                  <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Biometria já cadastrada
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    Sem biometria cadastrada
                  </span>
                )}
              </div>
            </div>

            <form action={salvarBiometria} className="space-y-4">
              <input type="hidden" name="aluno_id" value={aluno.id} />

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Identificador biométrico
                </label>
                <input
                  name="identificador"
                  placeholder="Ex: BIO-ALUNO-0001"
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Dedo
                </label>
                <input
                  name="dedo"
                  placeholder="Ex: Polegar direito"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Salvar biometria
                </button>

                <Link
                  href="/alunos"
                  className="rounded-2xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}