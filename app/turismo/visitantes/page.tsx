import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModuloTurismoNav } from '@/components/modulo-turismo-nav'
import { criarVisitanteTurismo } from './actions'

function card() {
  return 'rounded-[28px] border border-slate-200 bg-white p-6 shadow'
}

function formatarData(data: string | null) {
  if (!data) return '-'
  const p = data.split('-')
  return `${p[2]}/${p[1]}/${p[0]}`
}

export default async function Page({ searchParams }: any) {
  const params = await searchParams
  const modoNovo = params.novo === '1'
  const cidade = params.cidade || ''
  const ponto = params.ponto || ''

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase
    .from('turismo_visitantes')
    .select('*')
    .order('data_visita', { ascending: false })

  if (cidade) {
    query = query.ilike('cidade_origem', `%${cidade}%`)
  }

  if (ponto) {
    query = query.ilike('ponto_visitado', `%${ponto}%`)
  }

  const { data } = await query
  const visitantes = data || []

  const hoje = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  const visitantesHoje = visitantes.filter(v => v.data_visita === hoje)

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="grid lg:grid-cols-[300px_1fr] gap-6 max-w-7xl mx-auto">

        <ModuloTurismoNav currentPath="/turismo/visitantes" />

        <section className="space-y-6">

          <div className={card()}>
            <div className="flex justify-between">
              <h1 className="text-2xl font-bold">Visitantes</h1>

              {!modoNovo && (
                <a href="/turismo/visitantes?novo=1" className="bg-green-600 text-white px-4 py-2 rounded-xl">
                  Novo visitante
                </a>
              )}
            </div>
          </div>

          {modoNovo && (
            <div className={card()}>
              <form action={criarVisitanteTurismo} className="grid gap-3">

                <input name="nome" placeholder="Nome" required className="border p-3 rounded-xl" />
                <input name="telefone" placeholder="Telefone" className="border p-3 rounded-xl" />
                <input name="cidade_origem" placeholder="Cidade de origem" className="border p-3 rounded-xl" />
                <input name="ponto_visitado" placeholder="Ponto visitado" className="border p-3 rounded-xl" />
                <input type="date" name="data_visita" className="border p-3 rounded-xl" />

                <textarea name="observacoes" placeholder="Observações" className="border p-3 rounded-xl" />

                <button className="bg-green-600 text-white p-3 rounded-xl">
                  Salvar
                </button>

              </form>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className={card()}>
              <p className="text-sm">Total visitantes</p>
              <p className="text-2xl font-bold">{visitantes.length}</p>
            </div>

            <div className={card()}>
              <p className="text-sm">Hoje</p>
              <p className="text-2xl font-bold">{visitantesHoje.length}</p>
            </div>
          </div>

          <div className={card()}>
            <form className="grid md:grid-cols-3 gap-2">
              <input name="cidade" defaultValue={cidade} placeholder="Cidade" className="border p-3 rounded-xl" />
              <input name="ponto" defaultValue={ponto} placeholder="Ponto" className="border p-3 rounded-xl" />
              <button className="bg-violet-600 text-white rounded-xl">Filtrar</button>
            </form>
          </div>

          <div className={card()}>
            <div className="space-y-3">

              {visitantes.map(v => (
                <div key={v.id} className="border p-4 rounded-xl bg-slate-50">

                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-bold">{v.nome}</h3>
                      <p className="text-sm">{v.cidade_origem}</p>
                      <p className="text-xs">{v.ponto_visitado}</p>
                    </div>

                    <div className="text-sm">
                      {formatarData(v.data_visita)}
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