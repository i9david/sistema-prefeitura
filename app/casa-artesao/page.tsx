import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react'
import {
  ModuleAreaCard,
  ModuleCard,
  ModuleMetricCard,
} from '@/components/module/module-card'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuleGrid, ModuleSectionGrid } from '@/components/module/module-grid'
import { ModuloCasaArtesaoNav } from '@/components/modulo-casa-artesao-nav'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { getTenantPath } from '@/lib/tenant-paths-server'

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

  if (vendasHojeError) redirect(`/casa-artesao?message=${encodeURIComponent(vendasHojeError.message)}`)
  if (vendasMesError) redirect(`/casa-artesao?message=${encodeURIComponent(vendasMesError.message)}`)
  if (itensHojeError) redirect(`/casa-artesao?message=${encodeURIComponent(itensHojeError.message)}`)
  if (itensMesError) redirect(`/casa-artesao?message=${encodeURIComponent(itensMesError.message)}`)
  if (produtosError) redirect(`/casa-artesao?message=${encodeURIComponent(produtosError.message)}`)
  if (artesaosError) redirect(`/casa-artesao?message=${encodeURIComponent(artesaosError.message)}`)

  const vendasHoje = (vendasHojeData ?? []) as Venda[]
  const vendasMes = (vendasMesData ?? []) as Venda[]
  const itensHoje = (itensHojeData ?? []) as any[]
  const itensMes = (itensMesData ?? []) as any[]
  const produtos = (produtosData ?? []) as Produto[]
  const artesaos = (artesaosData ?? []) as Artesao[]

  const valorVendidoHoje = vendasHoje.reduce((acc, venda) => acc + Number(venda.valor_total ?? 0), 0)
  const valorEmCaixaMes = vendasMes.reduce((acc, venda) => acc + Number(venda.valor_total ?? 0), 0)
  const itensVendidosHoje = itensHoje.reduce((acc, item) => acc + Number(item.quantidade ?? 0), 0)
  const valorSecretariaHoje = itensHoje.reduce((acc, item) => acc + Number(item.comissao_valor ?? 0), 0)
  const valorArtesaosHoje = itensHoje.reduce((acc, item) => acc + Number(item.valor_repasse ?? 0), 0)
  const valorSecretariaMes = itensMes.reduce((acc, item) => acc + Number(item.comissao_valor ?? 0), 0)
  const valorArtesaosMes = itensMes.reduce((acc, item) => acc + Number(item.valor_repasse ?? 0), 0)
  const produtosZerados = produtos.filter((produto) => Number(produto.quantidade ?? 0) <= 0 && produto.status !== 'inativo')
  const artesaosComVendaNoMes = new Set(itensMes.map((item) => item.artesao_id).filter(Boolean)).size
  const ultimasVendas = vendasMes.slice(0, 8)

  return (
    <ModuleLayout sidebar={<ModuloCasaArtesaoNav currentPath="/casa-artesao" />}>
      <ModuleHeader
        title="Casa do Artesão"
        eyebrow="Gestão comercial"
        description="Gestão de artesãos, produtos, estoque, caixa, relatórios, fechamentos e comissão da secretaria."
        icon={LayoutDashboard}
        accent="amber"
        context="Vendas e estoque"
        action={
          <Link href={getTenantPath('/casa-artesao/caixa')} className="btn-primary w-full justify-center md:w-auto">
            <ShoppingCart size={16} aria-hidden="true" />
            Abrir caixa
          </Link>
        }
      />

      <ModuleGrid columns={4}>
        <ModuleMetricCard label="Vendido hoje" value={formatarMoeda(valorVendidoHoje)} icon={ShoppingCart} accent="amber" />
        <ModuleMetricCard label="Vendas do dia" value={vendasHoje.length} icon={ReceiptText} accent="amber" />
        <ModuleMetricCard label="Itens vendidos hoje" value={itensVendidosHoje} icon={Package} accent="amber" />
        <ModuleMetricCard label="Caixa no mês" value={formatarMoeda(valorEmCaixaMes)} icon={BarChart3} accent="amber" />
        <ModuleMetricCard label="Secretaria hoje" value={formatarMoeda(valorSecretariaHoje)} icon={BarChart3} accent="amber" />
        <ModuleMetricCard label="Artesãos hoje" value={formatarMoeda(valorArtesaosHoje)} icon={Users} accent="amber" />
        <ModuleMetricCard label="Secretaria no mês" value={formatarMoeda(valorSecretariaMes)} icon={BarChart3} accent="amber" />
        <ModuleMetricCard label="Artesãos no mês" value={formatarMoeda(valorArtesaosMes)} icon={Users} accent="amber" />
        <ModuleMetricCard label="Produtos cadastrados" value={produtos.length} icon={Package} accent="amber" />
        <ModuleMetricCard label="Produtos zerados" value={produtosZerados.length} icon={Boxes} accent="amber" />
        <ModuleMetricCard label="Artesãos ativos" value={artesaos.filter((artesao) => artesao.status === 'ativo').length} icon={Users} accent="amber" />
        <ModuleMetricCard label="Artesãos com venda no mês" value={artesaosComVendaNoMes} icon={Users} accent="amber" />
      </ModuleGrid>

      <ModuleSectionGrid
        title="Áreas do módulo"
        description="Fluxos principais de venda, estoque, artesãos e prestação de contas."
        columns={3}
      >
        <ModuleAreaCard title="Artesãos" description="Cadastro dos artesãos com chave Pix, telefone e situação cadastral." href="/casa-artesao/artesaos" icon={Users} accent="amber" />
        <ModuleAreaCard title="Produtos" description="Cadastro de produtos, preços e vínculo com os artesãos." href="/casa-artesao/produtos" icon={Package} accent="amber" />
        <ModuleAreaCard title="Estoque" description="Controle de quantidades, alertas de estoque zerado e posição atual." href="/casa-artesao/estoque" icon={Boxes} accent="amber" />
        <ModuleAreaCard title="Caixa / Vendas" description="Venda com baixa automática no estoque e cadastro do comprador." href="/casa-artesao/caixa" icon={ShoppingCart} accent="amber" />
        <ModuleAreaCard title="Relatórios" description="Comissão, repasse e conferência financeira por artesão." href="/casa-artesao/relatorios" icon={BarChart3} accent="amber" />
        <ModuleAreaCard title="Fechamentos" description="Controle mensal de aberto, fechado e pago." href="/casa-artesao/fechamentos" icon={ReceiptText} accent="amber" />
        <ModuleAreaCard title="Configurações" description="Defina a comissão da secretaria e a separação dos valores." href="/casa-artesao/configuracoes" icon={Settings} accent="amber" />
      </ModuleSectionGrid>

      <div className="grid gap-6 xl:grid-cols-2">
        <ModuleCard>
          <h2 className="text-lg font-bold text-slate-950">Últimas vendas</h2>
          {ultimasVendas.length > 0 ? (
            <div className="mt-5 space-y-3">
              {ultimasVendas.map((venda) => (
                <div key={venda.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-950">Venda em {formatarData(venda.data_venda)}</p>
                  <p className="mt-1 text-sm text-slate-600">Total: {formatarMoeda(venda.valor_total)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">Nenhuma venda registrada no período.</p>
          )}
        </ModuleCard>

        <ModuleCard>
          <h2 className="text-lg font-bold text-slate-950">Produtos com estoque zerado</h2>
          {produtosZerados.length > 0 ? (
            <div className="mt-5 space-y-3">
              {produtosZerados.slice(0, 10).map((produto) => (
                <div key={produto.id} className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="font-semibold text-slate-950">{produto.nome}</p>
                  <p className="mt-1 text-sm text-slate-600">Quantidade atual: {produto.quantidade ?? 0}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">Nenhum produto zerado no momento.</p>
          )}
        </ModuleCard>
      </div>
    </ModuleLayout>
  )
}
