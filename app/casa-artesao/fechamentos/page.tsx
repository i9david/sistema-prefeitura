import { redirect } from 'next/navigation'
import { CheckCircle2, CircleDollarSign, FileCheck2, WalletCards } from 'lucide-react'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuloCasaArtesaoNav } from '@/components/modulo-casa-artesao-nav'
import { ModuleCard, ModuleMetricCard } from '@/components/module/module-card'
import { ModuleGrid } from '@/components/module/module-grid'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import {
  gerarFechamentoMensal,
  marcarFechamentoComoPago,
  reabrirFechamento,
} from './actions'

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
  data_inicio: string
  data_fim: string
  total_bruto: number | null
  total_comissao: number | null
  total_repasse: number | null
  status: string
  observacoes: string | null
  created_at: string
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

export default async function CasaArtesaoFechamentosPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    status?: string
    artesao_id?: string
  }>
}) {
  const params = await searchParams
  const statusFiltro = params.status?.trim() || ''
  const artesaoFiltro = params.artesao_id?.trim() || ''

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let fechamentosQuery = supabase
    .from('casa_artesao_fechamentos')
    .select('*')
    .order('created_at', { ascending: false })

  if (statusFiltro) {
    fechamentosQuery = fechamentosQuery.eq('status', statusFiltro)
  }

  if (artesaoFiltro) {
    fechamentosQuery = fechamentosQuery.eq('artesao_id', artesaoFiltro)
  }

  const [
    { data: fechamentosData, error: fechamentosError },
    { data: artesaosData, error: artesaosError },
  ] = await Promise.all([
    fechamentosQuery,
    supabase
      .from('casa_artesao_artesaos')
      .select('id, nome, telefone, chave_pix, tipo_chave_pix, status')
      .order('nome', { ascending: true }),
  ])

  if (fechamentosError) {
    redirect(`/casa-artesao/fechamentos?message=${encodeURIComponent(fechamentosError.message)}`)
  }

  if (artesaosError) {
    redirect(`/casa-artesao/fechamentos?message=${encodeURIComponent(artesaosError.message)}`)
  }

  const fechamentos = (fechamentosData ?? []) as Fechamento[]
  const artesaos = (artesaosData ?? []) as Artesao[]

  function getArtesao(artesaoId: string) {
    return artesaos.find((artesao) => artesao.id === artesaoId) || null
  }

  const totalFechamentos = fechamentos.length
  const totalAbertos = fechamentos.filter((item) => item.status === 'aberto').length
  const totalFechados = fechamentos.filter((item) => item.status === 'fechado').length
  const totalPagos = fechamentos.filter((item) => item.status === 'pago').length

  return (
    <ModuleLayout sidebar={<ModuloCasaArtesaoNav currentPath="/casa-artesao/fechamentos" />}>
      <ModuleHeader
        title="Fechamentos"
        description="Gere o fechamento mensal por artesão e acompanhe o status de pagamento."
        eyebrow="Gestão"
        icon={WalletCards}
        accent="amber"
      />

          <ModuleGrid columns={4}>
            <ModuleMetricCard
              label="Total de fechamentos"
              value={totalFechamentos}
              icon={FileCheck2}
              accent="amber"
            />
            <ModuleMetricCard
              label="Abertos"
              value={totalAbertos}
              icon={WalletCards}
              accent="blue"
            />
            <ModuleMetricCard
              label="Fechados"
              value={totalFechados}
              icon={CheckCircle2}
              accent="violet"
            />
            <ModuleMetricCard
              label="Pagos"
              value={totalPagos}
              icon={CircleDollarSign}
              accent="emerald"
            />
          </ModuleGrid>

          <ModuleCard>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Gerar fechamento mensal
            </h2>

            <form action={gerarFechamentoMensal} className="mt-6 grid gap-4">
              <select
                name="artesao_id"
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              >
                <option value="">Selecione o artesão</option>
                {artesaos
                  .filter((artesao) => artesao.status === 'ativo')
                  .map((artesao) => (
                    <option key={artesao.id} value={artesao.id}>
                      {artesao.nome}
                    </option>
                  ))}
              </select>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="date"
                  name="data_inicio"
                  defaultValue={inicioMesAtual()}
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <input
                  type="date"
                  name="data_fim"
                  defaultValue={hojeBrasil()}
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </div>

              <textarea
                name="observacoes"
                placeholder="Observações do fechamento"
                className="min-h-[110px] w-full rounded-2xl border border-slate-300 px-4 py-3"
              />

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
                  Gerar fechamento
                </button>
              </div>
            </form>
          </ModuleCard>

          <ModuleCard>
            <form method="get" className="grid gap-4 md:grid-cols-3">
              <select
                name="artesao_id"
                defaultValue={artesaoFiltro}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Todos os artesãos</option>
                {artesaos.map((artesao) => (
                  <option key={artesao.id} value={artesao.id}>
                    {artesao.nome}
                  </option>
                ))}
              </select>

              <select
                name="status"
                defaultValue={statusFiltro}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Todos os status</option>
                <option value="aberto">Aberto</option>
                <option value="fechado">Fechado</option>
                <option value="pago">Pago</option>
              </select>

              <button
                type="submit"
                className="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
              >
                Filtrar
              </button>
            </form>
          </ModuleCard>

          <ModuleCard>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Histórico de fechamentos
            </h2>

            {fechamentos.length > 0 ? (
              <div className="mt-6 space-y-4">
                {fechamentos.map((fechamento) => {
                  const artesao = getArtesao(fechamento.artesao_id)

                  return (
                    <div
                      key={fechamento.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">
                              {artesao?.nome || 'Artesão'}
                            </h3>
                            <p className="text-sm text-slate-600">
                              Competência: {fechamento.competencia}
                            </p>
                            <p className="text-sm text-slate-600">
                              Período: {formatarData(fechamento.data_inicio)} até {formatarData(fechamento.data_fim)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                fechamento.status === 'pago'
                                  ? 'bg-green-100 text-green-700'
                                  : fechamento.status === 'fechado'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {fechamento.status}
                            </span>
                          </div>

                          <div className="text-sm text-slate-700">
                            <p>
                              <span className="font-semibold">Total bruto:</span>{' '}
                              {formatarMoeda(fechamento.total_bruto)}
                            </p>
                            <p>
                              <span className="font-semibold">Total comissão:</span>{' '}
                              {formatarMoeda(fechamento.total_comissao)}
                            </p>
                            <p>
                              <span className="font-semibold">Total repasse:</span>{' '}
                              {formatarMoeda(fechamento.total_repasse)}
                            </p>
                            <p>
                              <span className="font-semibold">Pix:</span>{' '}
                              {artesao?.chave_pix || '-'} {artesao?.tipo_chave_pix ? ` ${artesao.tipo_chave_pix}` : ''}
                            </p>
                            <p>
                              <span className="font-semibold">Observações:</span>{' '}
                              {fechamento.observacoes || '-'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {fechamento.status !== 'pago' && (
                            <form action={marcarFechamentoComoPago}>
                              <input type="hidden" name="id" value={fechamento.id} />
                              <button
                                type="submit"
                                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                              >
                                Marcar como pago
                              </button>
                            </form>
                          )}

                          {fechamento.status === 'pago' && (
                            <form action={reabrirFechamento}>
                              <input type="hidden" name="id" value={fechamento.id} />
                              <button
                                type="submit"
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                Reabrir
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhum fechamento encontrado.
              </p>
            )}
          </ModuleCard>
    </ModuleLayout>
  )
}
