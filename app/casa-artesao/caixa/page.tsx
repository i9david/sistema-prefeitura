import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModuloCasaArtesaoNav } from '@/components/modulo-casa-artesao-nav'
import { registrarVenda } from './actions'

type Produto = {
  id: string
  nome: string
  preco: number | null
  quantidade: number | null
  artesao_id: string
  status: string | null
}

type Artesao = {
  id: string
  nome: string
}

type Venda = {
  id: string
  data_venda: string
  valor_total: number | null
  observacoes: string | null
  created_at: string
}

type VendaItem = {
  id: string
  venda_id: string
  produto_id: string
  artesao_id: string
  quantidade: number
  preco_unitario: number | null
  subtotal: number | null
  created_at: string
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

export default async function CasaArtesaoCaixaPage({
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

  const [
    { data: produtosData, error: produtosError },
    { data: artesaosData, error: artesaosError },
    { data: vendasData, error: vendasError },
    { data: itensData, error: itensError },
  ] = await Promise.all([
    supabase
      .from('casa_artesao_produtos')
      .select('id, nome, preco, quantidade, artesao_id, status')
      .eq('status', 'ativo')
      .order('nome', { ascending: true }),

    supabase
      .from('casa_artesao_artesaos')
      .select('id, nome')
      .order('nome', { ascending: true }),

    supabase
      .from('casa_artesao_vendas')
      .select('id, data_venda, valor_total, observacoes, created_at')
      .order('created_at', { ascending: false })
      .limit(20),

    supabase
      .from('casa_artesao_venda_itens')
      .select('id, venda_id, produto_id, artesao_id, quantidade, preco_unitario, subtotal, created_at')
      .order('created_at', { ascending: false }),
  ])

  if (produtosError) {
    redirect(`/casa-artesao/caixa?message=${encodeURIComponent(produtosError.message)}`)
  }

  if (artesaosError) {
    redirect(`/casa-artesao/caixa?message=${encodeURIComponent(artesaosError.message)}`)
  }

  if (vendasError) {
    redirect(`/casa-artesao/caixa?message=${encodeURIComponent(vendasError.message)}`)
  }

  if (itensError) {
    redirect(`/casa-artesao/caixa?message=${encodeURIComponent(itensError.message)}`)
  }

  const produtos = (produtosData ?? []) as Produto[]
  const artesaos = (artesaosData ?? []) as Artesao[]
  const vendas = (vendasData ?? []) as Venda[]
  const itens = (itensData ?? []) as VendaItem[]

  function getNomeArtesao(artesaoId: string) {
    return artesaos.find((artesao) => artesao.id === artesaoId)?.nome || 'Artesão'
  }

  function getNomeProduto(produtoId: string) {
    return produtos.find((produto) => produto.id === produtoId)?.nome || 'Produto'
  }

  function itensDaVenda(vendaId: string) {
    return itens.filter((item) => item.venda_id === vendaId)
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCasaArtesaoNav currentPath="/casa-artesao/caixa" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Caixa
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Registre vendas com baixa automática no estoque e separação por artesão.
            </p>
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Nova venda
            </h2>

            <form action={registrarVenda} className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <input
                  name="cliente_nome"
                  placeholder="Nome completo do comprador"
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <input
                  name="cliente_telefone"
                  placeholder="Telefone com DDD"
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <input
                  name="cliente_data_nascimento"
                  type="date"
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  Itens da venda
                </h3>

                {produtos.length > 0 ? (
                  <div className="space-y-3">
                    {produtos.map((produto) => (
                      <div
                        key={produto.id}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center"
                      >
                        <input
                          type="hidden"
                          name="produto_id"
                          value={produto.id}
                        />

                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">
                            {produto.nome}
                          </p>
                          <p className="text-sm text-slate-600">
                            Artesão: {getNomeArtesao(produto.artesao_id)}
                          </p>
                          <p className="text-sm text-slate-600">
                            {formatarMoeda(produto.preco)} • Estoque: {produto.quantidade ?? 0}
                          </p>
                        </div>

                        <div className="w-full md:w-40">
                          <input
                            type="number"
                            name="quantidade"
                            min="0"
                            defaultValue={0}
                            placeholder="Quantidade"
                            className="w-full rounded-xl border border-slate-300 px-3 py-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">
                    Nenhum produto ativo disponível para venda.
                  </p>
                )}
              </div>

              {params.message && (
                <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  {params.message}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded-2xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
                >
                  Finalizar venda
                </button>
              </div>
            </form>
          </div>

          <div className={cardClassName()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Histórico de vendas
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Últimas vendas registradas no caixa
                </p>
              </div>
            </div>

            {vendas.length > 0 ? (
              <div className="mt-6 space-y-4">
                {vendas.map((venda) => {
                  const itensVenda = itensDaVenda(venda.id)

                  return (
                    <div
                      key={venda.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            Venda em {formatarData(venda.data_venda)}
                          </h3>
                          <p className="text-sm text-slate-600">
                            Total: {formatarMoeda(venda.valor_total)}
                          </p>
                          <p className="text-sm text-slate-600">
                            Observações: {venda.observacoes || '-'}
                          </p>
                        </div>

                        {itensVenda.length > 0 && (
                          <div className="space-y-2">
                            {itensVenda.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700"
                              >
                                <span className="font-semibold text-slate-900">
                                  {getNomeProduto(item.produto_id)}
                                </span>{' '}
                                • {getNomeArtesao(item.artesao_id)} • Qtde: {item.quantidade} • Unitário: {formatarMoeda(item.preco_unitario)} • Subtotal: {formatarMoeda(item.subtotal)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhuma venda registrada.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}