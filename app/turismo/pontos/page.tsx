import { redirect } from 'next/navigation'
import { MapPin, Plus } from 'lucide-react'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuleCard } from '@/components/module/module-card'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuloTurismoNav } from '@/components/modulo-turismo-nav'
import {
  ativarPonto,
  criarPontoTuristico,
  inativarPonto,
} from './actions'
import { cache } from 'react'

const carregarPontosTuristicos = cache(async () => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('turismo_pontos')
    .select('id, nome, descricao, endereco, telefone, email, site, status, created_at')
    .order('nome')

  if (error) throw error
  return data || []
})

export default async function Page({ searchParams }: any) {
  const params = await searchParams
  const modoNovo = params.novo === '1'

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const pontos = await carregarPontosTuristicos()

  return (
    <ModuleLayout sidebar={<ModuloTurismoNav currentPath="/turismo/pontos" />}>
      <ModuleHeader
        title="Pontos turísticos"
        description="Cadastro e acompanhamento dos atrativos, locais de visitação e pontos de interesse do município."
        eyebrow="Cadastros"
        icon={MapPin}
        accent="emerald"
        action={
          !modoNovo && (
            <a
              href="/turismo/pontos?novo=1"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Plus size={16} aria-hidden="true" />
              Novo ponto
            </a>
          )
        }
      />

      {modoNovo && (
        <ModuleCard>
          <h2 className="text-xl font-bold text-slate-950">Novo ponto turístico</h2>
          <form action={criarPontoTuristico} className="mt-5 grid gap-3">
            <input name="nome" placeholder="Nome" required className="rounded-lg border border-slate-300 px-4 py-3" />
            <input name="tipo" placeholder="Tipo (cachoeira, parque...)" className="rounded-lg border border-slate-300 px-4 py-3" />
            <input name="endereco" placeholder="Endereço" className="rounded-lg border border-slate-300 px-4 py-3" />
            <input name="localizacao_google" placeholder="Link Google Maps" className="rounded-lg border border-slate-300 px-4 py-3" />
            <textarea name="descricao" placeholder="Descrição" className="min-h-28 rounded-lg border border-slate-300 px-4 py-3" />
            <textarea name="observacoes" placeholder="Observações" className="min-h-24 rounded-lg border border-slate-300 px-4 py-3" />
            <button className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
              Salvar
            </button>
          </form>
        </ModuleCard>
      )}

      <ModuleCard>
        <h2 className="text-xl font-bold text-slate-950">Lista de pontos</h2>
        <div className="mt-5 space-y-3">
          {pontos.map((p: any) => (
            <div key={p.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-bold text-slate-950">{p.nome}</h3>
                  <p className="text-sm text-slate-600">{p.tipo || '-'}</p>
                </div>

                <div className="flex gap-2">
                  {p.status === 'ativo' ? (
                    <form action={inativarPonto}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700">
                        Inativar
                      </button>
                    </form>
                  ) : (
                    <form action={ativarPonto}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
                        Ativar
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ModuleCard>
    </ModuleLayout>
  )
}
