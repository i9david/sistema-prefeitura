import { redirect } from 'next/navigation'
import { Plus, UserCheck, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuleCard, ModuleMetricCard } from '@/components/module/module-card'
import { ModuleGrid } from '@/components/module/module-grid'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuloTurismoNav } from '@/components/modulo-turismo-nav'
import { criarVisitanteTurismo } from './actions'
import { cache } from 'react'

export const revalidate = 300 // Revalidar cache a cada 5 minutos
const PAGE_SIZE = 20

function formatarData(data: string | null) {
  if (!data) return '-'
  const p = data.split('-')
  return `${p[2]}/${p[1]}/${p[0]}`
}

const carregarVisitantes = cache(async (cidade: string, ponto: string, page: number = 1) => {
  const supabase = await createClient()
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('turismo_visitantes')
    .select('id, nome, cidade_origem, ponto_visitado, data_visita, telefone, observacoes', { count: 'exact' })
    .order('data_visita', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (cidade) {
    query = query.ilike('cidade_origem', `%${cidade}%`)
  }

  if (ponto) {
    query = query.ilike('ponto_visitado', `%${ponto}%`)
  }

  const { data, error, count } = await query
  if (error) throw error

  return {
    data: data || [],
    total: count || 0,
    totalPages: Math.ceil((count || 0) / PAGE_SIZE)
  }
})

const carregarMetricasVisitantes = cache(async () => {
  const supabase = await createClient()

  const hoje = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  const { data: totalData, error: totalError } = await supabase
    .from('turismo_visitantes')
    .select('id', { count: 'exact', head: true })

  const { data: hojeData, error: hojeError } = await supabase
    .from('turismo_visitantes')
    .select('id', { count: 'exact', head: true })
    .eq('data_visita', hoje)

  if (totalError || hojeError) throw totalError || hojeError

  return {
    total: totalData?.length || 0,
    hoje: hojeData?.length || 0
  }
})

export default async function Page({ searchParams }: any) {
  const params = await searchParams
  const modoNovo = params.novo === '1'
  const cidade = params.cidade || ''
  const ponto = params.ponto || ''
  const page = parseInt(params.page || '1', 10)

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [visitantesResult, metricas] = await Promise.all([
    carregarVisitantes(cidade, ponto, page),
    carregarMetricasVisitantes()
  ])

  const { data: visitantes, total, totalPages } = visitantesResult

  // Construir URL para navegação preservando filtros
  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams()
    if (cidade) params.set('cidade', cidade)
    if (ponto) params.set('ponto', ponto)
    params.set('page', String(p))
    return `/turismo/visitantes?${params.toString()}`
  }

  return (
    <ModuleLayout sidebar={<ModuloTurismoNav currentPath="/turismo/visitantes" />}>
      <ModuleHeader
        title="Visitantes"
        description="Registro de visitantes, cidade de origem e pontos turísticos visitados."
        eyebrow="Público"
        icon={Users}
        accent="emerald"
        action={
          !modoNovo && (
            <a
              href="/turismo/visitantes?novo=1"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Plus size={16} aria-hidden="true" />
              Novo visitante
            </a>
          )
        }
      />

      {modoNovo && (
        <ModuleCard>
          <h2 className="text-xl font-bold text-slate-950">Novo visitante</h2>
          <form action={criarVisitanteTurismo} className="mt-5 grid gap-3">
            <input name="nome" placeholder="Nome" required className="rounded-lg border border-slate-300 px-4 py-3" />
            <input name="telefone" placeholder="Telefone" className="rounded-lg border border-slate-300 px-4 py-3" />
            <input name="cidade_origem" placeholder="Cidade de origem" className="rounded-lg border border-slate-300 px-4 py-3" />
            <input name="ponto_visitado" placeholder="Ponto visitado" className="rounded-lg border border-slate-300 px-4 py-3" />
            <input type="date" name="data_visita" className="rounded-lg border border-slate-300 px-4 py-3" />
            <textarea name="observacoes" placeholder="Observações" className="min-h-24 rounded-lg border border-slate-300 px-4 py-3" />
            <button className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
              Salvar
            </button>
          </form>
        </ModuleCard>
      )}

      <ModuleGrid columns={2}>
        <ModuleMetricCard label="Total visitantes" value={metricas.total} icon={Users} accent="emerald" />
        <ModuleMetricCard label="Hoje" value={metricas.hoje} icon={UserCheck} accent="blue" />
      </ModuleGrid>

      <ModuleCard>
        <form className="grid gap-3 md:grid-cols-3">
          <input name="cidade" defaultValue={cidade} placeholder="Cidade" className="rounded-lg border border-slate-300 px-4 py-3" />
          <input name="ponto" defaultValue={ponto} placeholder="Ponto" className="rounded-lg border border-slate-300 px-4 py-3" />
          <button className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
            Filtrar
          </button>
        </form>
      </ModuleCard>

      <ModuleCard>
        <h2 className="text-xl font-bold text-slate-950">Lista de visitantes</h2>
        <div className="mt-5 space-y-3">
          {visitantes.map((v: any) => (
            <div key={v.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="font-bold text-slate-950">{v.nome}</h3>
                  <p className="text-sm text-slate-600">{v.cidade_origem || '-'}</p>
                  <p className="text-xs text-slate-500">{v.ponto_visitado || '-'}</p>
                </div>

                <div className="text-sm font-medium text-slate-600">
                  {formatarData(v.data_visita)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Paginação */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="text-sm text-slate-600">
            Mostrando {(page - 1) * PAGE_SIZE + 1} a {Math.min(page * PAGE_SIZE, total)} de {total} registros
          </div>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={buildPageUrl(page - 1)}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                <ChevronLeft size={16} />
                Anterior
              </a>
            )}
            {page < totalPages && (
              <a
                href={buildPageUrl(page + 1)}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                Próximo
                <ChevronRight size={16} />
              </a>
            )}
          </div>
        </div>
      </ModuleCard>
    </ModuleLayout>
  )
}
