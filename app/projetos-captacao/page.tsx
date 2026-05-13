import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BarChart3,
  ClipboardCheck,
  FileSearch,
  FolderKanban,
  GitCompareArrows,
  Landmark,
  LayoutDashboard,
  Radar,
} from 'lucide-react'
import {
  ModuleAreaCard,
  ModuleCard,
  ModuleMetricCard,
} from '@/components/module/module-card'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuleGrid, ModuleSectionGrid } from '@/components/module/module-grid'
import { ModuloCaptacaoNav } from '@/components/modulo-captacao-nav'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { getTenantPath } from '@/lib/tenant-paths-server'

export default async function ProjetosCaptacaoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: projetosData },
    { data: fontesData },
    { data: oportunidadesData },
    { data: analisesData },
  ] = await Promise.all([
    supabase.from('captacao_projetos').select('id, status, prioridade, area'),
    supabase.from('captacao_fontes').select('id, status'),
    supabase.from('captacao_oportunidades').select('id, status, prazo_inscricao'),
    supabase.from('captacao_analises').select('id, status, viabilidade'),
  ])

  const projetos = projetosData ?? []
  const fontes = fontesData ?? []
  const oportunidades = oportunidadesData ?? []
  const analises = analisesData ?? []

  const projetosEmAnalise = projetos.filter((item) => item.status === 'em_analise').length
  const oportunidadesAbertas = oportunidades.filter((item) => item.status === 'aberta').length
  const fontesAtivas = fontes.filter((item) => item.status === 'ativa').length
  const analisesPendentes = analises.filter((item) => item.status === 'em_analise').length

  return (
    <ModuleLayout sidebar={<ModuloCaptacaoNav currentPath="/projetos-captacao" />}>
      <ModuleHeader
        title="Projetos e Captação"
        eyebrow="Gestão estratégica"
        description="Gestão de ideias, projetos, análises técnicas, fontes de recursos e oportunidades de captação para cultura e turismo."
        icon={LayoutDashboard}
        accent="violet"
        context="Estratégia e recursos"
        action={
          <Link
            href={getTenantPath('/projetos-captacao/oportunidades')}
            className="btn-primary w-full justify-center md:w-auto"
          >
            <FileSearch size={16} aria-hidden="true" />
            Ver oportunidades
          </Link>
        }
      />

      <ModuleGrid columns={4}>
        <ModuleMetricCard label="Projetos cadastrados" value={projetos.length} icon={FolderKanban} accent="violet" />
        <ModuleMetricCard label="Projetos em análise" value={projetosEmAnalise} icon={ClipboardCheck} accent="violet" />
        <ModuleMetricCard label="Oportunidades abertas" value={oportunidadesAbertas} icon={FileSearch} accent="violet" />
        <ModuleMetricCard label="Fontes ativas" value={fontesAtivas} icon={Landmark} accent="violet" />
      </ModuleGrid>

      <ModuleSectionGrid
        title="Cadastros"
        description="Base estratégica de projetos, fontes e oportunidades."
        columns={3}
      >
        <ModuleAreaCard title="Projetos" description="Cadastre ideias, propostas e projetos para análise da diretoria." href="/projetos-captacao/projetos" icon={FolderKanban} accent="violet" />
        <ModuleAreaCard title="Fontes de recursos" description="Organize órgãos, programas, portais oficiais e linhas de recurso." href="/projetos-captacao/fontes" icon={Landmark} accent="violet" />
        <ModuleAreaCard title="Oportunidades" description="Monitore editais, chamadas públicas, prazos e valores disponíveis." href="/projetos-captacao/oportunidades" icon={FileSearch} accent="violet" />
      </ModuleSectionGrid>

      <ModuleSectionGrid
        title="Operação"
        description="Análise técnica, inteligência e compatibilidade entre projetos e editais."
        columns={3}
      >
        <ModuleAreaCard title="Análises técnicas" description="Registre pareceres, pendências, viabilidade e próximos passos." href="/projetos-captacao/analises" icon={ClipboardCheck} accent="violet" />
        <ModuleAreaCard title="Radar de editais" description="Acompanhe oportunidades federais, estaduais e institucionais." href="/projetos-captacao/radar" icon={Radar} accent="violet" />
        <ModuleAreaCard title="Compatibilidade" description="Relacione projetos cadastrados com oportunidades compatíveis." href="/projetos-captacao/matching" icon={GitCompareArrows} accent="violet" />
      </ModuleSectionGrid>

      <ModuleCard>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Radar estratégico</h2>
            <p className="mt-1 text-sm text-slate-600">
              Acompanhe a maturidade da carteira e priorize projetos com maior chance de captação.
            </p>
          </div>
          <Link href={getTenantPath('/projetos-captacao/relatorios')} className="btn-secondary">
            <BarChart3 size={16} aria-hidden="true" />
            Relatórios
          </Link>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Análises pendentes</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{analisesPendentes}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Projetos cultura</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {projetos.filter((item) => item.area === 'cultura').length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Projetos turismo</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {projetos.filter((item) => item.area === 'turismo').length}
            </p>
          </div>
        </div>
      </ModuleCard>
    </ModuleLayout>
  )
}
