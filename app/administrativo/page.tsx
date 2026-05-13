import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  MessageCircle,
  Package,
  Settings,
  ShieldCheck,
  UserRoundPlus,
  Users,
} from 'lucide-react'
import {
  ModuleAreaCard,
  ModuleMetricCard,
} from '@/components/module/module-card'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuleGrid, ModuleSectionGrid } from '@/components/module/module-grid'
import { ModuloAdministrativoNav } from '@/components/modulo-administrativo-nav'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { getTenantPath } from '@/lib/tenant-paths-server'

export default async function AdministrativoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: usuariosData },
    { data: centroAlunosData },
    { data: visitantesData },
    { data: artesaosData },
    { data: produtosData },
  ] = await Promise.all([
    supabase.from('administrativo_usuarios').select('id, status'),
    supabase.from('alunos').select('id, status'),
    supabase.from('visitantes').select('id, status'),
    supabase.from('casa_artesao_artesaos').select('id, status'),
    supabase.from('casa_artesao_produtos').select('id, status'),
  ])

  const usuarios = usuariosData ?? []
  const alunos = centroAlunosData ?? []
  const visitantes = visitantesData ?? []
  const artesaos = artesaosData ?? []
  const produtos = produtosData ?? []

  const usuariosAtivos = usuarios.filter((item) => item.status === 'ativo').length
  const alunosAtivos = alunos.filter((item) => item.status === 'ativo').length
  const visitantesAtivos = visitantes.filter((item) => item.status === 'ativo').length
  const artesaosAtivos = artesaos.filter((item) => item.status === 'ativo').length
  const produtosAtivos = produtos.filter((item) => item.status === 'ativo').length

  return (
    <ModuleLayout sidebar={<ModuloAdministrativoNav currentPath="/administrativo" />}>
      <ModuleHeader
        title="Administrativo"
        eyebrow="Gestão do sistema"
        description="Controle geral do sistema, usuários, acessos, configurações, comunicação e indicadores administrativos."
        icon={LayoutDashboard}
        accent="blue"
        context="Governança do sistema"
        action={
          <Link
            href={getTenantPath('/administrativo/usuarios')}
            className="btn-primary w-full justify-center md:w-auto"
          >
            <ShieldCheck size={16} aria-hidden="true" />
            Gerenciar acessos
          </Link>
        }
      />

      <ModuleGrid columns={5}>
        <ModuleMetricCard label="Usuários ativos" value={usuariosAtivos} icon={ShieldCheck} />
        <ModuleMetricCard label="Alunos ativos" value={alunosAtivos} icon={Users} />
        <ModuleMetricCard label="Visitantes ativos" value={visitantesAtivos} icon={UserRoundPlus} />
        <ModuleMetricCard label="Artesãos ativos" value={artesaosAtivos} icon={Users} />
        <ModuleMetricCard label="Produtos ativos" value={produtosAtivos} icon={Package} />
      </ModuleGrid>

      <ModuleSectionGrid
        title="Áreas administrativas"
        description="Acesse as rotinas centrais de operação e governança do sistema."
        columns={3}
      >
        <ModuleAreaCard
          title="Usuários e acessos"
          description="Consulte usuários, níveis de acesso, status e vínculos internos."
          href="/administrativo/usuarios"
          icon={ShieldCheck}
        />
        <ModuleAreaCard
          title="Comunicação"
          description="Configure mensagens e comunicações institucionais."
          href="/administrativo/comunicacao"
          icon={MessageCircle}
        />
        <ModuleAreaCard
          title="Configurações"
          description="Edite o nome exibido globalmente no sistema e ajustes gerais."
          href="/administrativo/configuracoes"
          icon={Settings}
        />
        <ModuleAreaCard
          title="Agenda institucional"
          description="Acompanhe compromissos, eventos e atividades administrativas."
          href="/administrativo/agenda"
          icon={CalendarDays}
        />
        <ModuleAreaCard
          title="Relatórios gerais"
          description="Indicadores consolidados de todos os módulos do sistema."
          href="/administrativo/relatorios"
          icon={BarChart3}
        />
      </ModuleSectionGrid>
    </ModuleLayout>
  )
}
