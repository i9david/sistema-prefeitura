import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Calendar, ClipboardCheck, Mic, Save } from 'lucide-react'
import { ModuleCard } from '@/components/module/module-card'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuleEmptyState, ModuleErrorState } from '@/components/module/module-state'
import { ModuleTable, type ModuleTableColumn } from '@/components/module/module-table'
import { ModuloBandaMunicipalNav } from '@/components/modulo-banda-municipal-nav'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { getTenantPath } from '@/lib/tenant-paths-server'
import { listarPresencasPorEvento, registrarPresencas } from './actions'

export const revalidate = 300 // Revalidar cache a cada 5 minutos

type TipoPresenca = 'ensaio' | 'apresentacao'

type Ensaio = {
  id: string
  titulo: string
  data_ensaio: string
  horario_inicio: string
  horario_fim: string | null
  local: string | null
  status: string
}

type Apresentacao = {
  id: string
  titulo: string
  data_apresentacao: string
  horario: string | null
  local: string | null
  evento: string | null
  status: string
}

type Musico = {
  id: string
  nome: string
  instrumento_principal: string
  status: string
}

type Presenca = {
  id: string
  musico_id: string
  status: string
  hora_registro: string
  observacao: string | null
  valor_unitario: number | null
  valor_total: number | null
  status_pagamento: string | null
}

function formatarData(data: string | null | undefined) {
  if (!data) return '-'
  const partes = data.split('-')
  if (partes.length !== 3) return data
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function formatarHora(valor: string | null | undefined) {
  if (!valor) return '-'

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(valor))
  } catch {
    return valor
  }
}

function formatarMoeda(valor: number | null | undefined) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor ?? 0))
}

function statusLabel(status: string) {
  switch (status) {
    case 'presente':
      return 'Presente'
    case 'falta':
      return 'Falta'
    case 'justificado':
      return 'Justificado'
    default:
      return 'Não marcado'
  }
}

function statusPagamentoLabel(status: string | null | undefined) {
  switch (status) {
    case 'calculado':
      return 'Calculado'
    case 'pago':
      return 'Pago'
    case 'cancelado':
      return 'Cancelado'
    default:
      return 'Pendente'
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'presente':
      return 'bg-emerald-100 text-emerald-700'
    case 'falta':
      return 'bg-red-100 text-red-700'
    case 'justificado':
      return 'bg-amber-100 text-amber-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

function getPresencaPorMusico(presencas: Presenca[], musicoId: string) {
  return presencas.find((presenca) => presenca.musico_id === musicoId)
}

function getDataEvento(tipo: TipoPresenca, evento: Ensaio | Apresentacao) {
  return tipo === 'ensaio'
    ? (evento as Ensaio).data_ensaio
    : (evento as Apresentacao).data_apresentacao
}

export default async function BandaPresencasPage({
  searchParams,
}: {
  searchParams: Promise<{
    tipo?: string
    ensaio_id?: string
    apresentacao_id?: string
    message?: string
  }>
}) {
  const params = await searchParams
  const tipo: TipoPresenca = params.tipo === 'apresentacao' ? 'apresentacao' : 'ensaio'
  const ensaioId = params.ensaio_id?.trim() || ''
  const apresentacaoId = params.apresentacao_id?.trim() || ''

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: musicosData, error: musicosError },
    { data: ensaiosData, error: ensaiosError },
    { data: apresentacoesData, error: apresentacoesError },
  ] = await Promise.all([
    supabase
      .from('banda_municipal_musicos')
      .select('id, nome, instrumento_principal, status')
      .eq('status', 'ativo')
      .order('nome', { ascending: true }),
    supabase
      .from('banda_municipal_ensaios')
      .select('id, titulo, data_ensaio, horario_inicio, horario_fim, local, status')
      .order('data_ensaio', { ascending: false })
      .limit(12),
    supabase
      .from('banda_municipal_apresentacoes')
      .select('id, titulo, data_apresentacao, horario, local, evento, status')
      .order('data_apresentacao', { ascending: false })
      .limit(12),
  ])

  if (musicosError) {
    redirect(`/banda-municipal/presencas?message=${encodeURIComponent(musicosError.message)}`)
  }

  if (ensaiosError) {
    redirect(`/banda-municipal/presencas?message=${encodeURIComponent(ensaiosError.message)}`)
  }

  if (apresentacoesError) {
    redirect(`/banda-municipal/presencas?message=${encodeURIComponent(apresentacoesError.message)}`)
  }

  const musicos = (musicosData ?? []) as Musico[]
  const ensaios = (ensaiosData ?? []) as Ensaio[]
  const apresentacoes = (apresentacoesData ?? []) as Apresentacao[]
  const eventoId = tipo === 'ensaio' ? ensaioId : apresentacaoId

  const eventoSelecionado =
    tipo === 'ensaio'
      ? ensaios.find((ensaio) => ensaio.id === ensaioId)
      : apresentacoes.find((apresentacao) => apresentacao.id === apresentacaoId)

  let presencas: Presenca[] = []

  if (eventoId && eventoSelecionado) {
    try {
      presencas = await listarPresencasPorEvento(tipo, eventoId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao listar presenças'
      redirect(`/banda-municipal/presencas?message=${encodeURIComponent(message)}`)
    }
  }

  const columns: ModuleTableColumn<Musico>[] = [
    {
      header: 'Músico',
      render: (musico) => (
        <span className="font-medium text-slate-950">{musico.nome}</span>
      ),
    },
    {
      header: 'Instrumento',
      render: (musico) => musico.instrumento_principal || '-',
    },
    {
      header: 'Status',
      render: (musico) => {
        const presenca = getPresencaPorMusico(presencas, musico.id)

        return (
          <select
            name={`status_${musico.id}`}
            defaultValue={presenca?.status ?? 'presente'}
          >
            <option value="presente">Presente</option>
            <option value="falta">Falta</option>
            <option value="justificado">Justificado</option>
          </select>
        )
      },
    },
    {
      header: 'Valor unitário',
      render: (musico) => {
        const presenca = getPresencaPorMusico(presencas, musico.id)

        return (
          <div>
            <input
              name={`valor_unitario_${musico.id}`}
              type="number"
              min="0"
              step="0.01"
              defaultValue={presenca?.valor_unitario ?? 0}
              className="w-32"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Total: {formatarMoeda(presenca?.valor_total)}
            </span>
          </div>
        )
      },
    },
    {
      header: 'Pagamento',
      render: (musico) => {
        const presenca = getPresencaPorMusico(presencas, musico.id)

        return (
          <div>
            <select
              name={`status_pagamento_${musico.id}`}
              defaultValue={presenca?.status_pagamento ?? 'pendente'}
            >
              <option value="pendente">Pendente</option>
              <option value="calculado">Calculado</option>
              <option value="pago">Pago</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <span className="mt-1 block text-xs text-slate-500">
              {statusPagamentoLabel(presenca?.status_pagamento)}
            </span>
          </div>
        )
      },
    },
    {
      header: 'Observação',
      render: (musico) => {
        const presenca = getPresencaPorMusico(presencas, musico.id)

        return (
          <input
            name={`observacao_${musico.id}`}
            defaultValue={presenca?.observacao ?? ''}
            placeholder="Observação"
          />
        )
      },
    },
    {
      header: 'Registro',
      render: (musico) => {
        const presenca = getPresencaPorMusico(presencas, musico.id)

        return (
          <div>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(presenca?.status ?? '')}`}>
              {statusLabel(presenca?.status ?? '')}
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              {formatarHora(presenca?.hora_registro)}
            </span>
          </div>
        )
      },
    },
  ]

  return (
    <ModuleLayout sidebar={<ModuloBandaMunicipalNav currentPath="/banda-municipal/presencas" />}>
      <ModuleHeader
        title="Presenças da Banda Municipal"
        eyebrow="Operação"
        description="Registre a participação dos músicos em ensaios e apresentações em uma base única, preparada para relatórios e cálculo futuro de pagamento por presença."
        icon={ClipboardCheck}
        accent="violet"
        context="Chamada e pagamento"
      />

      {params.message && (
        <ModuleErrorState
          title="Aviso do sistema"
          description={params.message}
        />
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <ModuleCard>
          <div className="mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-violet-700" aria-hidden="true" />
            <h2 className="text-lg font-bold text-slate-950">Ensaios</h2>
          </div>

          <div className="space-y-3">
            {ensaios.length > 0 ? (
              ensaios.map((ensaio) => (
                <Link
                  key={ensaio.id}
                  href={getTenantPath(`/banda-municipal/presencas?tipo=ensaio&ensaio_id=${ensaio.id}`)}
                  className={`block rounded-lg border p-4 transition hover:border-violet-200 hover:bg-violet-50 ${
                    ensaio.id === ensaioId ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <span className="block font-semibold text-slate-950">
                    {ensaio.titulo}
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">
                    {formatarData(ensaio.data_ensaio)} • {ensaio.horario_inicio}
                    {ensaio.horario_fim ? ` às ${ensaio.horario_fim}` : ''}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {ensaio.local || 'Local não informado'}
                  </span>
                </Link>
              ))
            ) : (
              <ModuleEmptyState title="Nenhum ensaio encontrado" />
            )}
          </div>
        </ModuleCard>

        <ModuleCard>
          <div className="mb-4 flex items-center gap-2">
            <Mic size={18} className="text-violet-700" aria-hidden="true" />
            <h2 className="text-lg font-bold text-slate-950">Apresentações</h2>
          </div>

          <div className="space-y-3">
            {apresentacoes.length > 0 ? (
              apresentacoes.map((apresentacao) => (
                <Link
                  key={apresentacao.id}
                  href={getTenantPath(`/banda-municipal/presencas?tipo=apresentacao&apresentacao_id=${apresentacao.id}`)}
                  className={`block rounded-lg border p-4 transition hover:border-violet-200 hover:bg-violet-50 ${
                    apresentacao.id === apresentacaoId ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <span className="block font-semibold text-slate-950">
                    {apresentacao.titulo}
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">
                    {formatarData(apresentacao.data_apresentacao)}
                    {apresentacao.horario ? ` • ${apresentacao.horario}` : ''}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {apresentacao.local || apresentacao.evento || 'Local não informado'}
                  </span>
                </Link>
              ))
            ) : (
              <ModuleEmptyState title="Nenhuma apresentação encontrada" />
            )}
          </div>
        </ModuleCard>
      </div>

      {eventoId && !eventoSelecionado && (
        <ModuleErrorState
          title="Evento não encontrado"
          description="Abra a chamada pela lista de ensaios ou apresentações recentes."
        />
      )}

      {eventoSelecionado && (
        <ModuleCard>
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">
                Chamada de {tipo === 'ensaio' ? 'ensaio' : 'apresentação'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {eventoSelecionado.titulo} • {formatarData(getDataEvento(tipo, eventoSelecionado))}
              </p>
            </div>

            <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
              {musicos.length} músicos ativos
            </span>
          </div>

          {musicos.length > 0 ? (
            <form action={registrarPresencas} className="space-y-5">
              <input type="hidden" name="tipo" value={tipo} />
              <input type="hidden" name="ensaio_id" value={ensaioId} />
              <input type="hidden" name="apresentacao_id" value={apresentacaoId} />

              <ModuleTable
                data={musicos}
                columns={columns}
                getRowKey={(musico) => musico.id}
                emptyTitle="Nenhum músico ativo encontrado"
              />

              <button type="submit" className="btn-primary justify-center">
                <Save size={16} aria-hidden="true" />
                Salvar chamada
              </button>
            </form>
          ) : (
            <ModuleEmptyState title="Nenhum músico ativo encontrado" />
          )}
        </ModuleCard>
      )}
    </ModuleLayout>
  )
}
