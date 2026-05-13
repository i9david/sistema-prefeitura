import { redirect } from 'next/navigation'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { Cake, MessageCircle, Send, Users } from 'lucide-react'
import { ModuloAdministrativoNav } from '@/components/modulo-administrativo-nav'
import { ModuleCard, ModuleMetricCard } from '@/components/module/module-card'
import { ModuleGrid } from '@/components/module/module-grid'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { registrarComunicacao } from './actions'

type AlunoRaw = {
  id: string
  nome: string | null
  telefone: string | null
  data_nascimento: string | null
  status: string | null
}

type MatriculaRaw = {
  aluno_id: string | null
  aula_id: string | null
  status: string | null
  data_inicio: string | null
  data_fim: string | null
}

type AulaRaw = {
  id: string
  nome: string | null
  modalidade_id: string | null
}

type ModalidadeRaw = {
  id: string
  nome: string | null
}

type AulaProfessorRaw = {
  aula_id: string | null
  professor_id: string | null
}

type ProfessorRaw = {
  id: string
  nome: string | null
}

type Contato = {
  id: string
  nome: string
  telefone: string
  data_nascimento: string | null
  modalidades: string[]
  aulas: string[]
  professores: string[]
}

function limparTelefone(valor: string | null | undefined) {
  return String(valor ?? '').replace(/\D/g, '')
}

function formatarTelefone(valor: string | null | undefined) {
  const numeros = limparTelefone(valor).slice(0, 11)

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

function getHojeBrasil() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function ehAniversarianteHoje(dataNascimento: string | null) {
  if (!dataNascimento) return false

  const hoje = getHojeBrasil()
  const [, mesHoje, diaHoje] = hoje.split('-')
  const partes = dataNascimento.slice(0, 10).split('-')

  if (partes.length !== 3) return false

  const [, mesNascimento, diaNascimento] = partes

  return mesHoje === mesNascimento && diaHoje === diaNascimento
}

function montarMensagemWhatsApp(nome: string, mensagem: string) {
  const texto = mensagem.replaceAll('{nome}', nome)
  return encodeURIComponent(texto)
}

function montarLinkWhatsApp(telefone: string, nome: string, mensagem: string) {
  const numeros = limparTelefone(telefone)

  if (!numeros) return '#'

  const telefoneComPais = numeros.startsWith('55') ? numeros : `55${numeros}`
  const texto = montarMensagemWhatsApp(nome, mensagem)

  return `https://wa.me/${telefoneComPais}?text=${texto}`
}

function formatarLista(valores: string[]) {
  const lista = Array.from(new Set(valores.filter(Boolean))).sort()
  return lista.length > 0 ? lista.join(', ') : 'Não informado'
}

function valoresUnicos(contatos: Contato[], campo: keyof Pick<Contato, 'modalidades' | 'aulas' | 'professores'>) {
  return Array.from(new Set(contatos.flatMap((item) => item[campo]).filter(Boolean))).sort()
}

function matriculaAtivaNoPeriodo(matricula: MatriculaRaw, dataReferencia: string) {
  if (matricula.status !== 'ativo') return false
  if (matricula.data_inicio && matricula.data_inicio > dataReferencia) return false
  if (matricula.data_fim && matricula.data_fim < dataReferencia) return false
  return Boolean(matricula.aluno_id && matricula.aula_id)
}

export default async function AdministrativoComunicacaoPage({
  searchParams,
}: {
  searchParams: Promise<{
    mensagem?: string
    filtro?: string
    modalidade?: string
    aula?: string
    professor?: string
    message?: string
  }>
}) {
  const params = await searchParams

  const mensagem =
    params.mensagem?.trim() ||
    'Olá, {nome}! A Secretaria Municipal de Cultura e Turismo de Mineiros tem uma informação importante para você.'

  const filtro = params.filtro?.trim() || 'todos'
  const modalidadeFiltro = params.modalidade?.trim() || ''
  const aulaFiltro = params.aula?.trim() || ''
  const professorFiltro = params.professor?.trim() || ''

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const dataReferencia = getHojeBrasil()

  const [
    { data: alunosData, error: alunosError },
    { data: matriculasData, error: matriculasError },
    { data: aulasData, error: aulasError },
    { data: modalidadesData, error: modalidadesError },
    { data: aulaProfessoresData, error: aulaProfessoresError },
    { data: professoresData, error: professoresError },
  ] = await Promise.all([
    supabase
      .from('alunos')
      .select('id, nome, telefone, data_nascimento, status')
      .order('nome', { ascending: true }),
    supabase
      .from('aluno_matriculas')
      .select('aluno_id, aula_id, status, data_inicio, data_fim'),
    supabase
      .from('aulas')
      .select('id, nome, modalidade_id'),
    supabase
      .from('modalidades')
      .select('id, nome'),
    supabase
      .from('aula_professores')
      .select('aula_id, professor_id'),
    supabase
      .from('professores')
      .select('id, nome'),
  ])

  const erro =
    alunosError?.message ||
    matriculasError?.message ||
    aulasError?.message ||
    modalidadesError?.message ||
    aulaProfessoresError?.message ||
    professoresError?.message ||
    ''

  const alunos = (alunosData ?? []) as AlunoRaw[]
  const matriculas = ((matriculasData ?? []) as MatriculaRaw[]).filter((item) =>
    matriculaAtivaNoPeriodo(item, dataReferencia)
  )
  const aulas = (aulasData ?? []) as AulaRaw[]
  const modalidades = (modalidadesData ?? []) as ModalidadeRaw[]
  const aulaProfessores = (aulaProfessoresData ?? []) as AulaProfessorRaw[]
  const professores = (professoresData ?? []) as ProfessorRaw[]

  const aulasPorId = new Map(aulas.map((aula) => [aula.id, aula]))
  const modalidadesPorId = new Map(modalidades.map((modalidade) => [modalidade.id, modalidade]))
  const professoresPorId = new Map(professores.map((professor) => [professor.id, professor]))
  const matriculasPorAluno = new Map<string, MatriculaRaw[]>()
  const professoresPorAula = new Map<string, string[]>()

  for (const matricula of matriculas) {
    if (!matricula.aluno_id) continue
    const lista = matriculasPorAluno.get(matricula.aluno_id) ?? []
    lista.push(matricula)
    matriculasPorAluno.set(matricula.aluno_id, lista)
  }

  for (const vinculo of aulaProfessores) {
    if (!vinculo.aula_id || !vinculo.professor_id) continue
    const professor = professoresPorId.get(vinculo.professor_id)
    if (!professor?.nome) continue

    const lista = professoresPorAula.get(vinculo.aula_id) ?? []
    lista.push(professor.nome)
    professoresPorAula.set(vinculo.aula_id, lista)
  }

  const contatosBase = alunos
    .filter((item) => item.status !== 'inativo')
    .map((aluno) => {
      const matriculasAluno = matriculasPorAluno.get(aluno.id) ?? []
      const aulasAluno = matriculasAluno
        .map((matricula) => (matricula.aula_id ? aulasPorId.get(matricula.aula_id) : null))
        .filter((aula): aula is AulaRaw => Boolean(aula))

      return {
        id: aluno.id,
        nome: aluno.nome || 'Sem nome',
        telefone: aluno.telefone || '',
        data_nascimento: aluno.data_nascimento || null,
        modalidades: aulasAluno
          .map((aula) => (aula.modalidade_id ? modalidadesPorId.get(aula.modalidade_id)?.nome : null))
          .filter((nome): nome is string => Boolean(nome)),
        aulas: aulasAluno
          .map((aula) => aula.nome)
          .filter((nome): nome is string => Boolean(nome)),
        professores: aulasAluno.flatMap((aula) => professoresPorAula.get(aula.id) ?? []),
      }
    })
    .filter((item) => limparTelefone(item.telefone).length >= 10)

  const aniversariantes = contatosBase.filter((item) =>
    ehAniversarianteHoje(item.data_nascimento)
  )

  let contatosFiltrados = contatosBase

  if (filtro === 'aniversariantes') {
    contatosFiltrados = aniversariantes
  }

  if (modalidadeFiltro) {
    contatosFiltrados = contatosFiltrados.filter((item) =>
      item.modalidades.includes(modalidadeFiltro)
    )
  }

  if (aulaFiltro) {
    contatosFiltrados = contatosFiltrados.filter((item) =>
      item.aulas.includes(aulaFiltro)
    )
  }

  if (professorFiltro) {
    contatosFiltrados = contatosFiltrados.filter((item) =>
      item.professores.includes(professorFiltro)
    )
  }

  const modalidadesFiltro = valoresUnicos(contatosBase, 'modalidades')
  const aulasFiltro = valoresUnicos(contatosBase, 'aulas')
  const professoresFiltro = valoresUnicos(contatosBase, 'professores')

  const mensagemAniversario =
    'Olá, {nome}! A Secretaria Municipal de Cultura e Turismo de Mineiros deseja a você um feliz aniversário, com muita saúde, alegria e realizações. Que seu dia seja muito especial!'

  return (
    <ModuleLayout sidebar={<ModuloAdministrativoNav currentPath="/administrativo/comunicacao" />}>
      <ModuleHeader
        title="Comunicação"
        eyebrow="Operação"
        description="Envie mensagens para alunos com telefone cadastrado, usando filtros por matrícula ativa."
        icon={MessageCircle}
        accent="blue"
        context="Relacionamento institucional"
      />

          {(params.message || erro) && (
            <ModuleCard>
              <p className={`text-sm ${erro ? 'text-red-700' : 'text-slate-700'}`}>
                {erro || params.message}
              </p>
            </ModuleCard>
          )}

          <ModuleGrid columns={3}>
            <ModuleMetricCard label="Contatos encontrados" value={contatosFiltrados.length} icon={Users} accent="blue" />
            <ModuleMetricCard label="Aniversariantes hoje" value={aniversariantes.length} icon={Cake} accent="blue" />
            <ModuleMetricCard label="Base com WhatsApp" value={contatosBase.length} icon={Send} accent="blue" />
          </ModuleGrid>

          <ModuleCard>
            <form method="get" className="grid gap-3 xl:grid-cols-[1fr_180px_1fr_1fr_1fr_150px]">
              <input
                name="mensagem"
                defaultValue={mensagem}
                placeholder="Mensagem com {nome}"
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />

              <select
                name="filtro"
                defaultValue={filtro}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="todos">Todos</option>
                <option value="aniversariantes">Aniversariantes</option>
              </select>

              <select
                name="modalidade"
                defaultValue={modalidadeFiltro}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Todas modalidades</option>
                {modalidadesFiltro.map((modalidade) => (
                  <option key={modalidade} value={modalidade}>
                    {modalidade}
                  </option>
                ))}
              </select>

              <select
                name="aula"
                defaultValue={aulaFiltro}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Todas aulas</option>
                {aulasFiltro.map((aula) => (
                  <option key={aula} value={aula}>
                    {aula}
                  </option>
                ))}
              </select>

              <select
                name="professor"
                defaultValue={professorFiltro}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Todos professores</option>
                {professoresFiltro.map((professor) => (
                  <option key={professor} value={professor}>
                    {professor}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Filtrar
              </button>
            </form>
          </ModuleCard>

          <ModuleCard>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Mensagem selecionada
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Use {'{nome}'} para personalizar a mensagem com o nome de cada aluno.
                </p>
              </div>

              <form action={registrarComunicacao}>
                <input type="hidden" name="tipo" value={filtro === 'aniversariantes' ? 'aniversario' : 'comunicado'} />
                <input type="hidden" name="mensagem" value={mensagem} />
                <input type="hidden" name="total_contatos" value={contatosFiltrados.length} />
                <input type="hidden" name="filtro" value={filtro} />
                <input type="hidden" name="modalidade" value={modalidadeFiltro} />
                <input type="hidden" name="aula" value={aulaFiltro} />
                <input type="hidden" name="professor" value={professorFiltro} />
                <button
                  type="submit"
                  className="rounded-2xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
                >
                  Registrar comunicação
                </button>
              </form>
            </div>

            <textarea
              readOnly
              value={filtro === 'aniversariantes' ? mensagemAniversario : mensagem}
              className="mt-5 min-h-32 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            />
          </ModuleCard>

          <ModuleCard>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Lista de contatos
            </h2>

            {contatosFiltrados.length > 0 ? (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Nome</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Telefone</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Modalidade</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Aula</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Professor</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contatosFiltrados.map((contato) => (
                      <tr key={contato.id} className="bg-slate-50">
                        <td className="rounded-l-2xl px-4 py-4 font-medium text-slate-900">
                          {contato.nome}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatarTelefone(contato.telefone)}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatarLista(contato.modalidades)}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatarLista(contato.aulas)}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatarLista(contato.professores)}
                        </td>
                        <td className="rounded-r-2xl px-4 py-4">
                          <a
                            href={montarLinkWhatsApp(
                              contato.telefone,
                              contato.nome,
                              filtro === 'aniversariantes' ? mensagemAniversario : mensagem
                            )}
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
              <p className="mt-4 text-sm text-slate-600">
                Nenhum contato encontrado para os filtros selecionados.
              </p>
            )}
          </ModuleCard>
    </ModuleLayout>
  )
}
