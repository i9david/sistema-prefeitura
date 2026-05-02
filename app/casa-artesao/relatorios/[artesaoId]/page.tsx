import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"
import { createClient } from '@/lib/supabase/server'

type Artesao = {
  id: string
  nome: string
  telefone: string | null
  chave_pix: string | null
  tipo_chave_pix: string | null
  status: string
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

export default async function RelatorioArtesaoPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ artesaoId: string }>
  searchParams: Promise<{
    data_inicio?: string
    data_fim?: string
  }>
}) {
  const { artesaoId } = await params
  const query = await searchParams

  const dataInicio = query.data_inicio?.trim() || inicioMesAtual()
  const dataFim = query.data_fim?.trim() || hojeBrasil()

  const supabase = await createClient()

  const { data: artesao, error: artesaoError } = await supabase
    .from('casa_artesao_artesaos')
    .select('id, nome, telefone, chave_pix, tipo_chave_pix, status')
    .eq('id', artesaoId)
    .maybeSingle()

  if (artesaoError || !artesao) {
    redirect('/casa-artesao/relatorios')
  }

  const { data: itens, error: itensError } = await supabase
    .from('casa_artesao_venda_itens')
    .select(`
      quantidade,
      subtotal,
      comissao_valor,
      valor_repasse,
      casa_artesao_vendas!inner (
        data_venda
      ),
      casa_artesao_produtos (
        nome
      )
    `)
    .eq('artesao_id', artesaoId)
    .gte('casa_artesao_vendas.data_venda', dataInicio)
    .lte('casa_artesao_vendas.data_venda', dataFim)

  if (itensError) {
    redirect('/casa-artesao/relatorios')
  }

  const agrupados = new Map<
    string,
    {
      nome: string
      quantidade: number
      bruto: number
      comissao: number
      repasse: number
    }
  >()

  for (const item of itens ?? []) {
    const nomeProduto = (item as any).casa_artesao_produtos?.nome || 'Produto'

    if (!agrupados.has(nomeProduto)) {
      agrupados.set(nomeProduto, {
        nome: nomeProduto,
        quantidade: 0,
        bruto: 0,
        comissao: 0,
        repasse: 0,
      })
    }

    const atual = agrupados.get(nomeProduto)!

    atual.quantidade += Number((item as any).quantidade ?? 0)
    atual.bruto += Number((item as any).subtotal ?? 0)
    atual.comissao += Number((item as any).comissao_valor ?? 0)
    atual.repasse += Number((item as any).valor_repasse ?? 0)
  }

  const linhas = Array.from(agrupados.values()).sort((a, b) =>
    a.nome.localeCompare(b.nome)
  )

  const totalQuantidade = linhas.reduce((acc, item) => acc + item.quantidade, 0)
  const totalBruto = linhas.reduce((acc, item) => acc + item.bruto, 0)
  const totalComissao = linhas.reduce((acc, item) => acc + item.comissao, 0)
  const totalRepasse = linhas.reduce((acc, item) => acc + item.repasse, 0)

  return (
    <main className="min-h-screen bg-white p-8 text-slate-900 print:p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold">Casa do Artesão</h1>
            <p className="mt-2 text-sm text-slate-600">
              Relatório individual de fechamento
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white print:hidden"
          >
            Imprimir
          </button>
        </div>

        <div className="grid gap-4 rounded-2xl border border-slate-200 p-5 md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Artesão</p>
            <p className="text-lg font-semibold">{(artesao as Artesao).nome}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Período</p>
            <p className="text-lg font-semibold">
              {formatarData(dataInicio)} até {formatarData(dataFim)}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Telefone</p>
            <p className="text-base">{(artesao as Artesao).telefone || '-'}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Chave Pix</p>
            <p className="text-base">
              {(artesao as Artesao).chave_pix || '-'}{' '}
              {(artesao as Artesao).tipo_chave_pix
                ? `• ${(artesao as Artesao).tipo_chave_pix}`
                : ''}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Itens vendidos</p>
            <p className="mt-2 text-2xl font-bold">{totalQuantidade}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Total bruto</p>
            <p className="mt-2 text-2xl font-bold">{formatarMoeda(totalBruto)}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Comissão</p>
            <p className="mt-2 text-2xl font-bold">{formatarMoeda(totalComissao)}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Repasse</p>
            <p className="mt-2 text-2xl font-bold">{formatarMoeda(totalRepasse)}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-5">
          <h2 className="text-xl font-bold">Detalhamento por produto</h2>

          {linhas.length > 0 ? (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left font-semibold">Produto</th>
                    <th className="px-4 py-3 text-left font-semibold">Quantidade</th>
                    <th className="px-4 py-3 text-left font-semibold">Bruto</th>
                    <th className="px-4 py-3 text-left font-semibold">Comissão</th>
                    <th className="px-4 py-3 text-left font-semibold">Repasse</th>
                  </tr>
                </thead>

                <tbody>
                  {linhas.map((linha) => (
                    <tr key={linha.nome} className="border-b border-slate-100">
                      <td className="px-4 py-3">{linha.nome}</td>
                      <td className="px-4 py-3">{linha.quantidade}</td>
                      <td className="px-4 py-3">{formatarMoeda(linha.bruto)}</td>
                      <td className="px-4 py-3">{formatarMoeda(linha.comissao)}</td>
                      <td className="px-4 py-3">{formatarMoeda(linha.repasse)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              Nenhuma venda encontrada para este artesão no período informado.
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
            <p className="text-sm text-slate-500">Artesão</p>
            <div className="mt-16 border-t border-slate-300 pt-2 text-sm">
              Assinatura
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}