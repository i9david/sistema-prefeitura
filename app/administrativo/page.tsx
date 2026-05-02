import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ModuloAdministrativoNav } from '@/components/modulo-administrativo-nav'

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function moduloCardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5'
}

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
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloAdministrativoNav currentPath="/administrativo" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Administrativo
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Controle geral do sistema, usuários, acessos, configurações e indicadores administrativos.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Usuários ativos</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {usuariosAtivos}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Alunos ativos</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {alunosAtivos}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Visitantes ativos</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {visitantesAtivos}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Artesãos ativos</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {artesaosAtivos}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Produtos ativos</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {produtosAtivos}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Link href="/administrativo/usuarios" className={moduloCardClassName()}>
              <h2 className="text-lg font-bold text-slate-900">
                Usuários e Acessos
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Consulte usuários, níveis de acesso, status e vínculos internos.
              </p>
            </Link>

            <Link href="/administrativo/configuracoes" className={moduloCardClassName()}>
              <h2 className="text-lg font-bold text-slate-900">
                Configurações do Sistema
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Edite o nome exibido globalmente no sistema e outras configurações gerais.
              </p>
            </Link>

            <Link href="/administrativo/agenda" className={moduloCardClassName()}>
              <h2 className="text-lg font-bold text-slate-900">
                Agenda Institucional
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Acompanhe compromissos, eventos e atividades administrativas.
              </p>
            </Link>

            <Link href="/relatorios" className={moduloCardClassName()}>
              <h2 className="text-lg font-bold text-slate-900">
                Relatórios Gerais
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Indicadores consolidados de todos os módulos do sistema.
              </p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}