import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModuloMuseuNav } from '@/components/modulo-museu-nav'

type PecaAcervo = {
  id: string
  status: string | null
  status_operacional: string | null
}

type VisitanteMuseu = {
  id: string
  data_visita: string | null
}

type MovimentacaoMuseu = {
  id: string
  data_movimentacao: string | null
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function getPeriodoMesAtual() {
  const hoje = new Date()

  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)

  const formatar = (data: Date) => {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }

  return {
    inicio: formatar(inicio),
    fim: formatar(fim),
  }
}

export default async function MuseuPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { inicio: dataInicio, fim: dataFim } = getPeriodoMesAtual()

  const [
    { data: acervoData, error: acervoError },
    { data: categoriasData, error: categoriasError },
    { data: visitantesData, error: visitantesError },
    { data: movimentacoesData, error: movimentacoesError },
  ] = await Promise.all([
    supabase
      .from('museu_acervo')
      .select('id, status, status_operacional'),

    supabase
      .from('museu_categorias')
      .select('id'),

    supabase
      .from('museu_visitantes')
      .select('id, data_visita')
      .gte('data_visita', dataInicio)
      .lte('data_visita', dataFim),

    supabase
      .from('museu_movimentacoes')
      .select('id, data_movimentacao')
      .gte('data_movimentacao', dataInicio)
      .lte('data_movimentacao', dataFim),
  ])

  const erros = [
    acervoError?.message,
    categoriasError?.message,
    visitantesError?.message,
    movimentacoesError?.message,
  ].filter(Boolean)

  if (erros.length > 0) {
    console.error('Erros no dashboard do Museu:', {
      acervoError,
      categoriasError,
      visitantesError,
      movimentacoesError,
    })

    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
          <ModuloMuseuNav currentPath="/centro-cultural/museu" />

          <section className="space-y-6">
            <div className={cardClassName()}>
              <h1 className="text-3xl font-bold text-slate-900">Museu</h1>
              <p className="mt-2 text-slate-600">
                Gestão do acervo histórico, status das peças, movimentações e visitação.
              </p>
            </div>

            <div className={cardClassName()}>
              <h2 className="text-2xl font-bold text-red-700">
                Erro ao carregar o painel do Museu
              </h2>

              <div className="mt-4 space-y-2 text-sm text-slate-700">
                {erros.map((erro, index) => (
                  <p
                    key={`${erro}-${index}`}
                    className="rounded-2xl bg-red-50 px-4 py-3"
                  >
                    {erro}
                  </p>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    )
  }

  const acervo = (acervoData ?? []) as PecaAcervo[]
  const visitantes = (visitantesData ?? []) as VisitanteMuseu[]
  const movimentacoes = (movimentacoesData ?? []) as MovimentacaoMuseu[]
  const categorias = categoriasData ?? []

  const pecasAtivas = acervo.filter((item) => item.status !== 'inativo')

  const emExposicao = pecasAtivas.filter(
    (item) => item.status_operacional === 'em_exposicao'
  ).length

  const emReserva = pecasAtivas.filter(
    (item) => item.status_operacional === 'em_reserva'
  ).length

  const emManutencao = pecasAtivas.filter(
    (item) => item.status_operacional === 'em_manutencao'
  ).length

  const emRestauracao = pecasAtivas.filter(
    (item) => item.status_operacional === 'em_restauracao'
  ).length

  const emprestadas = pecasAtivas.filter(
    (item) => item.status_operacional === 'emprestada'
  ).length

  const indisponiveis = pecasAtivas.filter(
    (item) => item.status_operacional === 'indisponivel'
  ).length

  const semStatusOperacional = pecasAtivas.filter(
    (item) => !item.status_operacional
  ).length

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloMuseuNav currentPath="/centro-cultural/museu" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <h1 className="text-3xl font-bold text-slate-900">Museu</h1>
            <p className="mt-2 text-slate-600">
              Gestão do acervo histórico, status das peças, movimentações e visitação.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Peças cadastradas</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {acervo.length}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Peças ativas</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {pecasAtivas.length}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Categorias</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {categorias.length}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Visitantes no mês</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {visitantes.length}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Em exposição</p>
              <p className="mt-2 text-2xl font-bold text-green-700">
                {emExposicao}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Em reserva</p>
              <p className="mt-2 text-2xl font-bold text-slate-700">
                {emReserva}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Em manutenção</p>
              <p className="mt-2 text-2xl font-bold text-amber-700">
                {emManutencao}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Em restauração</p>
              <p className="mt-2 text-2xl font-bold text-orange-700">
                {emRestauracao}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Emprestadas</p>
              <p className="mt-2 text-2xl font-bold text-blue-700">
                {emprestadas}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Indisponíveis</p>
              <p className="mt-2 text-2xl font-bold text-red-700">
                {indisponiveis}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Sem status operacional</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {semStatusOperacional}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Movimentações no mês</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {movimentacoes.length}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <a
              href="/centro-cultural/museu/acervo"
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
            >
              <h2 className="text-lg font-bold text-slate-900">Acervo</h2>
              <p className="mt-2 text-sm text-slate-600">
                Cadastro das peças, situação patrimonial e localização atual.
              </p>
            </a>

            <a
              href="/centro-cultural/museu/categorias"
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
            >
              <h2 className="text-lg font-bold text-slate-900">Categorias</h2>
              <p className="mt-2 text-sm text-slate-600">
                Organização das peças por categorias para facilitar o controle.
              </p>
            </a>

            <a
              href="/centro-cultural/museu/movimentacoes"
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
            >
              <h2 className="text-lg font-bold text-slate-900">Movimentações</h2>
              <p className="mt-2 text-sm text-slate-600">
                Entradas, saídas, manutenção, restauração e transferências.
              </p>
            </a>

            <a
              href="/centro-cultural/museu/visitantes"
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
            >
              <h2 className="text-lg font-bold text-slate-900">Visitantes</h2>
              <p className="mt-2 text-sm text-slate-600">
                Histórico automático dos visitantes vinculados ao Museu.
              </p>
            </a>

            <a
              href="/centro-cultural/museu/relatorios"
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
            >
              <h2 className="text-lg font-bold text-slate-900">Relatórios</h2>
              <p className="mt-2 text-sm text-slate-600">
                Indicadores e consolidados do acervo, movimentações e visitação.
              </p>
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}