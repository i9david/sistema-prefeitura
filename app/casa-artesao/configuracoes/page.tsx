import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModuloCasaArtesaoNav } from '@/components/modulo-casa-artesao-nav'
import { salvarConfiguracoesCasaArtesao } from './actions'

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

export default async function CasaArtesaoConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
  }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: configuracao, error } = await supabase
    .from('casa_artesao_configuracoes')
    .select('id, percentual_comissao_padrao, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    redirect(`/casa-artesao/configuracoes?message=${encodeURIComponent(error.message)}`)
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCasaArtesaoNav currentPath="/casa-artesao/configuracoes" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Configurações
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Defina a comissão padrão da Casa do Artesão para separar automaticamente o valor da secretaria e o valor dos artesãos.
            </p>
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Comissão padrão
            </h2>

            <form action={salvarConfiguracoesCasaArtesao} className="mt-6 grid gap-4">
              {configuracao?.id && (
                <input type="hidden" name="id" value={configuracao.id} />
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Percentual de comissão da secretaria
                </label>
                <input
                  name="percentual_comissao_padrao"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={configuracao?.percentual_comissao_padrao ?? 0}
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
                <p className="mt-2 text-sm text-slate-500">
                  Exemplo: 10 significa que 10% de cada venda ficará para a secretaria e o restante será repassado ao artesão.
                </p>
              </div>

              {params.message && (
                <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  {params.message}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded-2xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
                >
                  Salvar configurações
                </button>
              </div>
            </form>
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Como o sistema vai separar os valores
            </h2>

            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Caixa da secretaria:</span> soma da comissão calculada em cada item vendido.
              </p>
              <p>
                <span className="font-semibold">Valor dos artesãos:</span> soma do repasse líquido de cada item vendido.
              </p>
              <p>
                <span className="font-semibold">Total bruto:</span> valor total das vendas antes da divisão.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}