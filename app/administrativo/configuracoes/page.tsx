import { redirect } from 'next/navigation'
import { Eye, Image, Save, Settings } from 'lucide-react'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuloAdministrativoNav } from '@/components/modulo-administrativo-nav'
import { ModuleCard } from '@/components/module/module-card'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { salvarConfiguracaoSistema } from './actions'

type Configuracao = {
  id: string
  chave: string
  valor: string | null
  descricao: string | null
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
    <ModuleLayout sidebar={<ModuloAdministrativoNav currentPath="/administrativo/configuracoes" />}>
      <ModuleHeader
        title="Configurações do Sistema"
        eyebrow="Operação"
        description="Ajuste informações gerais exibidas em todo o sistema."
        icon={Settings}
        accent="blue"
        context="Identidade institucional"
      />

          <ModuleCard>
            <div className="flex items-start gap-3">
              <span className="rounded-lg bg-blue-50 p-2 text-blue-700">
                <Image size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Identidade visual do sistema
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                  Edite o nome exibido globalmente e a logomarca da Prefeitura.
                </p>
              </div>
            </div>

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
                className="btn-primary justify-center"
              >
                <Save size={16} aria-hidden="true" />
                Salvar configuração
              </button>
            </form>
          </ModuleCard>

          <ModuleCard>
            <div className="flex items-center gap-2">
              <Eye className="text-blue-700" size={20} aria-hidden="true" />
              <h2 className="text-xl font-bold text-slate-900">Prévia</h2>
            </div>

            <div className="mt-4">
              <p className="text-sm text-slate-500">Nome atual</p>
              <p className="text-2xl font-bold">{nomeSistema}</p>

              {logoPrefeitura && (
                <img src={logoPrefeitura} className="mt-4 h-24" />
              )}
            </div>
          </ModuleCard>
    </ModuleLayout>
  )
}
