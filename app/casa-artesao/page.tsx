import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModuloCasaArtesaoNav } from '@/components/modulo-casa-artesao-nav'

type Venda = {
  id: string
  data_venda: string
  valor_total: number | null
  created_at: string
}

type Produto = {
  id: string
  nome: string
  quantidade: number | null
  artesao_id: string
  status: string | null
}

type Artesao = {
  id: string
  nome: string
  status: string
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function moduloCardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5'
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

function hojeBrasil() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function inicioMesAtual() {
  const hoje = new Date()
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).format(hoje) + '-01'
}

export default async function CasaArtesaoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const hoje = hojeBrasil()
  const inicioMes = inicioMesAtual()

  const [
    { data: vendasHojeData, error: vendasHojeError },
    { data: vendasMesData, error: vendasMesError },
    { data: itensHojeData, error: itensHojeError },
    { data: itensMesData, error: itensMesError },
    { data: produtosData, error: produtosError },
    { data: artesaosData, error: artesaosError },
  ] = await Promise.all([
    supabase
      .from('casa_artesao_vendas')
      .select('id, data_venda, valor_total, created_at')
      .eq('data_venda', hoje)
      .order('created_at', { ascending: false }),

    supabase
      .from('casa_artesao_vendas')
      .select('id, data_venda, valor_total, created_at')
      .gte('data_venda', inicioMes)
      .lte('data_venda', hoje)
      .order('created_at', { ascending: false }),

    supabase
      .from('casa_artesao_venda_itens')
      .select(`
        id,
        venda_id,
        artesao_id,
        quantidade,
        subtotal,
        comissao_valor,
        valor_repasse,
        created_at,
        casa_artesao_vendas!inner (
          data_venda
        )
      `)
      .eq('casa_artesao_vendas.data_venda', hoje),

    supabase
      .from('casa_artesao_venda_itens')
      .select(`
        id,
        venda_id,
        artesao_id,
        quantidade,
        subtotal,
        comissao_valor,
        valor_repasse,
        created_at,
        casa_artesao_vendas!inner (
          data_venda
        )
      `)
      .gte('casa_artesao_vendas.data_venda', inicioMes)
      .lte('casa_artesao_vendas.data_venda', hoje),

    supabase
      .from('casa_artesao_produtos')
      .select('id, nome, quantidade, artesao_id, status')
      .order('nome', { ascending: true }),

    supabase
      .from('casa_artesao_artesaos')
      .select('id, nome, status')
      .order('nome', { ascending: true }),
  ])

  if (vendasHojeError) {
    redirect(`/casa-artesao?message=${encodeURIComponent(vendasHojeError.message)}`)
  }

  if (vendasMesError) {
    redirect(`/casa-artesao?message=${encodeURIComponent(vendasMesError.message)}`)
  }

  if (itensHojeError) {
    redirect(`/casa-artesao?message=${encodeURIComponent(itensHojeError.message)}`)
  }

  if (itensMesError) {
    redirect(`/casa-artesao?message=${encodeURIComponent(itensMesError.message)}`)
  }

  if (produtosError) {
    redirect(`/casa-artesao?message=${encodeURIComponent(produtosError.message)}`)
  }

  if (artesaosError) {
    redirect(`/casa-artesao?message=${encodeURIComponent(artesaosError.message)}`)
  }

  const vendasHoje = (vendasHojeData ?? []) as Venda[]
  const vendasMes = (vendasMesData ?? []) as Venda[]
  const itensHoje = (itensHojeData ?? []) as any[]
  const itensMes = (itensMesData ?? []) as any[]
  const produtos = (produtosData ?? []) as Produto[]
  const artesaos = (artesaosData ?? []) as Artesao[]

  const valorVendidoHoje = vendasHoje.reduce(
    (acc, venda) => acc + Number(venda.valor_total ?? 0),
    0
  )

  const valorEmCaixaMes = vendasMes.reduce(
    (acc, venda) => acc + Number(venda.valor_total ?? 0),
    0
  )

  const itensVendidosHoje = itensHoje.reduce(
    (acc, item) => acc + Number(item.quantidade ?? 0),
    0
  )

  const valorSecretariaHoje = itensHoje.reduce(
    (acc, item) => acc + Number(item.comissao_valor ?? 0),
    0
  )

  const valorArtesaosHoje = itensHoje.reduce(
    (acc, item) => acc + Number(item.valor_repasse ?? 0),
    0
  )

  const valorSecretariaMes = itensMes.reduce(
    (acc, item) => acc + Number(item.comissao_valor ?? 0),
    0
  )

  const valorArtesaosMes = itensMes.reduce(
    (acc, item) => acc + Number(item.valor_repasse ?? 0),
    0
  )

  const produtosZerados = produtos.filter(
    (produto) => Number(produto.quantidade ?? 0) <= 0 && produto.status !== 'inativo'
  )

  const artesaosComVendaNoMes = new Set(
    itensMes.map((item) => item.artesao_id).filter(Boolean)
  ).size

  const ultimasVendas = vendasMes.slice(0, 8)

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCasaArtesaoNav currentPath="/casa-artesao" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Casa do Artesão
            </h1>
            <p className="mt-3 text-slate-600">
              Gestão de artesãos, produtos, estoque, caixa, relatórios, fechamentos e comissão da secretaria.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Vendido hoje</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {formatarMoeda(valorVendidoHoje)}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Vendas do dia</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {vendasHoje.length}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Itens vendidos hoje</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {itensVendidosHoje}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Caixa no mês</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {formatarMoeda(valorEmCaixaMes)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Secretaria hoje</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {formatarMoeda(valorSecretariaHoje)}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Artesãos hoje</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {formatarMoeda(valorArtesaosHoje)}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Secretaria no mês</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {formatarMoeda(valorSecretariaMes)}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Artesãos no mês</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {formatarMoeda(valorArtesaosMes)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Produtos cadastrados</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {produtos.length}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Produtos zerados</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {produtosZerados.length}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Artesãos ativos</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {artesaos.filter((artesao) => artesao.status === 'ativo').length}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Artesãos com venda no mês</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {artesaosComVendaNoMes}
              </p>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-slate-900">
              Áreas do módulo
            </h2>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <a href="/casa-artesao/artesaos" className={moduloCardClassName()}>
                <h3 className="text-lg font-bold text-slate-900">Artesãos</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Cadastro dos artesãos com chave Pix, telefone e situação cadastral.
                </p>
              </a>

              <a href="/casa-artesao/produtos" className={moduloCardClassName()}>
                <h3 className="text-lg font-bold text-slate-900">Produtos</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Cadastro de produtos, preços e vínculo com os artesãos.
                </p>
              </a>

              <a href="/casa-artesao/estoque" className={moduloCardClassName()}>
                <h3 className="text-lg font-bold text-slate-900">Estoque</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Controle de quantidades, alertas de estoque zerado e posição atual.
                </p>
              </a>

              <a href="/casa-artesao/caixa" className={moduloCardClassName()}>
                <h3 className="text-lg font-bold text-slate-900">Caixa</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Venda com baixa automática no estoque e cadastro do comprador.
                </p>
              </a>

              <a href="/casa-artesao/relatorios" className={moduloCardClassName()}>
                <h3 className="text-lg font-bold text-slate-900">Relatórios</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Comissão, repasse e conferência financeira por artesão.
                </p>
              </a>

              <a href="/casa-artesao/fechamentos" className={moduloCardClassName()}>
                <h3 className="text-lg font-bold text-slate-900">Fechamentos</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Controle mensal de aberto, fechado e pago.
                </p>
              </a>

              <a href="/casa-artesao/configuracoes" className={moduloCardClassName()}>
                <h3 className="text-lg font-bold text-slate-900">Configurações</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Defina a comissão da secretaria e a lógica de separação dos valores.
                </p>
              </a>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className={cardClassName()}>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Últimas vendas
              </h2>

              {ultimasVendas.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {ultimasVendas.map((venda) => (
                    <div
                      key={venda.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="font-semibold text-slate-900">
                        Venda em {formatarData(venda.data_venda)}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Total: {formatarMoeda(venda.valor_total)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-600">
                  Nenhuma venda registrada no período.
                </p>
              )}
            </div>

            <div className={cardClassName()}>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Produtos com estoque zerado
              </h2>

              {produtosZerados.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {produtosZerados.slice(0, 10).map((produto) => (
                    <div
                      key={produto.id}
                      className="rounded-2xl border border-red-200 bg-red-50 p-4"
                    >
                      <p className="font-semibold text-slate-900">
                        {produto.nome}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Quantidade atual: {produto.quantidade ?? 0}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-600">
                  Nenhum produto zerado no momento.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}