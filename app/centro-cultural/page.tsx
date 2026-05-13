import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileBarChart,
  Fingerprint,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  Link2,
  MessageCircle,
  Network,
  Shapes,
  UserRoundPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { ModuleAreaCard } from '@/components/module/module-card'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuleSectionGrid } from '@/components/module/module-grid'
import { ModuloCentroCulturalNav } from '@/components/modulo-centro-cultural-nav'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
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
    titulo: 'Gestão',
    descricao: 'Visão estratégica, agenda e indicadores executivos.',
    areas: [
      {
        titulo: 'Dashboard',
        descricao: 'Indicadores rápidos da operação cultural.',
        href: '/centro-cultural/dashboard',
        icon: BarChart3,
      },
      {
        titulo: 'Agenda cultural',
        descricao: 'Agenda consolidada de aulas, eventos e atividades.',
        href: '/agenda-cultural',
        icon: CalendarDays,
      },
    ],
  },
  {
    titulo: 'Cadastros',
    descricao: 'Base operacional de alunos, turmas, modalidades e professores.',
    areas: [
      {
        titulo: 'Alunos',
        descricao: 'Cadastro, matrículas, biometria e vínculo com pessoas.',
        href: '/alunos',
        icon: Users,
      },
      {
        titulo: 'Aulas / Turmas',
        descricao: 'Grade semanal, horários e estrutura das turmas.',
        href: '/aulas',
        icon: BookOpen,
      },
      {
        titulo: 'Modalidades',
        descricao: 'Linguagens, oficinas e categorias culturais.',
        href: '/modalidades',
        icon: Shapes,
      },
      {
        titulo: 'Professores',
        descricao: 'Cadastro e acompanhamento dos profissionais.',
        href: '/professores',
        icon: GraduationCap,
      },
    ],
  },
  {
    titulo: 'Vínculos',
    descricao: 'Configurações que conectam professores às atividades.',
    areas: [
      {
        titulo: 'Professores por aula',
        descricao: 'Definição dos professores responsáveis por turma.',
        href: '/aula-professores',
        icon: Link2,
      },
      {
        titulo: 'Professores por modalidade',
        descricao: 'Organização dos professores por área de atuação.',
        href: '/modalidade-professores',
        icon: Network,
      },
    ],
  },
  {
    titulo: 'Operação',
    descricao: 'Rotinas do dia a dia no atendimento e nas aulas.',
    areas: [
      {
        titulo: 'Frequência',
        descricao: 'Chamada por turma e controle manual de presença.',
        href: '/frequencia',
        icon: ClipboardCheck,
      },
      {
        titulo: 'Terminal de presença',
        descricao: 'Registro rápido de presença por biometria.',
        href: '/frequencia-biometria',
        icon: Fingerprint,
      },
    ],
  },
  {
    titulo: 'Público',
    descricao: 'Relacionamento com visitantes, contatos e acervo.',
    areas: [
      {
        titulo: 'Visitantes',
        descricao: 'Entrada, permanência e encerramento de visitas.',
        href: '/visitantes',
        icon: UserRoundPlus,
      },
      {
        titulo: 'Comunicação',
        descricao: 'Contatos, aniversariantes e campanhas de relacionamento.',
        href: '/contatos',
        icon: MessageCircle,
      },
      {
        titulo: 'Museu',
        descricao: 'Acervo, categorias, movimentações e visitantes.',
        href: '/centro-cultural/museu',
        icon: Landmark,
      },
    ],
  },
  {
    titulo: 'Relatórios',
    descricao: 'Consolidados profissionais para gestão pública.',
    areas: [
      {
        titulo: 'Relatório de visitantes',
        descricao: 'Análise operacional da visitação no período.',
        href: '/visitantes/relatorios',
        icon: FileBarChart,
      },
      {
        titulo: 'Relatórios de gestão',
        descricao: 'Indicadores culturais para tomada de decisão.',
        href: '/centro-cultural/relatorios',
        icon: BarChart3,
      },
    ],
  },
]

export default async function CentroCulturalPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <ModuleLayout sidebar={<ModuloCentroCulturalNav currentPath="/centro-cultural" />}>
      <ModuleHeader
        title="Centro Cultural"
        eyebrow="Visão geral"
        description="Gestão integrada de alunos, aulas, professores, frequência, visitantes, comunicação e áreas vinculadas como o Museu."
        icon={LayoutDashboard}
        accent="blue"
        context="Gestão cultural"
        action={
          <Link
            href={getTenantPath('/centro-cultural/dashboard')}
            className="btn-primary w-full justify-center md:w-auto"
          >
            <BarChart3 size={16} aria-hidden="true" />
            Abrir dashboard
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
              accent="blue"
            />
          ))}
        </ModuleSectionGrid>
      ))}
    </ModuleLayout>
  )
}
