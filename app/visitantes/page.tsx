import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"
import { createClient } from '@/lib/supabase/server'
import { ModuloCentroCulturalNav } from '@/components/modulo-centro-cultural-nav'

type Visitante = {
  id: string
  nome: string
  telefone: string | null
  data_visita: string | null
  horario_entrada: string | null
  horario_saida: string | null
  status: string | null
  destino: string | null
  motivo: string | null
  observacoes: string | null
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function formatarData(data: string | null | undefined) {
  if (!data) return '-'
  const partes = data.split('-')
  if (partes.length !== 3) return data
  return `${partes[2]}/${partes[1]}/${partes[0]}`
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

function getDestinoLabel(destino: string | null | undefined) {
  return destino === 'museu' ? 'Museu' : 'Centro Cultural'
}

function getMesAtual() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date())
}

function getHojeBrasil() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export default async function VisitantesRelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    mes?: string
  }>
}) {
  const params = await searchParams
  const mesSelecionado = params.mes?.trim() || getMesAtual()
  const hoje = getHojeBrasil()

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const dataInicio = `${mesSelecionado}-01`
  const dataFim = `${mesSelecionado}-31`

  const { data, error } = await supabase
    .from('visitantes')
    .select(`
      id,
      nome,
      telefone,
      data_visita,
      horario_entrada,
      horario_saida,
      status,
      destino,
      motivo,
      observacoes
    `)
    .gte('data_visita', dataInicio)
    .lte('data_visita', dataFim)
    .order('data_visita', { ascending: false })
    .order('horario_entrada', { ascending: false })

  if (error) {
    redirect(`/visitantes/relatorios?message=${encodeURIComponent(error.message)}`)
  }

  const visitantes = (data ?? []) as Visitante[]

  const visitantesHoje = visitantes.filter((item) => item.data_visita === hoje)

  const visitantesCentroCultural = visitantes.filter(
    (item) => item.destino !== 'museu'
  )

  const visitantesMuseu = visitantes.filter(
    (item) => item.destino === 'museu'
  )

  const visitantesHojeCentroCultural = visitantesHoje.filter(
    (item) => item.destino !== 'museu'
  )

  const visitantesHojeMuseu = visitantesHoje.filter(
    (item) => item.destino === 'museu'
  )

  const ativosCentroCultural = visitantesCentroCultural.filter(
    (item) => item.status === 'ativo'
  ).length

  const ativosMuseu = visitantesMuseu.filter(
    (item) => item.status === 'ativo'
  ).length

  const encerradosCentroCultural = visitantesCentroCultural.filter(
    (item) => item.status === 'inativo'
  ).length

  const encerradosMuseu = visitantesMuseu.filter(
    (item) => item.status === 'inativo'
  ).length

  const agrupadoPorDia = visitantes.reduce<Record<string, Visitante[]>>((acc, item) => {
    const chave = item.data_visita || 'Sem data'
    if (!acc[chave]) acc[chave] = []
    acc[chave].push(item)
    return acc
  }, {})

  const diasOrdenados = Object.keys(agrupadoPorDia).sort((a, b) => b.localeCompare(a))

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCentroCulturalNav currentPath="/visitantes/relatorios" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Relatório mensal de visitantes
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Acompanhamento automático de visitantes por módulo, separando Centro Cultural e Museu.
            </p>
          </div>

          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <form method="get" className="grid gap-4 md:grid-cols-[260px_180px]">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Mês de referência
                  </label>
                  <input
                    type="month"
                    name="mes"
                    defaultValue={mesSelecionado}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Gerar relatório
                  </button>
                </div>
              </form>

              <a
                href={`/visitantes/relatorios/imprimir?mes=${mesSelecionado}`}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Versão para impressão
              </a>
            </div>

            {params.message && (
              <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {params.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Centro Cultural no mês</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {visitantesCentroCultural.length}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Museu no mês</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {visitantesMuseu.length}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Centro Cultural hoje</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {visitantesHojeCentroCultural.length}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Museu hoje</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {visitantesHojeMuseu.length}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Ativos Centro Cultural</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {ativosCentroCultural}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Encerrados Centro Cultural</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {encerradosCentroCultural}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Ativos Museu</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {ativosMuseu}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Encerrados Museu</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {encerradosMuseu}
              </p>
            </div>
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Consolidado por dia
            </h2>

            {diasOrdenados.length > 0 ? (
              <div className="mt-6 space-y-4">
                {diasOrdenados.map((dia) => {
                  const lista = agrupadoPorDia[dia]
                  const totalCentro = lista.filter((item) => item.destino !== 'museu').length
                  const totalMuseu = lista.filter((item) => item.destino === 'museu').length

                  return (
                    <div
                      key={dia}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {formatarData(dia)}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            Centro Cultural: {totalCentro} • Museu: {totalMuseu}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                          <thead>
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-slate-600">Nome</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-600">Telefone</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-600">Destino</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-600">Motivo</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                            </tr>
                          </thead>

                          <tbody>
                            {lista.map((item) => (
                              <tr key={item.id} className="bg-white">
                                <td className="rounded-l-2xl px-4 py-4 font-medium text-slate-900">
                                  {item.nome}
                                </td>
                                <td className="px-4 py-4 text-slate-700">
                                  {formatarTelefone(item.telefone)}
                                </td>
                                <td className="px-4 py-4 text-slate-700">
                                  {getDestinoLabel(item.destino)}
                                </td>
                                <td className="px-4 py-4 text-slate-700">
                                  {item.motivo || '-'}
                                </td>
                                <td className="rounded-r-2xl px-4 py-4 text-slate-700">
                                  {item.status || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhum visitante encontrado no mês selecionado.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}