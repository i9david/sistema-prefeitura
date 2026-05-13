import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BarChart3, Calendar, Music, Users } from 'lucide-react'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuleCard, ModuleMetricCard } from '@/components/module/module-card'
import { ModuleGrid } from '@/components/module/module-grid'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuloBandaMunicipalNav } from '@/components/modulo-banda-municipal-nav'

type Musico = {
  id: string
  status: string
}

type Instrumento = {
  id: string
  status: string
  estado_conservacao: string
}

type Ensaio = {
  id: string
  titulo: string
  data_ensaio: string
  horario_inicio: string
  local: string | null
  status: string
}

function formatarData(data: string | null | undefined) {
  if (!data) return '-'
  const partes = data.split('-')
  if (partes.length !== 3) return data
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function badgeClass(status: string) {
  switch (status) {
    case 'ativo':
    case 'disponivel':
    case 'realizado':
      return 'bg-green-100 text-green-700'
    case 'inativo':
    case 'baixado':
    case 'cancelado':
      return 'bg-red-100 text-red-700'
    case 'em_uso':
    case 'agendado':
      return 'bg-blue-100 text-blue-700'
    case 'manutencao':
      return 'bg-orange-100 text-orange-700'
    default:
      return 'bg-slate-200 text-slate-700'
  }
}

export default async function BandaMunicipalRelatoriosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: musicosData, error: erroMusicos },
    { data: instrumentosData, error: erroInstrumentos },
    { data: ensaiosData, error: erroEnsaios },
  ] = await Promise.all([
    supabase
      .from('banda_municipal_musicos')
      .select('id, status'),

    supabase
      .from('banda_municipal_instrumentos')
      .select('id, status, estado_conservacao'),

    supabase
      .from('banda_municipal_ensaios')
      .select('id, titulo, data_ensaio, horario_inicio, local, status')
      .order('data_ensaio', { ascending: false })
      .order('horario_inicio', { ascending: false }),
  ])

  if (erroMusicos) {
    redirect(`/banda-municipal/relatorios?message=${encodeURIComponent(erroMusicos.message)}`)
  }

  if (erroInstrumentos) {
    redirect(`/banda-municipal/relatorios?message=${encodeURIComponent(erroInstrumentos.message)}`)
  }

  if (erroEnsaios) {
    redirect(`/banda-municipal/relatorios?message=${encodeURIComponent(erroEnsaios.message)}`)
  }

  const musicos = (musicosData ?? []) as Musico[]
  const instrumentos = (instrumentosData ?? []) as Instrumento[]
  const ensaios = (ensaiosData ?? []) as Ensaio[]

  const hoje = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  const totalMusicos = musicos.length
  const musicosAtivos = musicos.filter((item) => item.status === 'ativo').length
  const musicosInativos = musicos.filter((item) => item.status === 'inativo').length

  const totalInstrumentos = instrumentos.length
  const instrumentosDisponiveis = instrumentos.filter((item) => item.status === 'disponivel').length
  const instrumentosEmUso = instrumentos.filter((item) => item.status === 'em_uso').length
  const instrumentosManutencao = instrumentos.filter((item) => item.status === 'manutencao').length
  const instrumentosBaixados = instrumentos.filter((item) => item.status === 'baixado').length

  const instrumentosOtimos = instrumentos.filter((item) => item.estado_conservacao === 'otimo').length
  const instrumentosBons = instrumentos.filter((item) => item.estado_conservacao === 'bom').length
  const instrumentosRegulares = instrumentos.filter((item) => item.estado_conservacao === 'regular').length
  const instrumentosComProblema = instrumentos.filter(
    (item) => item.estado_conservacao === 'manutencao' || item.estado_conservacao === 'inservivel'
  ).length

  const totalEnsaios = ensaios.length
  const ensaiosAgendados = ensaios.filter((item) => item.status === 'agendado').length
  const ensaiosRealizados = ensaios.filter((item) => item.status === 'realizado').length
  const ensaiosCancelados = ensaios.filter((item) => item.status === 'cancelado').length

  const proximosEnsaios = ensaios
    .filter((item) => item.data_ensaio >= hoje)
    .sort((a, b) => {
      const aKey = `${a.data_ensaio} ${a.horario_inicio}`
      const bKey = `${b.data_ensaio} ${b.horario_inicio}`
      return aKey.localeCompare(bKey)
    })
    .slice(0, 5)

  const ultimosEnsaios = ensaios
    .filter((item) => item.data_ensaio <= hoje)
    .sort((a, b) => {
      const aKey = `${a.data_ensaio} ${a.horario_inicio}`
      const bKey = `${b.data_ensaio} ${b.horario_inicio}`
      return bKey.localeCompare(aKey)
    })
    .slice(0, 5)

  return (
    <ModuleLayout sidebar={<ModuloBandaMunicipalNav currentPath="/banda-municipal/relatorios" />}>
      <ModuleHeader
        title="Relatórios da Banda Municipal"
        eyebrow="Relatórios"
        description="Indicadores consolidados de músicos, instrumentos e agenda da Banda Municipal."
        icon={BarChart3}
        accent="violet"
        context="Gestão musical"
        action={
          <Link href="/banda-municipal" className="btn-secondary w-full justify-center md:w-auto">
            Voltar ao módulo
          </Link>
        }
      />

      <ModuleGrid columns={3}>
        <ModuleMetricCard
          label="Total de músicos"
          value={totalMusicos}
          description={`Ativos: ${musicosAtivos} | Inativos: ${musicosInativos}`}
          icon={Users}
          accent="violet"
        />
        <ModuleMetricCard
          label="Total de instrumentos"
          value={totalInstrumentos}
          description={`Disponíveis: ${instrumentosDisponiveis} | Em uso: ${instrumentosEmUso}`}
          icon={Music}
          accent="blue"
        />
        <ModuleMetricCard
          label="Total de ensaios"
          value={totalEnsaios}
          description={`Agendados: ${ensaiosAgendados} | Realizados: ${ensaiosRealizados}`}
          icon={Calendar}
          accent="emerald"
        />
      </ModuleGrid>

      <div className="grid gap-6 xl:grid-cols-2">
        <ModuleCard>
          <h2 className="text-lg font-bold tracking-tight text-slate-950">
            Situação dos instrumentos
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Disponíveis</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{instrumentosDisponiveis}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Em uso</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{instrumentosEmUso}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Manutenção</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{instrumentosManutencao}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Baixados</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{instrumentosBaixados}</p>
            </div>
          </div>
        </ModuleCard>

        <ModuleCard>
          <h2 className="text-lg font-bold tracking-tight text-slate-950">
            Conservação dos instrumentos
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Ótimo</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{instrumentosOtimos}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Bom</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{instrumentosBons}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Regular</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{instrumentosRegulares}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Com problema</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{instrumentosComProblema}</p>
            </div>
          </div>
        </ModuleCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ModuleCard>
          <h2 className="text-lg font-bold tracking-tight text-slate-950">
            Próximos ensaios
          </h2>

          {proximosEnsaios.length > 0 ? (
            <div className="mt-5 space-y-3">
              {proximosEnsaios.map((ensaio) => (
                <div key={ensaio.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{ensaio.titulo}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {formatarData(ensaio.data_ensaio)} | {ensaio.horario_inicio}
                      </p>
                      <p className="text-sm text-slate-600">Local: {ensaio.local || '-'}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(ensaio.status)}`}>
                      {ensaio.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">Nenhum ensaio futuro encontrado.</p>
          )}
        </ModuleCard>

        <ModuleCard>
          <h2 className="text-lg font-bold tracking-tight text-slate-950">
            Últimos ensaios
          </h2>

          {ultimosEnsaios.length > 0 ? (
            <div className="mt-5 space-y-3">
              {ultimosEnsaios.map((ensaio) => (
                <div key={ensaio.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{ensaio.titulo}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {formatarData(ensaio.data_ensaio)} | {ensaio.horario_inicio}
                      </p>
                      <p className="text-sm text-slate-600">Local: {ensaio.local || '-'}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(ensaio.status)}`}>
                      {ensaio.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">Nenhum ensaio registrado.</p>
          )}
        </ModuleCard>
      </div>

      <ModuleCard>
        <h2 className="text-lg font-bold tracking-tight text-slate-950">
          Situação dos ensaios
        </h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Agendados</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{ensaiosAgendados}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Realizados</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{ensaiosRealizados}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Cancelados</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{ensaiosCancelados}</p>
          </div>
        </div>
      </ModuleCard>
    </ModuleLayout>
  )
}
