import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react'
import {
  ModuleAreaCard,
  ModuleMetricCard,
} from '@/components/module/module-card'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuleGrid, ModuleSectionGrid } from '@/components/module/module-grid'
import { ModuloTurismoNav } from '@/components/modulo-turismo-nav'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { getTenantPath } from '@/lib/tenant-paths-server'

type Indicador = {
  label: string
  valor: number
  descricao: string
  icon: LucideIcon
}

type AreaModulo = {
  titulo: string
  descricao: string
  href: string
  icon: LucideIcon
}

type GrupoArea = {
  titulo: string
  descricao: string
  areas: AreaModulo[]
}

export default async function TurismoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: pontosData },
    { data: demandasData },
    { data: visitantesData },
  ] = await Promise.all([
    supabase.from('turismo_pontos').select('id, status'),
    supabase.from('turismo_demandas').select('id, status'),
    supabase.from('turismo_visitantes').select('id, data_visita'),
  ])

  const pontos = pontosData ?? []
  const demandas = demandasData ?? []
  const visitantes = visitantesData ?? []

  const pontosAtivos = pontos.filter((item) => item.status === 'ativo').length
  const demandasPendentes = demandas.filter((item) => item.status === 'pendente').length
  const demandasConcluidas = demandas.filter((item) => item.status === 'concluida').length

  const hoje = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  const visitantesHoje = visitantes.filter((item) => item.data_visita === hoje).length

  const indicadores: Indicador[] = [
    {
      label: 'Pontos cadastrados',
      valor: pontos.length,
      descricao: `${pontosAtivos} ativos`,
      icon: MapPin,
    },
    {
      label: 'Demandas pendentes',
      valor: demandasPendentes,
      descricao: `${demandasConcluidas} concluídas`,
      icon: ClipboardList,
    },
    {
      label: 'Visitantes hoje',
      valor: visitantesHoje,
      descricao: `${visitantes.length} registros totais`,
      icon: Users,
    },
    {
      label: 'Total de demandas',
      valor: demandas.length,
      descricao: 'Acompanhamento operacional',
      icon: TrendingUp,
    },
  ]

  const grupos: GrupoArea[] = [
    {
      titulo: 'Cadastros',
      descricao: 'Base territorial e turística do município.',
      areas: [
        {
          titulo: 'Pontos turísticos',
          descricao: 'Cadastre atrativos, localização, contatos e situação atual.',
          href: '/turismo/pontos',
          icon: MapPin,
        },
      ],
    },
    {
      titulo: 'Operação',
      descricao: 'Rotina de atendimento, demandas e visitação.',
      areas: [
        {
          titulo: 'Demandas',
          descricao: 'Controle melhorias, sinalização, acesso, limpeza e estrutura.',
          href: '/turismo/demandas',
          icon: ClipboardList,
        },
      ],
    },
    {
      titulo: 'Público',
      descricao: 'Acompanhamento do fluxo de visitantes.',
      areas: [
        {
          titulo: 'Visitantes',
          descricao: 'Registre visitantes, origem, pontos visitados e perfil do fluxo.',
          href: '/turismo/visitantes',
          icon: Users,
        },
      ],
    },
    {
      titulo: 'Relatórios',
      descricao: 'Indicadores para gestão pública e tomada de decisão.',
      areas: [
        {
          titulo: 'Dashboard',
          descricao: 'Acompanhe os principais indicadores do turismo municipal.',
          href: '/turismo/dashboard',
          icon: BarChart3,
        },
        {
          titulo: 'Relatórios',
          descricao: 'Analise demandas, visitação e desempenho dos atrativos.',
          href: '/turismo/relatorios',
          icon: BarChart3,
        },
      ],
    },
  ]

  return (
    <ModuleLayout sidebar={<ModuloTurismoNav currentPath="/turismo" />}>
      <ModuleHeader
        title="Turismo"
        eyebrow="Gestão turística"
        description="Organize pontos turísticos, demandas operacionais, visitantes e relatórios em uma visão única para apoiar o desenvolvimento turístico de Mineiros."
        icon={LayoutDashboard}
        accent="emerald"
        context="Desenvolvimento turístico"
        action={
          <Link
            href={getTenantPath('/turismo/dashboard')}
            className="btn-primary w-full justify-center md:w-auto"
          >
            <BarChart3 size={16} aria-hidden="true" />
            Abrir dashboard
          </Link>
        }
      />

      <ModuleGrid columns={4}>
        {indicadores.map((indicador) => (
          <ModuleMetricCard
            key={indicador.label}
            label={indicador.label}
            value={indicador.valor}
            description={indicador.descricao}
            icon={indicador.icon}
            accent="emerald"
          />
        ))}
      </ModuleGrid>

      {grupos.map((grupo) => (
        <ModuleSectionGrid
          key={grupo.titulo}
          title={grupo.titulo}
          description={grupo.descricao}
          columns={3}
        >
          {grupo.areas.map((area) => (
            <ModuleAreaCard
              key={area.href}
              title={area.titulo}
              description={area.descricao}
              href={area.href}
              icon={area.icon}
              accent="emerald"
            />
          ))}
        </ModuleSectionGrid>
      ))}
    </ModuleLayout>
  )
}
