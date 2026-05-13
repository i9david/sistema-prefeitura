import { redirect } from 'next/navigation'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'

type Visitante = {
  id: string
  pessoa_id: string | null
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

type Relacao<T> = T | T[] | null

type PessoaRelacionada = {
  nome: string
  telefone: string | null
}

type VisitaCrm = {
  id: string
  pessoa_id: string
  destino: string | null
  motivo: string | null
  data_visita: string | null
  horario_entrada: string | null
  horario_saida: string | null
  status: string | null
  observacoes: string | null
  pessoas: Relacao<PessoaRelacionada>
}

function normalizarRelacao<T>(relacao: Relacao<T>) {
  if (!relacao) return null
  if (Array.isArray(relacao)) return relacao[0] ?? null
  return relacao
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

function formatarMesReferencia(valor: string) {
  const [ano, mes] = valor.split('-')
  return `${mes}/${ano}`
}

function getPeriodoDoMes(mesReferencia: string) {
  const [anoTexto, mesTexto] = mesReferencia.split('-')
  const ano = Number(anoTexto)
  const mes = Number(mesTexto)

  const referencia = !ano || !mes ? new Date() : new Date(ano, mes - 1, 1)
  const inicio = new Date(referencia.getFullYear(), referencia.getMonth(), 1)
  const fim = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0)

  const formatar = (data: Date) => {
    const y = data.getFullYear()
    const m = String(data.getMonth() + 1).padStart(2, '0')
    const d = String(data.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  return {
    dataInicio: formatar(inicio),
    dataFim: formatar(fim),
  }
}

export default async function VisitantesRelatorioImpressaoPage({
  searchParams,
}: {
  searchParams: Promise<{
    mes?: string
  }>
}) {
  const params = await searchParams
  const mesSelecionado = params.mes?.trim() || getMesAtual()
  const { dataInicio, dataFim } = getPeriodoDoMes(mesSelecionado)

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: visitasCrmData, error: visitasCrmError } = await supabase
    .from('visitante_visitas')
    .select(`
      id,
      pessoa_id,
      destino,
      motivo,
      data_visita,
      horario_entrada,
      horario_saida,
      status,
      observacoes,
      pessoas:pessoa_id!visitante_visitas_pessoa_id_fkey (
        nome,
        telefone
      )
    `)
    .gte('data_visita', dataInicio)
    .lte('data_visita', dataFim)
    .order('data_visita', { ascending: true })
    .order('horario_entrada', { ascending: true })

  const { data, error } =
    visitasCrmError
      ? await supabase
          .from('visitantes')
          .select(`
            id,
            pessoa_id,
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
          .order('data_visita', { ascending: true })
          .order('horario_entrada', { ascending: true })
      : { data: [], error: null }

  if (error) {
    redirect('/visitantes/relatorios')
  }

  const visitantes = visitasCrmError
    ? ((data ?? []) as Visitante[])
    : ((visitasCrmData ?? []) as unknown as VisitaCrm[]).map((visita) => {
        const pessoa = normalizarRelacao(visita.pessoas)

        return {
          id: visita.id,
          pessoa_id: visita.pessoa_id,
          nome: pessoa?.nome ?? 'Pessoa sem nome',
          telefone: pessoa?.telefone ?? null,
          data_visita: visita.data_visita,
          horario_entrada: visita.horario_entrada,
          horario_saida: visita.horario_saida,
          status: visita.status,
          destino: visita.destino,
          motivo: visita.motivo,
          observacoes: visita.observacoes,
        }
      })

  const centroCultural = visitantes.filter((item) => item.destino !== 'museu')
  const museu = visitantes.filter((item) => item.destino === 'museu')

  const ativosCentro = centroCultural.filter((item) => item.status === 'ativo').length
  const encerradosCentro = centroCultural.filter((item) => item.status === 'inativo').length
  const ativosMuseu = museu.filter((item) => item.status === 'ativo').length
  const encerradosMuseu = museu.filter((item) => item.status === 'inativo').length

  const recorrenciaPorPessoa = visitantes.reduce<
    Record<string, { nome: string; telefone: string | null; total: number }>
  >((acc, item) => {
    const chave = item.pessoa_id ?? `${item.nome}-${item.telefone ?? ''}`
    const atual = acc[chave] ?? {
      nome: item.nome,
      telefone: item.telefone,
      total: 0,
    }

    atual.total += 1
    acc[chave] = atual
    return acc
  }, {})

  const visitantesUnicos = Object.keys(recorrenciaPorPessoa).length
  const visitantesRecorrentes = Object.values(recorrenciaPorPessoa).filter(
    (item) => item.total > 1
  ).length

  const agrupadoPorDia = visitantes.reduce<Record<string, Visitante[]>>((acc, item) => {
    const chave = item.data_visita || 'Sem data'
    if (!acc[chave]) acc[chave] = []
    acc[chave].push(item)
    return acc
  }, {})

  const diasOrdenados = Object.keys(agrupadoPorDia).sort((a, b) => a.localeCompare(b))

  return (
    <main className="min-h-screen bg-white p-8 text-slate-900 print:p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold">Relatório Mensal de Visitantes</h1>
            <p className="mt-2 text-sm text-slate-600">Centro Cultural e Museu</p>
            <p className="mt-1 text-sm text-slate-600">
              Referência: {formatarMesReferencia(mesSelecionado)}
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white print:hidden"
          >
            Imprimir
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Centro Cultural no mês</p>
            <p className="mt-2 text-2xl font-bold">{centroCultural.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Museu no mês</p>
            <p className="mt-2 text-2xl font-bold">{museu.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Visitantes únicos</p>
            <p className="mt-2 text-2xl font-bold">{visitantesUnicos}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Visitantes recorrentes</p>
            <p className="mt-2 text-2xl font-bold">{visitantesRecorrentes}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Total geral do mês</p>
            <p className="mt-2 text-2xl font-bold">{visitantes.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Ativos Centro Cultural</p>
            <p className="mt-2 text-2xl font-bold">{ativosCentro}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Ativos Museu</p>
            <p className="mt-2 text-2xl font-bold">{ativosMuseu}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Encerrados Centro Cultural</p>
            <p className="mt-2 text-2xl font-bold">{encerradosCentro}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Encerrados Museu</p>
            <p className="mt-2 text-2xl font-bold">{encerradosMuseu}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Módulos monitorados</p>
            <p className="mt-2 text-2xl font-bold">2</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-5">
          <h2 className="text-xl font-bold">Consolidado por dia</h2>

          {diasOrdenados.length > 0 ? (
            <div className="mt-5 space-y-6">
              {diasOrdenados.map((dia) => {
                const lista = agrupadoPorDia[dia]
                const totalCentro = lista.filter((item) => item.destino !== 'museu').length
                const totalMuseu = lista.filter((item) => item.destino === 'museu').length

                return (
                  <div key={dia} className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold">{formatarData(dia)}</h3>
                      <p className="text-sm text-slate-600">
                        Centro Cultural: {totalCentro} • Museu: {totalMuseu}
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="px-3 py-2 text-left font-semibold">Nome</th>
                            <th className="px-3 py-2 text-left font-semibold">Telefone</th>
                            <th className="px-3 py-2 text-left font-semibold">Destino</th>
                            <th className="px-3 py-2 text-left font-semibold">Motivo</th>
                            <th className="px-3 py-2 text-left font-semibold">Status</th>
                            <th className="px-3 py-2 text-left font-semibold">Observações</th>
                          </tr>
                        </thead>

                        <tbody>
                          {lista.map((item) => (
                            <tr key={item.id} className="border-b border-slate-100">
                              <td className="px-3 py-2">{item.nome}</td>
                              <td className="px-3 py-2">{formatarTelefone(item.telefone)}</td>
                              <td className="px-3 py-2">{getDestinoLabel(item.destino)}</td>
                              <td className="px-3 py-2">{item.motivo || '-'}</td>
                              <td className="px-3 py-2">{item.status || '-'}</td>
                              <td className="px-3 py-2">{item.observacoes || '-'}</td>
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

        <div className="grid gap-4 pt-8 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Responsável pela conferência</p>
            <div className="mt-16 border-t border-slate-300 pt-2 text-sm">
              Assinatura
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Responsável pelo relatório</p>
            <div className="mt-16 border-t border-slate-300 pt-2 text-sm">
              Assinatura
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
