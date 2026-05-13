import { redirect } from 'next/navigation'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuloMuseuNav } from '@/components/modulo-museu-nav'

type PecaAcervo = {
  id: string
  status: string | null
  status_operacional: string | null
}

type VisitanteMuseu = {
  id: string
  data_visita: string | null
  status: string | null
}

type MovimentacaoMuseu = {
  id: string
  tipo: string | null
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

function getStatusOperacionalLabel(valor: string | null | undefined) {
  switch (valor) {
    case 'em_exposicao':
      return 'Em exposição'
    case 'em_reserva':
      return 'Em reserva'
    case 'em_manutencao':
      return 'Em manutenção'
    case 'em_restauracao':
      return 'Em restauração'
    case 'emprestada':
      return 'Emprestada'
    case 'indisponivel':
      return 'Indisponível'
    default:
      return valor || 'Sem status'
  }
}

function contarPorCampo<T>(
  itens: T[],
  getValor: (item: T) => string | null | undefined
) {
  return itens.reduce<Record<string, number>>((acc, item) => {
    const chave = getValor(item) || 'Sem informação'
    acc[chave] = (acc[chave] ?? 0) + 1
    return acc
  }, {})
}

function ordenarContagens(contagens: Record<string, number>) {
  return Object.entries(contagens).sort(([, totalA], [, totalB]) => totalB - totalA)
}

function Indicador({
  label,
  valor,
  detalhe,
}: {
  label: string
  valor: number
  detalhe?: string
}) {
  return (
    <div className={cardClassName()}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {valor}
      </p>
      {detalhe && <p className="mt-2 text-sm text-slate-600">{detalhe}</p>}
    </div>
  )
}

function ListaContagem({
  titulo,
  itens,
  vazio,
}: {
  titulo: string
  itens: [string, number][]
  vazio: string
}) {
  return (
    <div className={cardClassName()}>
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">
        {titulo}
      </h2>

      {itens.length > 0 ? (
        <div className="mt-5 space-y-3">
          {itens.map(([label, total]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
            >
              <span className="text-sm font-medium text-slate-700">{label}</span>
              <span className="text-sm font-bold text-slate-900">{total}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-600">{vazio}</p>
      )}
    </div>
  )
}

export default async function MuseuRelatoriosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { inicio: dataInicio, fim: dataFim } = getPeriodoMesAtual()

  const [
    { data: acervoData, error: acervoError },
    { data: visitantesData, error: visitantesError },
    { data: movimentacoesData, error: movimentacoesError },
  ] = await Promise.all([
    supabase
      .from('museu_acervo')
      .select('id, status, status_operacional'),

    supabase
      .from('museu_visitantes')
      .select('id, data_visita, status')
      .gte('data_visita', dataInicio)
      .lte('data_visita', dataFim),

    supabase
      .from('museu_movimentacoes')
      .select('id, tipo, data_movimentacao')
      .gte('data_movimentacao', dataInicio)
      .lte('data_movimentacao', dataFim),
  ])

  const erros = [
    acervoError?.message,
    visitantesError?.message,
    movimentacoesError?.message,
  ].filter(Boolean)

  if (erros.length > 0) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
          <ModuloMuseuNav currentPath="/centro-cultural/museu/relatorios" />

          <section className="space-y-6">
            <div className={cardClassName()}>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Relatórios do Museu
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Indicadores consolidados do acervo, visitação e movimentações.
              </p>
            </div>

            <div className={cardClassName()}>
              <h2 className="text-2xl font-bold text-red-700">
                Erro ao carregar relatórios
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

  const pecasAtivas = acervo.filter((item) => item.status !== 'inativo')
  const visitantesEmAberto = visitantes.filter((item) => item.status === 'ativo')

  const statusOperacionais = ordenarContagens(
    contarPorCampo(pecasAtivas, (item) =>
      getStatusOperacionalLabel(item.status_operacional)
    )
  )

  const tiposMovimentacao = ordenarContagens(
    contarPorCampo(movimentacoes, (item) => item.tipo)
  )

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloMuseuNav currentPath="/centro-cultural/museu/relatorios" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Relatórios do Museu
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Indicadores consolidados do acervo, visitação e movimentações do mês atual.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Indicador
              label="Peças cadastradas"
              valor={acervo.length}
              detalhe="Total geral do acervo"
            />
            <Indicador
              label="Peças ativas"
              valor={pecasAtivas.length}
              detalhe="Desconsidera status inativo"
            />
            <Indicador
              label="Visitantes no mês"
              valor={visitantes.length}
              detalhe={`${dataInicio} a ${dataFim}`}
            />
            <Indicador
              label="Movimentações no mês"
              valor={movimentacoes.length}
              detalhe={`${dataInicio} a ${dataFim}`}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Indicador
              label="Visitantes em aberto"
              valor={visitantesEmAberto.length}
              detalhe="Visitas registradas sem encerramento operacional"
            />
            <Indicador
              label="Peças inativas"
              valor={acervo.length - pecasAtivas.length}
              detalhe="Itens fora do acervo ativo"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ListaContagem
              titulo="Acervo por status operacional"
              itens={statusOperacionais}
              vazio="Nenhuma peça ativa encontrada."
            />

            <ListaContagem
              titulo="Movimentações por tipo"
              itens={tiposMovimentacao}
              vazio="Nenhuma movimentação registrada no mês atual."
            />
          </div>
        </section>
      </div>
    </main>
  )
}
