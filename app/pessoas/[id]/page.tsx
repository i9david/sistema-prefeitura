import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"Sidebar currentPath="/" /> } from '@/components/<Sidebar currentPath="/" />'
import { atualizarPessoaCRM } from '../actions'

type Pessoa = {
  id: string
  nome: string
  telefone: string
  data_nascimento: string
  created_at: string
}

type Aluno = {
  id: string
  pessoa_id: string | null
  nome: string
  aula_nome: string | null
  modalidade: string | null
  dia_aula: string | null
  horario_turma: string | null
  status: string
  data_matricula: string | null
}

type Frequencia = {
  id: string
  aluno_id: string
  data_aula: string
  status: string
  observacoes: string | null
}

type Visitante = {
  id: string
  pessoa_id: string | null
  nome: string
  data_visita: string
  horario_entrada: string
  observacoes: string | null
}

type Leitor = {
  id: string
  pessoa_id: string | null
  nome: string
  endereco: string | null
  status: string
}

type Emprestimo = {
  id: string
  leitor_id: string
  livro_titulo: string
  data_emprestimo: string
  data_prevista_devolucao: string
  data_devolucao: string | null
  status: string
  observacoes: string | null
}

type TimelineItem = {
  id: string
  data: string
  hora?: string | null
  origem: 'centro-cultural' | 'visita' | 'biblioteca' | 'cadastro'
  titulo: string
  descricao: string
  badge: string
  badgeClass: string
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function formatarTelefone(valor: string | null | undefined) {
  const numeros = String(valor ?? '').replace(/\D/g, '').slice(0, 11)

  if (!numeros) return '-'

  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d+)/, '$1-$2')
  }

  return numeros
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d+)/, '$1-$2')
}

function formatarData(data: string | null | undefined) {
  if (!data) return '-'
  const partes = data.split('-')
  if (partes.length !== 3) return data
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function formatarDataHora(data: string | null | undefined, hora?: string | null) {
  const dataFormatada = formatarData(data)
  if (!hora) return dataFormatada
  return `${dataFormatada} às ${hora}`
}

function normalizarDataOrdenacao(data: string) {
  return new Date(`${data}T12:00:00`).getTime()
}

export default async function PessoaPerfilPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ message?: string; editar?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const modoEdicao = query.editar === '1'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: pessoa, error: erroPessoa } = await supabase
    .from('pessoas')
    .select('id, nome, telefone, data_nascimento, created_at')
    .eq('id', id)
    .maybeSingle()

  if (erroPessoa) {
    redirect(`/pessoas?message=${encodeURIComponent(erroPessoa.message)}`)
  }

  if (!pessoa) {
    notFound()
  }

  const { data: alunosData, error: erroAlunos } = await supabase
    .from('alunos')
    .select('id, pessoa_id, nome, aula_nome, modalidade, dia_aula, horario_turma, status, data_matricula')
    .eq('pessoa_id', pessoa.id)

  if (erroAlunos) {
    redirect(`/pessoas?message=${encodeURIComponent(erroAlunos.message)}`)
  }

  const alunos = (alunosData ?? []) as Aluno[]
  const alunoIds = alunos.map((item) => item.id)

  const { data: frequenciasData, error: erroFrequencias } =
    alunoIds.length > 0
      ? await supabase
          .from('frequencias')
          .select('id, aluno_id, data_aula, status, observacoes')
          .in('aluno_id', alunoIds)
          .order('data_aula', { ascending: false })
      : { data: [], error: null as any }

  if (erroFrequencias) {
    redirect(`/pessoas?message=${encodeURIComponent(erroFrequencias.message)}`)
  }

  const { data: visitantesData, error: erroVisitantes } = await supabase
    .from('visitantes')
    .select('id, pessoa_id, nome, data_visita, horario_entrada, observacoes')
    .eq('pessoa_id', pessoa.id)
    .order('data_visita', { ascending: false })

  if (erroVisitantes) {
    redirect(`/pessoas?message=${encodeURIComponent(erroVisitantes.message)}`)
  }

  const { data: leitoresData, error: erroLeitores } = await supabase
    .from('biblioteca_leitores')
    .select('id, pessoa_id, nome, endereco, status')
    .eq('pessoa_id', pessoa.id)

  if (erroLeitores) {
    redirect(`/pessoas?message=${encodeURIComponent(erroLeitores.message)}`)
  }

  const leitores = (leitoresData ?? []) as Leitor[]
  const leitorIds = leitores.map((item) => item.id)

  const { data: emprestimosData, error: erroEmprestimos } =
    leitorIds.length > 0
      ? await supabase
          .from('biblioteca_emprestimos')
          .select('id, leitor_id, livro_titulo, data_emprestimo, data_prevista_devolucao, data_devolucao, status, observacoes')
          .in('leitor_id', leitorIds)
          .order('data_emprestimo', { ascending: false })
      : { data: [], error: null as any }

  if (erroEmprestimos) {
    redirect(`/pessoas?message=${encodeURIComponent(erroEmprestimos.message)}`)
  }

  const frequencias = (frequenciasData ?? []) as Frequencia[]
  const visitantes = (visitantesData ?? []) as Visitante[]
  const emprestimos = (emprestimosData ?? []) as Emprestimo[]

  const modulos: string[] = []
  if (alunos.length > 0) modulos.push('Centro Cultural')
  if (visitantes.length > 0) modulos.push('Visitantes')
  if (leitores.length > 0) modulos.push('Biblioteca')

  const timeline: TimelineItem[] = []

  timeline.push({
    id: `cadastro-${pessoa.id}`,
    data: String(pessoa.created_at).slice(0, 10),
    origem: 'cadastro',
    titulo: 'Cadastro criado na base única',
    descricao: 'Pessoa inserida no CRM central da Secretaria.',
    badge: 'Cadastro',
    badgeClass: 'bg-slate-200 text-slate-700',
  })

  alunos.forEach((aluno) => {
    if (aluno.data_matricula) {
      timeline.push({
        id: `matricula-${aluno.id}`,
        data: aluno.data_matricula,
        origem: 'centro-cultural',
        titulo: 'Entrada no Centro Cultural',
        descricao: `${aluno.aula_nome || 'Turma não informada'} • ${aluno.modalidade || 'Modalidade não informada'} • ${aluno.status}`,
        badge: 'Centro Cultural',
        badgeClass: 'bg-blue-100 text-blue-700',
      })
    }
  })

  frequencias.forEach((freq) => {
    timeline.push({
      id: `frequencia-${freq.id}`,
      data: freq.data_aula,
      origem: 'centro-cultural',
      titulo: freq.status === 'presente' ? 'Presença registrada' : 'Falta registrada',
      descricao: freq.observacoes || 'Lançamento de frequência no Centro Cultural.',
      badge: freq.status === 'presente' ? 'Presença' : 'Falta',
      badgeClass:
        freq.status === 'presente'
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700',
    })
  })

  visitantes.forEach((visita) => {
    timeline.push({
      id: `visita-${visita.id}`,
      data: visita.data_visita,
      hora: visita.horario_entrada,
      origem: 'visita',
      titulo: 'Visita registrada',
      descricao: visita.observacoes || 'Entrada registrada como visitante.',
      badge: 'Visitante',
      badgeClass: 'bg-cyan-100 text-cyan-700',
    })
  })

  emprestimos.forEach((emp) => {
    timeline.push({
      id: `emprestimo-${emp.id}`,
      data: emp.data_emprestimo,
      origem: 'biblioteca',
      titulo: 'Empréstimo realizado',
      descricao: `${emp.livro_titulo} • previsão de devolução em ${formatarData(emp.data_prevista_devolucao)}`,
      badge: 'Biblioteca',
      badgeClass: 'bg-emerald-100 text-emerald-700',
    })

    if (emp.data_devolucao) {
      timeline.push({
        id: `devolucao-${emp.id}`,
        data: emp.data_devolucao,
        origem: 'biblioteca',
        titulo: 'Devolução registrada',
        descricao: `${emp.livro_titulo} • ${emp.observacoes || 'Devolução concluída.'}`,
        badge: 'Devolução',
        badgeClass: 'bg-indigo-100 text-indigo-700',
      })
    }
  })

  timeline.sort((a, b) => {
    const dataB = normalizarDataOrdenacao(b.data)
    const dataA = normalizarDataOrdenacao(a.data)

    if (dataB !== dataA) return dataB - dataA

    const horaB = b.hora ? Number(b.hora.replace(':', '')) : 0
    const horaA = a.hora ? Number(a.hora.replace(':', '')) : 0

    return horaB - horaA
  })

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <<Sidebar currentPath="/" /> />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Perfil da Pessoa
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Ficha consolidada da base única da Secretaria
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {!modoEdicao ? (
                  <Link
                    href={`/pessoas/${pessoa.id}?editar=1`}
                    className="inline-flex rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Editar dados
                  </Link>
                ) : (
                  <Link
                    href={`/pessoas/${pessoa.id}`}
                    className="inline-flex rounded-2xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancelar edição
                  </Link>
                )}

                <Link
                  href="/pessoas"
                  className="inline-flex rounded-2xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Voltar ao CRM
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Nome</p>
              <p className="mt-3 text-xl font-bold tracking-tight text-slate-900">
                {pessoa.nome}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Telefone</p>
              <p className="mt-3 text-xl font-bold tracking-tight text-slate-900">
                {formatarTelefone(pessoa.telefone)}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Nascimento</p>
              <p className="mt-3 text-xl font-bold tracking-tight text-slate-900">
                {formatarData(pessoa.data_nascimento)}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Módulos</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {modulos.length > 0 ? (
                  modulos.map((modulo) => (
                    <span
                      key={modulo}
                      className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      {modulo}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">Sem vínculo</span>
                )}
              </div>
            </div>
          </div>

          {modoEdicao && (
            <div className={cardClassName()}>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Editar dados centrais
                </h2>
                <span className="rounded-2xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
                  Atualiza CRM e módulos vinculados
                </span>
              </div>

              <form action={atualizarPessoaCRM} className="mt-6 grid gap-4">
                <input type="hidden" name="id" value={pessoa.id} />

                <input
                  name="nome"
                  placeholder="Nome completo"
                  required
                  defaultValue={pessoa.nome}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <input
                  name="telefone"
                  placeholder="Telefone"
                  required
                  defaultValue={formatarTelefone(pessoa.telefone)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <input
                  name="data_nascimento"
                  type="date"
                  required
                  defaultValue={pessoa.data_nascimento}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                {query.message && (
                  <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    {query.message}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Salvar alterações
                  </button>

                  <Link
                    href={`/pessoas/${pessoa.id}`}
                    className="rounded-2xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancelar
                  </Link>
                </div>
              </form>
            </div>
          )}

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Linha do tempo do relacionamento
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Histórico unificado de cadastro, entradas, visitas, empréstimos e presenças
            </p>

            {timeline.length > 0 ? (
              <div className="mt-6 space-y-4">
                {timeline.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.badgeClass}`}>
                            {item.badge}
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            {formatarDataHora(item.data, item.hora)}
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-bold tracking-tight text-slate-900">
                          {item.titulo}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {item.descricao}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhum relacionamento registrado até o momento.
              </p>
            )}
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Dados pessoais
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Nome completo</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{pessoa.nome}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Telefone</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {formatarTelefone(pessoa.telefone)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Data de nascimento</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {formatarData(pessoa.data_nascimento)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Cadastro na base</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {formatarData(String(pessoa.created_at).slice(0, 10))}
                </p>
              </div>
            </div>
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Centro Cultural
            </h2>

            {alunos.length > 0 ? (
              <div className="mt-6 space-y-4">
                {alunos.map((aluno) => (
                  <div key={aluno.id} className="rounded-2xl bg-slate-50 p-5">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                      <div>
                        <p className="text-sm text-slate-500">Turma</p>
                        <p className="mt-1 font-semibold text-slate-900">{aluno.aula_nome || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Modalidade</p>
                        <p className="mt-1 font-semibold text-slate-900">{aluno.modalidade || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Dia</p>
                        <p className="mt-1 font-semibold text-slate-900">{aluno.dia_aula || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Horário</p>
                        <p className="mt-1 font-semibold text-slate-900">{aluno.horario_turma || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Status</p>
                        <p className="mt-1">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              aluno.status === 'ativo'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {aluno.status}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-slate-500">Matrícula</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {formatarData(aluno.data_matricula)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhum vínculo no Centro Cultural.
              </p>
            )}
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Histórico de presença
            </h2>

            {frequencias.length > 0 ? (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Data</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {frequencias.map((item) => (
                      <tr key={item.id} className="bg-slate-50">
                        <td className="rounded-l-2xl px-4 py-4 text-slate-700">
                          {formatarData(item.data_aula)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              item.status === 'presente'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="rounded-r-2xl px-4 py-4 text-slate-700">
                          {item.observacoes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhum histórico de presença encontrado.
              </p>
            )}
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Histórico de visitas
            </h2>

            {visitantes.length > 0 ? (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Data da visita</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Horário de entrada</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitantes.map((item) => (
                      <tr key={item.id} className="bg-slate-50">
                        <td className="rounded-l-2xl px-4 py-4 text-slate-700">
                          {formatarData(item.data_visita)}
                        </td>
                        <td className="px-4 py-4 text-slate-700">{item.horario_entrada}</td>
                        <td className="rounded-r-2xl px-4 py-4 text-slate-700">
                          {item.observacoes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhum histórico de visitas encontrado.
              </p>
            )}
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Biblioteca
            </h2>

            {leitores.length > 0 ? (
              <div className="mt-6 space-y-4">
                {leitores.map((leitor) => (
                  <div key={leitor.id} className="rounded-2xl bg-slate-50 p-5">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <div>
                        <p className="text-sm text-slate-500">Status</p>
                        <p className="mt-1">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              leitor.status === 'ativo'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {leitor.status}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Endereço</p>
                        <p className="mt-1 font-semibold text-slate-900">{leitor.endereco || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Perfil de leitor</p>
                        <p className="mt-1 font-semibold text-slate-900">Vinculado à Biblioteca</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhum vínculo na Biblioteca.
              </p>
            )}
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Histórico da biblioteca
            </h2>

            {emprestimos.length > 0 ? (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Livro</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Empréstimo</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Prev. devolução</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Devolução</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emprestimos.map((item) => (
                      <tr key={item.id} className="bg-slate-50">
                        <td className="rounded-l-2xl px-4 py-4 font-medium text-slate-900">
                          {item.livro_titulo}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatarData(item.data_emprestimo)}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatarData(item.data_prevista_devolucao)}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatarData(item.data_devolucao)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              item.status === 'devolvido'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="rounded-r-2xl px-4 py-4 text-slate-700">
                          {item.observacoes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhum histórico de biblioteca encontrado.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}