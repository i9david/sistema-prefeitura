import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"
import { createClient } from '@/lib/supabase/server'
import { ModuloTurismoNav } from '@/components/modulo-turismo-nav'
import {
  criarPontoTuristico,
  ativarPonto,
  inativarPonto,
} from './actions'

function card() {
  return 'rounded-[28px] border border-slate-200 bg-white p-6 shadow'
}

export default async function Page({ searchParams }: any) {
  const params = await searchParams
  const modoNovo = params.novo === '1'

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('turismo_pontos')
    .select('*')
    .order('nome')

  const pontos = data || []

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="grid lg:grid-cols-[300px_1fr] gap-6 max-w-7xl mx-auto">
        
        <ModuloTurismoNav currentPath="/turismo/pontos" />

        <section className="space-y-6">

          {/* HEADER */}
          <div className={card()}>
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">
                Pontos Turísticos
              </h1>

              {!modoNovo && (
                <a
                  href="/turismo/pontos?novo=1"
                  className="bg-violet-600 text-white px-4 py-2 rounded-xl"
                >
                  Novo ponto
                </a>
              )}
            </div>
          </div>

          {/* FORM */}
          {modoNovo && (
            <div className={card()}>
              <form action={criarPontoTuristico} className="grid gap-3">

                <input name="nome" placeholder="Nome" required className="border p-3 rounded-xl" />
                <input name="tipo" placeholder="Tipo (cachoeira, parque...)" className="border p-3 rounded-xl" />
                <input name="endereco" placeholder="Endereço" className="border p-3 rounded-xl" />
                <input name="localizacao_google" placeholder="Link Google Maps" className="border p-3 rounded-xl" />

                <textarea name="descricao" placeholder="Descrição" className="border p-3 rounded-xl" />
                <textarea name="observacoes" placeholder="Observações" className="border p-3 rounded-xl" />

                <button className="bg-green-600 text-white p-3 rounded-xl">
                  Salvar
                </button>

              </form>
            </div>
          )}

          {/* LISTA */}
          <div className={card()}>
            <div className="space-y-3">

              {pontos.map((p: any) => (
                <div key={p.id} className="border p-4 rounded-xl bg-slate-50">

                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-bold">{p.nome}</h3>
                      <p className="text-sm">{p.tipo}</p>
                    </div>

                    <div className="flex gap-2">
                      {p.status === 'ativo' ? (
                        <form action={inativarPonto}>
                          <input type="hidden" name="id" value={p.id} />
                          <button className="bg-red-600 text-white px-3 py-1 rounded">
                            Inativar
                          </button>
                        </form>
                      ) : (
                        <form action={ativarPonto}>
                          <input type="hidden" name="id" value={p.id} />
                          <button className="bg-green-600 text-white px-3 py-1 rounded">
                            Ativar
                          </button>
                        </form>
                      )}
                    </div>
                  </div>

                </div>
              ))}

            </div>
          </div>

        </section>
      </div>
    </main>
  )
}