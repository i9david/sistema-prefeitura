import Link from 'next/link'
import {
  BarChart3,
  Calendar,
  ClipboardCheck,
  LayoutDashboard,
  Mic,
  Music,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { ModuleAreaCard } from '@/components/module/module-card'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuleSectionGrid } from '@/components/module/module-grid'
import { ModuloBandaMunicipalNav } from '@/components/modulo-banda-municipal-nav'
import { getTenantPath } from '@/lib/tenant-paths-server'

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

const grupos: GrupoArea[] = [
  {
    titulo: 'Cadastros',
    descricao: 'Base administrativa da Banda Municipal.',
    areas: [
      {
        titulo: 'Músicos',
        descricao: 'Cadastro e acompanhamento dos integrantes da banda.',
        href: '/banda-municipal/musicos',
        icon: Users,
      },
      {
        titulo: 'Instrumentos',
        descricao: 'Controle de patrimônio, disponibilidade e situação de uso.',
        href: '/banda-municipal/instrumentos',
        icon: Music,
      },
    ],
  },
  {
    titulo: 'Operação',
    descricao: 'Rotina de ensaios, apresentações e chamadas oficiais.',
    areas: [
      {
        titulo: 'Ensaios',
        descricao: 'Agenda e acompanhamento dos ensaios da Banda Municipal.',
        href: '/banda-municipal/ensaios',
        icon: Calendar,
      },
      {
        titulo: 'Apresentações',
        descricao: 'Registro das apresentações, locais e compromissos públicos.',
        href: '/banda-municipal/apresentacoes',
        icon: Mic,
      },
      {
        titulo: 'Presenças',
        descricao: 'Chamada rápida de músicos em ensaios e apresentações.',
        href: '/banda-municipal/presencas',
        icon: ClipboardCheck,
      },
    ],
  },
  {
    titulo: 'Relatórios',
    descricao: 'Leituras consolidadas para gestão e prestação de contas.',
    areas: [
      {
        titulo: 'Relatórios',
        descricao: 'Visão consolidada de músicos, instrumentos e agenda.',
        href: '/banda-municipal/relatorios',
        icon: BarChart3,
      },
    ],
  },
]

export default function BandaMunicipalPage() {
  return (
    <ModuleLayout sidebar={<ModuloBandaMunicipalNav currentPath="/banda-municipal" />}>
      <ModuleHeader
        title="Banda Municipal"
        eyebrow="Gestão"
        description="Organize músicos, instrumentos, ensaios, apresentações, presenças e relatórios em uma visão única para apoiar a rotina cultural do município."
        icon={LayoutDashboard}
        accent="violet"
        context="Operação musical"
        action={
          <Link
            href={getTenantPath('/banda-municipal/ensaios')}
            className="btn-primary w-full justify-center md:w-auto"
          >
            <Calendar size={16} aria-hidden="true" />
            Abrir ensaios
          </Link>
        }
      />

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
              accent="violet"
            />
          ))}
        </ModuleSectionGrid>
      ))}
    </ModuleLayout>
  )
}
