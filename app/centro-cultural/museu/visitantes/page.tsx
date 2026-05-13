import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { Sidebar } from "@/components/sidebar"
import { ModuloMuseuNav } from '@/components/modulo-museu-nav'

type MuseuVisitante = {
  id: string
  visitante_id: string | null
  nome: string
  telefone: string | null
  data_visita: string | null
  horario_entrada: string | null
  horario_saida: string | null
  status: string | null
  observacoes: string | null
  created_at: string | null
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function formatarTelefone(valor: string | null | undefined) {
  const numeros = String(valor ?? '').replace(/\D/g, '').slice(0, 11)

  if (!numeros) return '-'

  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d+)/, '$1-$2')
  }

  return numeros
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d+)/, '$1-$2')
}

function formatarData(data: string | null | undefined) {
  if (!data) return '-'
  const partes = data.split('-')
  if (partes.length !== 3) return data
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function formatarHora(hora: string | null | undefined) {
  if (!hora) return '-'
  return hora.slice(0, 5)
}

export default async function MuseuVisitantesPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    busca?: string
    status?: string
  }>
}) {
  const params = await searchParams
  const busca = params.busca?.trim() || ''
  const statusFiltro = params.status?.trim() || ''

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let query = supabase
    .from('museu_visitantes')
    .select(`
      id,
      visitante_id,
      nome,
      telefone,
      data_visita,
      horario_entrada,
      horario_saida,
      status,
      observacoes,
      created_at
    `)
    .order('data_visita', { ascending: false })
    .order('horario_entrada', { ascending: false })

  if (busca) {
    query = query.or(`nome.ilike.%${busca}%,telefone.ilike.%${busca}%`)
  }

  if (statusFiltro) {
    query = query.eq('status', statusFiltro)
  }

  const { data, error } = await query

  if (error) {
    redirect(`/centro-cultural/museu/visitantes?message=${encodeURIComponent(error.message)}`)
  }

  const visitantes = (data ?? []) as MuseuVisitante[]

  const hoje = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  const visitantesHoje = visitantes.filter(
    (visitante) => String(visitante.data_visita ?? '') === hoje
  )

  const ativosHoje = visitantesHoje.filter((visitante) => visitante.status === 'ativo').length
  const encerradosHoje = visitantesHoje.filter((visitante) => visitante.status === 'inativo').length

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloMuseuNav currentPath="/centro-cultural/museu/visitantes" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Visitantes do Museu
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Histórico automático das visitas registradas com destino Museu.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Visitas hoje</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {visitantesHoje.length}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Em visita agora</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {ativosHoje}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Encerrados hoje</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {encerradosHoje}
              </p>
            </div>
          </div>

          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Histórico de visitantes do museu
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Dados vinculados automaticamente a partir do módulo Visitantes.
                </p>
              </div>

              <form method="get" className="grid w-full max-w-4xl gap-2 md:grid-cols-3">
                <input
                  type="text"
                  name="busca"
                  placeholder="Buscar por nome ou telefone"
                  defaultValue={busca}
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />

                <select
                  name="status"
                  defaultValue={statusFiltro}
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Todos os status</option>
                  <option value="ativo">Em visita</option>
                  <option value="inativo">Encerrado</option>
                </select>

                <button
                  type="submit"
                  className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Filtrar
                </button>
              </form>
            </div>

            {params.message && (
              <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {params.message}
              </p>
            )}

            {visitantes.length > 0 ? (
              <div className="mt-6 space-y-4">
                {visitantes.map((visitante) => (
                  <div
                    key={visitante.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">
                          {visitante.nome}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {formatarTelefone(visitante.telefone)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            visitante.status === 'ativo'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {visitante.status === 'ativo' ? 'Em visita' : 'Encerrado'}
                        </span>
                      </div>

                      <div className="text-sm text-slate-700 space-y-1">
                        <p>
                          <span className="font-semibold">Data:</span>{' '}
                          {formatarData(visitante.data_visita)}
                        </p>
                        <p>
                          <span className="font-semibold">Entrada:</span>{' '}
                          {formatarHora(visitante.horario_entrada)}
                        </p>
                        <p>
                          <span className="font-semibold">Saída:</span>{' '}
                          {formatarHora(visitante.horario_saida)}
                        </p>
                        <p>
                          <span className="font-semibold">Observações:</span>{' '}
                          {visitante.observacoes || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhum visitante do museu encontrado.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
