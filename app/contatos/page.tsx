import { redirect } from 'next/navigation'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuloCentroCulturalNav } from '@/components/modulo-centro-cultural-nav'

export const revalidate = 300 // Revalidar cache a cada 5 minutos

type Relacao<T> = T | T[] | null

type Modalidade = {
  id: string
  nome: string
}

type Aula = {
  id: string
  nome: string
  dia_semana: string | null
  horario_inicio: string | null
  horario_fim: string | null
  modalidades: Relacao<Modalidade>
}

type Matricula = {
  id: string
  status: string
  data_inicio: string | null
  data_fim: string | null
  aulas: Relacao<Aula>
}

type Aluno = {
  id: string
  nome: string
  telefone: string
  data_nascimento: string | null
  status: string
  aluno_matriculas: Matricula[] | null
}

type Visitante = {
  id: string
  nome: string
  telefone: string
  data_nascimento: string | null
  data_visita: string
}

function somenteNumeros(valor: string | null | undefined) {
  return String(valor ?? '').replace(/\D/g, '')
}

function formatarTelefone(valor: string | null | undefined) {
  const numeros = somenteNumeros(valor).slice(0, 11)

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

function gerarLinkWhatsApp(telefone: string | null | undefined, mensagem?: string) {
  const numero = somenteNumeros(telefone)
  if (!numero) return '#'

  const numeroComPais = numero.startsWith('55') ? numero : `55${numero}`
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''
  return `https://wa.me/${numeroComPais}${texto}`
}

function extrairMesDia(data: string | null | undefined) {
  if (!data) return { mes: '', dia: '' }

  const partes = data.split('-')
  if (partes.length !== 3) return { mes: '', dia: '' }

  return {
    mes: partes[1],
    dia: partes[2],
  }
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

function sectionTitleClassName() {
  return 'text-2xl font-bold tracking-tight text-slate-900'
}

function normalizarRelacao<T>(relacao: Relacao<T>) {
  if (Array.isArray(relacao)) return relacao[0] ?? null
  return relacao ?? null
}

function getMatriculasAtivas(aluno: Aluno, dataReferencia: string) {
  return (aluno.aluno_matriculas ?? []).filter((matricula) => {
    if (matricula.status !== 'ativo') return false
    if (matricula.data_inicio && matricula.data_inicio > dataReferencia) return false
    if (matricula.data_fim && matricula.data_fim < dataReferencia) return false
    return Boolean(normalizarRelacao(matricula.aulas))
  })
}

function getAula(matricula: Matricula) {
  return normalizarRelacao(matricula.aulas)
}

function getModalidade(aula: Aula | null) {
  return normalizarRelacao(aula?.modalidades ?? null)
}

function getTurmasAluno(aluno: Aluno, dataReferencia: string) {
  return getMatriculasAtivas(aluno, dataReferencia)
    .map((matricula) => getAula(matricula)?.nome)
    .filter(Boolean) as string[]
}

function getModalidadesAluno(aluno: Aluno, dataReferencia: string) {
  return getMatriculasAtivas(aluno, dataReferencia)
    .map((matricula) => getModalidade(getAula(matricula))?.nome)
    .filter(Boolean) as string[]
}

function formatarListaUnica(valores: string[]) {
  const lista = Array.from(new Set(valores)).sort()
  return lista.length > 0 ? lista.join(', ') : '-'
}

export default async function ContatosPage({
  searchParams,
}: {
  searchParams: Promise<{
    busca?: string
    turma?: string
    message?: string
  }>
}) {
  const params = await searchParams
  const busca = params.busca?.trim().toLowerCase() || ''
  const turmaSelecionada = params.turma?.trim() || ''

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const hoje = new Date()
  const dataAtual = hoje.toISOString().slice(0, 10)
  const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0')
  const diaAtual = String(hoje.getDate()).padStart(2, '0')

  const [{ data: alunosData, error: erroAlunos }, { data: visitantesData, error: erroVisitantes }] =
    await Promise.all([
      supabase
        .from('alunos')
        .select(`
          id,
          nome,
          telefone,
          data_nascimento,
          status,
          aluno_matriculas (
            id,
            status,
            data_inicio,
            data_fim,
            aulas:aula_id!aluno_matriculas_aula_id_fkey (
              id,
              nome,
              dia_semana,
              horario_inicio,
              horario_fim,
              modalidades!aulas_modalidade_id_fkey (
                id,
                nome
              )
            )
          )
        `)
        .eq('status', 'ativo')
        .order('nome', { ascending: true }),

      supabase
        .from('visitantes')
        .select('id, nome, telefone, data_nascimento, data_visita')
        .order('nome', { ascending: true }),
    ])

  if (erroAlunos) {
    redirect(`/contatos?message=${encodeURIComponent(erroAlunos.message)}`)
  }

  if (erroVisitantes) {
    redirect(`/contatos?message=${encodeURIComponent(erroVisitantes.message)}`)
  }

  let alunos = (alunosData ?? []) as Aluno[]
  let visitantes = (visitantesData ?? []) as Visitante[]

  const turmas = Array.from(
    new Set(alunos.flatMap((item) => getTurmasAluno(item, dataAtual)))
  ).sort()

  if (busca) {
    alunos = alunos.filter((item) => item.nome.toLowerCase().includes(busca))
    visitantes = visitantes.filter((item) => item.nome.toLowerCase().includes(busca))
  }

  if (turmaSelecionada) {
    alunos = alunos.filter((item) => getTurmasAluno(item, dataAtual).includes(turmaSelecionada))
  }

  const aniversariantesMesAlunos = alunos.filter((aluno) => extrairMesDia(aluno.data_nascimento).mes === mesAtual)
  const aniversariantesMesVisitantes = visitantes.filter(
    (visitante) => extrairMesDia(visitante.data_nascimento).mes === mesAtual
  )

  const aniversariantesHojeAlunos = alunos.filter((aluno) => {
    const { mes, dia } = extrairMesDia(aluno.data_nascimento)
    return mes === mesAtual && dia === diaAtual
  })

  const aniversariantesHojeVisitantes = visitantes.filter((visitante) => {
    const { mes, dia } = extrairMesDia(visitante.data_nascimento)
    return mes === mesAtual && dia === diaAtual
  })

  const totalContatos = alunos.length + visitantes.length
  const totalAniversariantesMes = aniversariantesMesAlunos.length + aniversariantesMesVisitantes.length
  const totalAniversariantesHoje = aniversariantesHojeAlunos.length + aniversariantesHojeVisitantes.length

  const mensagemAniversario =
    'Olá! Passando para desejar um feliz aniversário. Que seu dia seja abençoado, cheio de saúde, alegria e muitas conquistas.'

  const mensagemEvento =
    'Olá! Estamos passando para convidar você para participar do nosso próximo evento no Centro Cultural. Será um momento especial e sua presença será muito importante para nós.'

  const mensagemAvisoGeral =
    'Olá! Este é um comunicado do Centro Cultural. Em breve teremos novidades, atividades e eventos especiais. Fique atento às nossas atualizações.'

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloCentroCulturalNav currentPath="/contatos" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Comunicação
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Central de contatos, aniversários e campanhas de relacionamento
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Total de contatos</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {totalContatos}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Aniversariantes do mês</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {totalAniversariantesMes}
              </p>
            </div>

            <div className={cardClassName()}>
              <p className="text-sm font-medium text-slate-500">Aniversariantes de hoje</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {totalAniversariantesHoje}
              </p>
            </div>
          </div>

          <div className={cardClassName()}>
            <form method="get" className="grid gap-4 md:grid-cols-[1fr_280px_140px]">
              <input
                type="text"
                name="busca"
                placeholder="Buscar por nome"
                defaultValue={busca}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <select
                name="turma"
                defaultValue={turmaSelecionada}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Todas as turmas</option>
                {turmas.map((turma) => (
                  <option key={turma} value={turma}>
                    {turma}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Filtrar
              </button>
            </form>

            {params.message && (
              <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {params.message}
              </p>
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className={cardClassName()}>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Mensagem de aniversário
              </h2>
              <textarea
                readOnly
                value={mensagemAniversario}
                className="mt-4 min-h-40 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              />
            </div>

            <div className={cardClassName()}>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Convite para evento
              </h2>
              <textarea
                readOnly
                value={mensagemEvento}
                className="mt-4 min-h-40 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              />
            </div>

            <div className={cardClassName()}>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Aviso geral
              </h2>
              <textarea
                readOnly
                value={mensagemAvisoGeral}
                className="mt-4 min-h-40 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              />
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className={cardClassName()}>
              <h2 className={sectionTitleClassName()}>
                Aniversariantes de hoje • Alunos
              </h2>

              {aniversariantesHojeAlunos.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {aniversariantesHojeAlunos.map((aluno) => (
                    <div key={aluno.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{aluno.nome}</p>
                      <p className="text-sm text-slate-600">{formatarTelefone(aluno.telefone)}</p>
                      <p className="text-sm text-slate-500">
                        {formatarListaUnica(getTurmasAluno(aluno, dataAtual))}
                      </p>
                      <div className="mt-3">
                        <a
                          href={gerarLinkWhatsApp(aluno.telefone, `Olá, ${aluno.nome}! ${mensagemAniversario}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-600">Nenhum aniversariante hoje.</p>
              )}
            </div>

            <div className={cardClassName()}>
              <h2 className={sectionTitleClassName()}>
                Aniversariantes de hoje • Visitantes
              </h2>

              {aniversariantesHojeVisitantes.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {aniversariantesHojeVisitantes.map((visitante) => (
                    <div key={visitante.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{visitante.nome}</p>
                      <p className="text-sm text-slate-600">{formatarTelefone(visitante.telefone)}</p>
                      <div className="mt-3">
                        <a
                          href={gerarLinkWhatsApp(visitante.telefone, `Olá, ${visitante.nome}! ${mensagemAniversario}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-600">Nenhum aniversariante hoje.</p>
              )}
            </div>
          </div>

          <div className={cardClassName()}>
            <h2 className={sectionTitleClassName()}>
              Aniversariantes do mês • Alunos
            </h2>

            {aniversariantesMesAlunos.length > 0 ? (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Nome</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">WhatsApp</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Nascimento</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Turma</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aniversariantesMesAlunos.map((aluno) => (
                      <tr key={aluno.id} className="rounded-2xl bg-slate-50">
                        <td className="rounded-l-2xl px-4 py-4 font-medium text-slate-900">{aluno.nome}</td>
                        <td className="px-4 py-4 text-slate-700">{formatarTelefone(aluno.telefone)}</td>
                        <td className="px-4 py-4 text-slate-700">{aluno.data_nascimento || '-'}</td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatarListaUnica(getTurmasAluno(aluno, dataAtual))}
                        </td>
                        <td className="rounded-r-2xl px-4 py-4">
                          <a
                            href={gerarLinkWhatsApp(aluno.telefone, `Olá, ${aluno.nome}! ${mensagemAniversario}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                          >
                            WhatsApp
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">Nenhum aniversariante neste mês.</p>
            )}
          </div>

          <div className={cardClassName()}>
            <h2 className={sectionTitleClassName()}>
              Contatos de alunos
            </h2>

            {alunos.length > 0 ? (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Nome</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">WhatsApp</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Modalidade</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Turma</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Aniversário</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alunos.map((aluno) => (
                      <tr key={aluno.id} className="bg-slate-50">
                        <td className="rounded-l-2xl px-4 py-4 font-medium text-slate-900">{aluno.nome}</td>
                        <td className="px-4 py-4 text-slate-700">{formatarTelefone(aluno.telefone)}</td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatarListaUnica(getModalidadesAluno(aluno, dataAtual))}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatarListaUnica(getTurmasAluno(aluno, dataAtual))}
                        </td>
                        <td className="px-4 py-4 text-slate-700">{aluno.data_nascimento || '-'}</td>
                        <td className="rounded-r-2xl px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={gerarLinkWhatsApp(aluno.telefone)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                            >
                              WhatsApp
                            </a>
                            <a
                              href={gerarLinkWhatsApp(aluno.telefone, `Olá, ${aluno.nome}! ${mensagemEvento}`)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                              Evento
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">Nenhum aluno encontrado.</p>
            )}
          </div>

          <div className={cardClassName()}>
            <h2 className={sectionTitleClassName()}>
              Contatos de visitantes
            </h2>

            {visitantes.length > 0 ? (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Nome</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">WhatsApp</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Nascimento</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Última visita</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitantes.map((visitante) => (
                      <tr key={visitante.id} className="bg-slate-50">
                        <td className="rounded-l-2xl px-4 py-4 font-medium text-slate-900">{visitante.nome}</td>
                        <td className="px-4 py-4 text-slate-700">{formatarTelefone(visitante.telefone)}</td>
                        <td className="px-4 py-4 text-slate-700">{visitante.data_nascimento || '-'}</td>
                        <td className="px-4 py-4 text-slate-700">{visitante.data_visita}</td>
                        <td className="rounded-r-2xl px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={gerarLinkWhatsApp(visitante.telefone)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                            >
                              WhatsApp
                            </a>
                            <a
                              href={gerarLinkWhatsApp(visitante.telefone, `Olá, ${visitante.nome}! ${mensagemEvento}`)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                              Evento
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">Nenhum visitante encontrado.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
