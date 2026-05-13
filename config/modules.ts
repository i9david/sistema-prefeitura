import {
  BarChart3,
  BookOpen,
  Boxes,
  Calendar,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileSearch,
  Fingerprint,
  FolderKanban,
  GitCompareArrows,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  Link2,
  MapPin,
  MessageCircle,
  Mic,
  Music,
  Network,
  Package,
  PackageSearch,
  Radar,
  ReceiptText,
  Settings,
  Shapes,
  ShieldCheck,
  ShoppingCart,
  UserRoundPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type {
  ModuleAccent,
  ModuleSidebarGroup,
} from '@/components/module/module-sidebar'

export type ModuleKey =
  | 'centro-cultural'
  | 'banda-municipal'
  | 'turismo'
  | 'casa-artesao'
  | 'projetos-captacao'
  | 'almoxarifado'
  | 'administrativo'

export type ModuleConfig = {
  key: ModuleKey
  title: string
  accent: ModuleAccent
  description: string
  icon: LucideIcon
  groups: ModuleSidebarGroup[]
}

export const moduleConfigs: Record<ModuleKey, ModuleConfig> = {
  'centro-cultural': {
    key: 'centro-cultural',
    title: 'Centro Cultural',
    accent: 'blue',
    icon: LayoutDashboard,
    description:
      'Gestão integrada de alunos, aulas, professores, frequência, visitantes, comunicação e Museu.',
    groups: [
      {
        label: 'Gestão',
        items: [
          { label: 'Visão geral', href: '/centro-cultural', icon: LayoutDashboard },
          { label: 'Dashboard', href: '/centro-cultural/dashboard', icon: BarChart3 },
          { label: 'Agenda cultural', href: '/agenda-cultural', icon: CalendarDays },
        ],
      },
      {
        label: 'Cadastros',
        items: [
          { label: 'Alunos', href: '/alunos', icon: Users },
          { label: 'Modalidades', href: '/modalidades', icon: Shapes },
          { label: 'Aulas / Turmas', href: '/aulas', icon: BookOpen },
          { label: 'Professores', href: '/professores', icon: GraduationCap },
        ],
      },
      {
        label: 'Vínculos',
        items: [
          { label: 'Professores por aula', href: '/aula-professores', icon: Link2 },
          { label: 'Professores por modalidade', href: '/modalidade-professores', icon: Network },
        ],
      },
      {
        label: 'Operação',
        items: [
          { label: 'Frequência', href: '/frequencia', icon: ClipboardCheck },
          { label: 'Terminal de presença', href: '/frequencia-biometria', icon: Fingerprint },
        ],
      },
      {
        label: 'Público',
        items: [
          { label: 'Visitantes', href: '/visitantes', icon: UserRoundPlus },
          { label: 'Comunicação', href: '/contatos', icon: MessageCircle },
          { label: 'Museu', href: '/centro-cultural/museu', icon: Landmark },
        ],
      },
      {
        label: 'Relatórios',
        items: [
          { label: 'Visitantes', href: '/visitantes/relatorios', icon: BarChart3 },
          { label: 'Gestão cultural', href: '/centro-cultural/relatorios', icon: BarChart3 },
        ],
      },
    ],
  },
  'banda-municipal': {
    key: 'banda-municipal',
    title: 'Banda Municipal',
    accent: 'violet',
    icon: Music,
    description:
      'Gestão de músicos, instrumentos, ensaios, apresentações, presenças e relatórios.',
    groups: [
      {
        label: 'Gestão',
        items: [
          { label: 'Visão geral', href: '/banda-municipal', icon: LayoutDashboard },
        ],
      },
      {
        label: 'Cadastros',
        items: [
          { label: 'Músicos', href: '/banda-municipal/musicos', icon: Users },
          { label: 'Instrumentos', href: '/banda-municipal/instrumentos', icon: Music },
        ],
      },
      {
        label: 'Operação',
        items: [
          { label: 'Ensaios', href: '/banda-municipal/ensaios', icon: Calendar },
          { label: 'Apresentações', href: '/banda-municipal/apresentacoes', icon: Mic },
          { label: 'Presenças', href: '/banda-municipal/presencas', icon: ClipboardCheck },
        ],
      },
      {
        label: 'Relatórios',
        items: [
          { label: 'Relatórios', href: '/banda-municipal/relatorios', icon: BarChart3 },
        ],
      },
    ],
  },
  turismo: {
    key: 'turismo',
    title: 'Turismo',
    accent: 'emerald',
    icon: MapPin,
    description:
      'Gestão de pontos turísticos, demandas, visitantes e relatórios de turismo.',
    groups: [
      {
        label: 'Gestão',
        items: [
          { label: 'Visão geral', href: '/turismo', icon: LayoutDashboard },
          { label: 'Dashboard', href: '/turismo/dashboard', icon: BarChart3 },
        ],
      },
      {
        label: 'Cadastros',
        items: [
          { label: 'Pontos turísticos', href: '/turismo/pontos', icon: MapPin },
        ],
      },
      {
        label: 'Operação',
        items: [
          { label: 'Demandas', href: '/turismo/demandas', icon: ClipboardList },
        ],
      },
      {
        label: 'Público',
        items: [
          { label: 'Visitantes', href: '/turismo/visitantes', icon: Users },
        ],
      },
      {
        label: 'Relatórios',
        items: [
          { label: 'Relatórios', href: '/turismo/relatorios', icon: BarChart3 },
        ],
      },
    ],
  },
  'casa-artesao': {
    key: 'casa-artesao',
    title: 'Casa do Artesão',
    accent: 'amber',
    icon: ShoppingCart,
    description:
      'Gestão de artesãos, produtos, estoque, caixa, fechamentos e relatórios.',
    groups: [
      {
        label: 'Gestão',
        items: [
          { label: 'Visão geral', href: '/casa-artesao', icon: LayoutDashboard },
          { label: 'Configurações', href: '/casa-artesao/configuracoes', icon: Settings },
        ],
      },
      {
        label: 'Cadastros',
        items: [
          { label: 'Artesãos', href: '/casa-artesao/artesaos', icon: Users },
          { label: 'Produtos', href: '/casa-artesao/produtos', icon: Package },
        ],
      },
      {
        label: 'Operação',
        items: [
          { label: 'Caixa / Vendas', href: '/casa-artesao/caixa', icon: ShoppingCart },
          { label: 'Estoque', href: '/casa-artesao/estoque', icon: Boxes },
          { label: 'Fechamentos', href: '/casa-artesao/fechamentos', icon: ReceiptText },
        ],
      },
      {
        label: 'Relatórios',
        items: [
          { label: 'Relatórios financeiros', href: '/casa-artesao/relatorios', icon: BarChart3 },
        ],
      },
    ],
  },
  'projetos-captacao': {
    key: 'projetos-captacao',
    title: 'Projetos e Captação',
    accent: 'violet',
    icon: FolderKanban,
    description:
      'Gestão estratégica de projetos, fontes, oportunidades, análises e matching.',
    groups: [
      {
        label: 'Gestão',
        items: [
          { label: 'Visão geral', href: '/projetos-captacao', icon: LayoutDashboard },
        ],
      },
      {
        label: 'Cadastros',
        items: [
          { label: 'Projetos', href: '/projetos-captacao/projetos', icon: FolderKanban },
          { label: 'Fontes de recursos', href: '/projetos-captacao/fontes', icon: Landmark },
          { label: 'Oportunidades', href: '/projetos-captacao/oportunidades', icon: FileSearch },
        ],
      },
      {
        label: 'Operação',
        items: [
          { label: 'Análises técnicas', href: '/projetos-captacao/analises', icon: ClipboardCheck },
          { label: 'Radar de editais', href: '/projetos-captacao/radar', icon: Radar },
          { label: 'Compatibilidade', href: '/projetos-captacao/matching', icon: GitCompareArrows },
        ],
      },
      {
        label: 'Relatórios',
        items: [
          { label: 'Relatórios estratégicos', href: '/projetos-captacao/relatorios', icon: BarChart3 },
        ],
      },
    ],
  },
  almoxarifado: {
    key: 'almoxarifado',
    title: 'Almoxarifado',
    accent: 'emerald',
    icon: PackageSearch,
    description:
      'Controle profissional de categorias, produtos, estoque mínimo e movimentações de entrada, saída e ajuste.',
    groups: [
      {
        label: 'Gestão',
        items: [
          { label: 'Visão geral', href: '/almoxarifado', icon: LayoutDashboard },
        ],
      },
      {
        label: 'Cadastros',
        items: [
          { label: 'Categorias', href: '/almoxarifado/categorias', icon: Shapes },
          { label: 'Produtos', href: '/almoxarifado/produtos', icon: Package },
        ],
      },
      {
        label: 'Operação',
        items: [
          { label: 'Movimentações', href: '/almoxarifado/movimentacoes', icon: ClipboardList },
        ],
      },
      {
        label: 'Relatórios',
        items: [
          { label: 'Relatórios', href: '/almoxarifado/relatorios', icon: BarChart3 },
          { label: 'Produtos críticos', href: '/almoxarifado/produtos?estoque=baixo', icon: BarChart3 },
        ],
      },
    ],
  },
  administrativo: {
    key: 'administrativo',
    title: 'Administrativo',
    accent: 'blue',
    icon: ShieldCheck,
    description:
      'Controle de usuários, acessos, comunicação, agenda, configurações e relatórios.',
    groups: [
      {
        label: 'Gestão',
        items: [
          { label: 'Visão geral', href: '/administrativo', icon: LayoutDashboard },
        ],
      },
      {
        label: 'Cadastros',
        items: [
          { label: 'Usuários e acessos', href: '/administrativo/usuarios', icon: ShieldCheck },
        ],
      },
      {
        label: 'Operação',
        items: [
          { label: 'Comunicação', href: '/administrativo/comunicacao', icon: MessageCircle },
          { label: 'Agenda institucional', href: '/administrativo/agenda', icon: CalendarDays },
          { label: 'Configurações', href: '/administrativo/configuracoes', icon: Settings },
        ],
      },
      {
        label: 'Relatórios',
        items: [
          { label: 'Relatórios gerais', href: '/administrativo/relatorios', icon: BarChart3 },
        ],
      },
    ],
  },
}

export function getModuleConfig(key: ModuleKey) {
  return moduleConfigs[key]
}
