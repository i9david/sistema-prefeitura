import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ModuloMuseuNav } from '@/components/modulo-museu-nav'

type CategoriaRelacionada =
  | { id: string; nome: string }
  | { id: string; nome: string }[]
  | null

type PecaAcervo = {
  id: string
  nome: string
  descricao: string | null
  categoria_id: string | null
  numero_tombo: string | null
  origem: string | null
  data_aquisicao: string | null
  estado_conservacao: string | null
  localizacao: string | null
  localizacao_atual: string | null
  status: string | null
  status_operacional: string | null
  foto_url: string | null
  created_at: string | null
  categorias: CategoriaRelacionada
}

type Movimentacao = {
  id: string
  tipo: string | null
  descricao: string | null
  data_movimentacao: string | null
  responsavel: string | null
  nova_localizacao: string | null
  novo_status_operacional: string | null
  created_at: string | null
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function getCategoriaNome(categoria: CategoriaRelacionada) {
  if (!categoria) return 'Sem categoria'
  if (Array.isArray(categoria)) return categoria[0]?.nome ?? 'Sem categoria'
  return categoria.nome
}

function formatarData(data: string | null | undefined) {
  if (!data) return '-'
  const partes = data.split('-')
  if (partes.length !== 3) return data
  return `${partes[2]}/${partes[1]}/${partes[0]}`
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
      return valor || '-'
  }
}

function getStatusOperacionalClass(valor: string | null | undefined) {
  switch (valor) {
    case 'em_exposicao':
      return 'bg-green-100 text-green-700'
    case 'em_reserva':
      return 'bg-slate-200 text-slate-700'
    case 'em_manutencao':
      return 'bg-amber-100 text-amber-700'
    case 'em_restauracao':
      return 'bg-orange-100 text-orange-700'
    case 'emprestada':
      return 'bg-blue-100 text-blue-700'
    case 'indisponivel':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-slate-200 text-slate-700'
  }
}

export default async function MuseuPecaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: pecaData, error: pecaError },
    { data: movimentacoesData, error: movimentacoesError },
  ] = await Promise.all([
    supabase
      .from('museu_acervo')
      .select(`
        id,
        nome,
        descricao,
        categoria_id,
        numero_tombo,
        origem,
        data_aquisicao,
        estado_conservacao,
        localizacao,
        localizacao_atual,
        status,
        status_operacional,
        foto_url,
        created_at,
        categorias:museu_categorias (
          id,
          nome
        )
      `)
      .eq('id', id)
      .maybeSingle(),

    supabase
      .from('museu_movimentacoes')
      .select(`
        id,
        tipo,
        descricao,
        data_movimentacao,
        responsavel,
        nova_localizacao,
        novo_status_operacional,
        created_at
      `)
      .eq('acervo_id', id)
      .order('data_movimentacao', { ascending: false })
      .order('created_at', { ascending: false }),
  ])

  if (pecaError || !pecaData) {
    redirect('/centro-cultural/museu/acervo?message=Peça não encontrada')
  }

  if (movimentacoesError) {
    redirect(`/centro-cultural/museu/acervo?message=${encodeURIComponent(movimentacoesError.message)}`)
  }

  const peca = pecaData as PecaAcervo
  const movimentacoes = (movimentacoesData ?? []) as Movimentacao[]

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloMuseuNav currentPath="/centro-cultural/museu/acervo" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  {peca.nome}
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Prontuário completo da peça do acervo
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/centro-cultural/museu/acervo?editar=${peca.id}`}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Editar peça
                </Link>

                <Link
                  href="/centro-cultural/museu/acervo"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Voltar ao acervo
                </Link>
              </div>
            </div>
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Foto da peça
            </h2>

            <div className="mt-5">
              {peca.foto_url ? (
                <img
                  src={peca.foto_url}
                  alt={peca.nome}
                  className="max-h-[420px] rounded-3xl border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-64 w-full items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                  Sem foto cadastrada
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Tombo</p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {peca.numero_tombo || '-'}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Categoria</p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {getCategoriaNome(peca.categorias)}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Status cadastral</p>
              <p className="mt-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    peca.status === 'ativo'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {peca.status || 'ativo'}
                </span>
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm text-slate-500">Status operacional</p>
              <p className="mt-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusOperacionalClass(
                    peca.status_operacional
                  )}`}
                >
                  {getStatusOperacionalLabel(peca.status_operacional)}
                </span>
              </p>
            </div>
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Dados da peça
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Origem:</span> {peca.origem || '-'}
                </p>
                <p>
                  <span className="font-semibold">Data de aquisição:</span>{' '}
                  {formatarData(peca.data_aquisicao)}
                </p>
                <p>
                  <span className="font-semibold">Estado de conservação:</span>{' '}
                  {peca.estado_conservacao || '-'}
                </p>
              </div>

              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Localização de cadastro:</span>{' '}
                  {peca.localizacao || '-'}
                </p>
                <p>
                  <span className="font-semibold">Localização atual:</span>{' '}
                  {peca.localizacao_atual || peca.localizacao || '-'}
                </p>
                <p>
                  <span className="font-semibold">Data de registro:</span>{' '}
                  {formatarData(peca.created_at?.slice(0, 10))}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-700">Descrição</p>
              <p className="mt-2 text-sm text-slate-700">
                {peca.descricao || 'Sem descrição cadastrada.'}
              </p>
            </div>
          </div>

          <div className={cardClassName()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Histórico de movimentações
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Registro completo da trajetória da peça
                </p>
              </div>

              <Link
                href={`/centro-cultural/museu/movimentacoes?acervo_id=${peca.id}`}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Ver na lista de movimentações
              </Link>
            </div>

            {movimentacoes.length > 0 ? (
              <div className="mt-6 space-y-4">
                {movimentacoes.map((movimentacao) => (
                  <div
                    key={movimentacao.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                          {movimentacao.tipo || '-'}
                        </span>

                        {movimentacao.novo_status_operacional && (
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusOperacionalClass(
                              movimentacao.novo_status_operacional
                            )}`}
                          >
                            {getStatusOperacionalLabel(movimentacao.novo_status_operacional)}
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-slate-700 space-y-1">
                        <p>
                          <span className="font-semibold">Data:</span>{' '}
                          {formatarData(movimentacao.data_movimentacao)}
                        </p>
                        <p>
                          <span className="font-semibold">Responsável:</span>{' '}
                          {movimentacao.responsavel || '-'}
                        </p>
                        <p>
                          <span className="font-semibold">Nova localização:</span>{' '}
                          {movimentacao.nova_localizacao || '-'}
                        </p>
                        <p>
                          <span className="font-semibold">Descrição:</span>{' '}
                          {movimentacao.descricao || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhuma movimentação cadastrada para esta peça.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}