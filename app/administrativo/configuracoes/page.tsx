import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModuloAdministrativoNav } from '@/components/modulo-administrativo-nav'
import { salvarConfiguracaoSistema } from './actions'

type Configuracao = {
  id: string
  chave: string
  valor: string | null
  descricao: string | null
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

export default async function AdministrativoConfiguracoesPage({
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

  const { data, error } = await supabase
    .from('administrativo_configuracoes')
    .select('id, chave, valor, descricao')
    .in('chave', ['nome_sistema', 'logo_prefeitura'])

  if (error) {
    redirect(`/administrativo/configuracoes?message=${encodeURIComponent(error.message)}`)
  }

  const configuracoes = (data ?? []) as Configuracao[]

  const nomeSistema =
    configuracoes.find((item) => item.chave === 'nome_sistema')?.valor ||
    'Secretaria de Cultura e Turismo'

  const logoPrefeitura =
    configuracoes.find((item) => item.chave === 'logo_prefeitura')?.valor ||
    ''

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloAdministrativoNav currentPath="/administrativo/configuracoes" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Configurações do Sistema
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Ajuste informações gerais exibidas em todo o sistema.
            </p>
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Identidade visual do sistema
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Edite o nome exibido globalmente e a logomarca da Prefeitura.
            </p>

            <form action={salvarConfiguracaoSistema} className="mt-6 grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nome do sistema
                </label>

                <input
                  name="nome_sistema"
                  required
                  defaultValue={nomeSistema}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Logomarca da Prefeitura
                </label>

                <input
                  type="file"
                  name="logo_prefeitura"
                  accept="image/*"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Envie PNG, JPG ou WEBP
                </p>
              </div>

              {params.message && (
                <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  {params.message}
                </p>
              )}

              <button
                type="submit"
                className="rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white"
              >
                Salvar configuração
              </button>
            </form>
          </div>

          <div className={cardClassName()}>
            <h2 className="text-xl font-bold text-slate-900">
              Prévia
            </h2>

            <div className="mt-4">
              <p className="text-sm text-slate-500">Nome atual</p>
              <p className="text-2xl font-bold">{nomeSistema}</p>

              {logoPrefeitura && (
                <img src={logoPrefeitura} className="mt-4 h-24" />
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}