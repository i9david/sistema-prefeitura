import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModuloCasaArtesaoNav } from '@/components/modulo-casa-artesao-nav'

type Artesao = {
  id: string
  nome: string
  telefone: string | null
  chave_pix: string | null
  tipo_chave_pix: string | null
  status: string
}

type Fechamento = {
  id: string
  artesao_id: string
  competencia: string
  status: string
  total_repasse: number | null
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function formatarMoeda(valor: number | null | undefined) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor ?? 0))
}

function formatarData(data: string | null | undefined) {
  if (!data) return '-'
  const partes = data.split('-')
  if (partes.length !== 3) return data
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function inicioMesAtual() {
  const hoje = new Date()
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).format(hoje) + '-01'
}

function hojeBrasil() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function competenciaFromData(data: string) {
  const [ano, mes] = data.split('-')
  return `${mes}/${ano}`
}

export default async function CasaArtesaoRelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{
    data_inicio?: string
    data_fim?: string
    artesao_id?: string
    message?: string
  }>
}) {
  const params = await searchParams
  const dataInicio = params.data_inicio?.trim() || inicioMesAtual()
  const dataFim = params.data_fim?.trim() || hojeBrasil()
  const artesaoFiltro = params.artesao_id?.trim() || ''

  const competencia = competenciaFromData(dataInicio)

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: artesaosData, error: artesaosError },
    { data: fechamentosData, error: fechamentosError },
    { data: itensData, error: itensError },
  ] = await Promise.all([
    supabase
      .from('casa_artesao_artesaos')
      .select('id, nome, telefone, chave_pix, tipo_chave_pix, status')
      .order('nome', { ascending: true }),

    supabase
      .from('casa_artesao_fechamentos')
      .select('id, artesao_id, competencia, status, total_repasse')
      .eq('competencia', competencia),

    supabase
      .from('casa_artesao_venda_itens')
      .select(`
        quantidade,
        subtotal,
        comissao_valor,
        valor_repasse,
        artesao_id,
        casa_artesao_vendas!inner (
          data_venda
        ),
        casa_artesao_artesaos (
          nome
        )
      `)
      .gte('casa_artesao_vendas.data_venda', dataInicio)
      .lte('casa_artesao_vendas.data_venda', dataFim),
  ])

  if (artesaosError) {
    redirect(`/casa-artesao/relatorios?message=${encodeURIComponent(artesaosError.message)}`)
  }

  if (fechamentosError) {
    redirect(`/casa-artesao/relatorios?message=${encodeURIComponent(fechamentosError.message)}`)
  }

  if (itensError) {
    redirect(`/casa-artesao/relatorios?message=${encodeURIComponent(itensError.message)}`)
  }

  const artesaos = (artesaosData ?? []) as Artesao[]
  const fechamentos = (fechamentosData ?? []) as Fechamento[]
  let itens = (itensData ?? []) as any[]

  if (artesaoFiltro) {
    itens = itens.filter((item) => item.artesao_id === artesaoFiltro)
  }

  const agrupado: Record<
    string,
    {
      artesaoId: string
      artesaoNome: string
      total: number
      comissao: number
      repasse: number
      quantidade: number
    }
  > = {}

  itens.forEach((item: any) => {
    const artesaoId = item.artesao_id
    const artesaoNome = item.casa_artesao_artesaos?.nome || 'Artesão'

    if (!agrupado[artesaoId]) {
      agrupado[artesaoId] = {
        artesaoId,
        artesaoNome,
        total: 0,
        comissao: 0,
        repasse: 0,
        quantidade: 0,
      }
    }

    agrupado[artesaoId].total += Number(item.subtotal ?? 0)
    agrupado[artesaoId].comissao += Number(item.comissao_valor ?? 0)
    agrupado[artesaoId].repasse += Number(item.valor_repasse ?? 0)
    agrupado[artesaoId].quantidade += Number(item.quantidade ?? 0)
  })

  const linhas = Object.values(agrupado).sort((a, b) =>
    a.artesaoNome.localeCompare(b.artesaoNome)
  )

  const totalGeral = linhas.reduce((acc, item) => acc + item.total, 0)
  const totalComissao = linhas.reduce((acc, item) => acc + item.comissao, 0)
  const totalRepasse = linhas.reduce((acc, item) => acc + item.repasse, 0)

  function getArtesao(artesaoId: string) {
    return artesaos.find((artesao) => artesao.id === artesaoId) || null
  }

  function getFechamento(artesaoId: string) {
    return fechamentos.find(
      (fechamento) =>
        fechamento.artesao_id === artesaoId && fechamento.competencia === competencia
    ) || null
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCasaArtesaoNav currentPath="/casa-artesao/relatorios" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Relatórios
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Fechamento financeiro por artesão com comissão, repasse e conferência mensal.
            </p>
          </div>

          <div className={cardClassName()}>
            <form method="get" className="grid gap-4 md:grid-cols-4">
              <input
                type="date"
                name="data_inicio"
                defaultValue={dataInicio}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />

              <input
                type="date"
                name="data_fim"
                defaultValue={dataFim}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />

              <select
                name="artesao_id"
                defaultValue={artesaoFiltro}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              >
                <option value="">Todos os artesãos</option>
                {artesaos.map((artesao) => (
                  <option key={artesao.id} value={artesao.id}>
                    {artesao.nome}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
              >
                Gerar relatório
              </button>
            </form>

            {params.message && (
              <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {params.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Total bruto</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {formatarMoeda(totalGeral)}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Comissão</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {formatarMoeda(totalComissao)}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Repasse líquido</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {formatarMoeda(totalRepasse)}
              </p>
            </div>
          </div>

          <div className={cardClassName()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Resumo por artesão
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Período de {formatarData(dataInicio)} até {formatarData(dataFim)}
                </p>
              </div>

              <a
                href="/casa-artesao/fechamentos"
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Ir para fechamentos
              </a>
            </div>

            {linhas.length > 0 ? (
              <div className="mt-6 space-y-4">
                {linhas.map((linha) => {
                  const artesao = getArtesao(linha.artesaoId)
                  const fechamento = getFechamento(linha.artesaoId)

                  return (
                    <div
                      key={linha.artesaoId}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">
                              {linha.artesaoNome}
                            </h3>
                            <p className="text-sm text-slate-600">
                              Telefone: {artesao?.telefone || '-'}
                            </p>
                            <p className="text-sm text-slate-600">
                              Pix: {artesao?.chave_pix || '-'} {artesao?.tipo_chave_pix ? `• ${artesao.tipo_chave_pix}` : ''}
                            </p>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                              <span className="font-semibold">Itens vendidos:</span> {linha.quantidade}
                            </div>
                            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                              <span className="font-semibold">Bruto:</span> {formatarMoeda(linha.total)}
                            </div>
                            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                              <span className="font-semibold">Comissão:</span> {formatarMoeda(linha.comissao)}
                            </div>
                            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                              <span className="font-semibold">Repasse:</span> {formatarMoeda(linha.repasse)}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {fechamento ? (
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  fechamento.status === 'pago'
                                    ? 'bg-green-100 text-green-700'
                                    : fechamento.status === 'fechado'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                Fechamento {fechamento.status} em {fechamento.competencia}
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                                Sem fechamento gerado para {competencia}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`/casa-artesao/fechamentos?artesao_id=${linha.artesaoId}`}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Ver fechamento
                          </a>

                          <a
                            href={`/casa-artesao/relatorios/${linha.artesaoId}?data_inicio=${dataInicio}&data_fim=${dataFim}`}
                            className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
                          >
                            Imprimir relatório
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhuma venda encontrada no período informado.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}