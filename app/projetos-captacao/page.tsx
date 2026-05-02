import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ModuloCaptacaoNav } from '@/components/modulo-captacao-nav'

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function moduloCardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5'
}

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
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCaptacaoNav currentPath="/projetos-captacao" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Projetos e Captação
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Gestão de ideias, projetos, análises técnicas, fontes de recursos e oportunidades de captação para cultura e turismo.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Projetos cadastrados</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {projetos.length}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Projetos em análise</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {projetosEmAnalise}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Oportunidades abertas</p>
              <p className="mt-2 text-2xl font-bold text-green-700">
                {oportunidadesAbertas}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Fontes ativas</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {fontesAtivas}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Link href="/projetos-captacao/projetos" className={moduloCardClassName()}>
              <h2 className="text-lg font-bold text-slate-900">Projetos</h2>
              <p className="mt-2 text-sm text-slate-600">
                Cadastre ideias, propostas e projetos para análise da diretoria.
              </p>
            </Link>

            <Link href="/projetos-captacao/analises" className={moduloCardClassName()}>
              <h2 className="text-lg font-bold text-slate-900">Análise técnica</h2>
              <p className="mt-2 text-sm text-slate-600">
                Registre pareceres, pendências, viabilidade e próximos passos.
              </p>
            </Link>

            <Link href="/projetos-captacao/fontes" className={moduloCardClassName()}>
              <h2 className="text-lg font-bold text-slate-900">Fontes de recursos</h2>
              <p className="mt-2 text-sm text-slate-600">
                Organize órgãos, programas, portais oficiais e linhas de recurso.
              </p>
            </Link>

            <Link href="/projetos-captacao/oportunidades" className={moduloCardClassName()}>
              <h2 className="text-lg font-bold text-slate-900">Oportunidades</h2>
              <p className="mt-2 text-sm text-slate-600">
                Monitore editais, chamadas públicas, prazos e valores disponíveis.
              </p>
            </Link>

            <Link href="/projetos-captacao/matching" className={moduloCardClassName()}>
              <h2 className="text-lg font-bold text-slate-900">Matching</h2>
              <p className="mt-2 text-sm text-slate-600">
                Relacione projetos cadastrados com oportunidades compatíveis.
              </p>
            </Link>

            <Link href="/projetos-captacao/relatorios" className={moduloCardClassName()}>
              <h2 className="text-lg font-bold text-slate-900">Relatórios</h2>
              <p className="mt-2 text-sm text-slate-600">
                Acompanhe carteira de projetos, oportunidades e captação.
              </p>
            </Link>
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Radar estratégico
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              O radar permite acompanhar oportunidades federais, estaduais e institucionais para transformar ideias em projetos viáveis.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Análises pendentes</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {analisesPendentes}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Projetos cultura</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {projetos.filter((item) => item.area === 'cultura').length}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Projetos turismo</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {projetos.filter((item) => item.area === 'turismo').length}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}