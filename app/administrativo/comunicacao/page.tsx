import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"
import { MessageCircle, Cake, Send, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ModuloAdministrativoNav } from '@/components/modulo-administrativo-nav'

type AlunoRaw = {
  id: string
  nome: string | null
  telefone: string | null
  data_nascimento: string | null
  status: string | null
  modalidade: string | null
  aula: string | null
  professor: string | null
}

type Contato = {
  id: string
  nome: string
  telefone: string
  data_nascimento: string | null
  modalidade: string
  aula: string
  professor: string
}

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
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

function normalizarContato(item: AlunoRaw): Contato {
  return {
    id: item.id,
    nome: item.nome || 'Sem nome',
    telefone: item.telefone || '',
    data_nascimento: item.data_nascimento || null,
    modalidade: item.modalidade || 'Não informado',
    aula: item.aula || 'Não informado',
    professor: item.professor || 'Não informado',
  }
}

function valoresUnicos(contatos: Contato[], campo: keyof Pick<Contato, 'modalidade' | 'aula' | 'professor'>) {
  return Array.from(new Set(contatos.map((item) => item[campo]).filter(Boolean))).sort()
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

  const { data, error } = await supabase
    .from('alunos')
    .select(`
      id,
      nome,
      telefone,
      data_nascimento,
      status,
      modalidade,
      aula,
      professor
    `)
    .order('nome', { ascending: true })

  const erro = error?.message || ''

  const contatosBase = ((data ?? []) as AlunoRaw[])
    .filter((item) => item.status !== 'inativo')
    .map(normalizarContato)
    .filter((item) => limparTelefone(item.telefone).length >= 10)

  const aniversariantes = contatosBase.filter((item) =>
    ehAniversarianteHoje(item.data_nascimento)
  )

  let contatosFiltrados = contatosBase

  if (filtro === 'aniversariantes') {
    contatosFiltrados = aniversariantes
  }

  if (modalidadeFiltro) {
    contatosFiltrados = contatosFiltrados.filter(
      (item) => item.modalidade === modalidadeFiltro
    )
  }

  if (aulaFiltro) {
    contatosFiltrados = contatosFiltrados.filter(
      (item) => item.aula === aulaFiltro
    )
  }

  if (professorFiltro) {
    contatosFiltrados = contatosFiltrados.filter(
      (item) => item.professor === professorFiltro
    )
  }

  const modalidades = valoresUnicos(contatosBase, 'modalidade')
  const aulas = valoresUnicos(contatosBase, 'aula')
  const professores = valoresUnicos(contatosBase, 'professor')

  const mensagemAniversario =
    'Olá, {nome}! A Secretaria Municipal de Cultura e Turismo de Mineiros deseja a você um feliz aniversário, com muita saúde, alegria e realizações. Que seu dia seja muito especial!'

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <ModuloAdministrativoNav currentPath="/administrativo/comunicacao" />

        <section className="space-y-6">
          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Comunicação
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Envie comunicados, informações, convites e mensagens de aniversário via WhatsApp.
                </p>
              </div>

              <div className="rounded-3xl bg-violet-50 p-4 text-violet-700">
                <MessageCircle size={32} />
              </div>
            </div>
          </div>

          {erro && (
            <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-red-700">
              <h2 className="text-lg font-bold">Erro ao carregar contatos</h2>
              <p className="mt-2 text-sm">{erro}</p>
              <p className="mt-2 text-sm">
                Confira se a tabela alunos possui as colunas: nome, telefone, data_nascimento, status, modalidade, aula e professor.
              </p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className={cardClassName()}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Contatos ativos</p>
                <Users size={20} className="text-violet-600" />
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {contatosBase.length}
              </p>
            </div>

            <div className={cardClassName()}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Aniversariantes hoje</p>
                <Cake size={20} className="text-pink-600" />
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {aniversariantes.length}
              </p>
            </div>

            <div className={cardClassName()}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Selecionados para envio</p>
                <Send size={20} className="text-green-600" />
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {contatosFiltrados.length}
              </p>
            </div>
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Aniversariantes do dia
            </h2>

            {aniversariantes.length > 0 ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {aniversariantes.map((contato) => (
                  <div
                    key={contato.id}
                    className="rounded-3xl border border-pink-100 bg-pink-50 p-5"
                  >
                    <h3 className="text-lg font-bold text-slate-900">
                      {contato.nome}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatarTelefone(contato.telefone)}
                    </p>

                    <a
                      href={montarLinkWhatsApp(contato.telefone, contato.nome, mensagemAniversario)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      Enviar parabéns no WhatsApp
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Nenhum aniversariante encontrado hoje.
              </p>
            )}
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Envio de comunicado
            </h2>

            <form method="get" className="mt-5 grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Tipo de seleção
                </label>
                <select
                  name="filtro"
                  defaultValue={filtro}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                >
                  <option value="todos">Todos os contatos</option>
                  <option value="aniversariantes">Somente aniversariantes do dia</option>
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Modalidade
                  </label>
                  <select
                    name="modalidade"
                    defaultValue={modalidadeFiltro}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="">Todas</option>
                    {modalidades.map((modalidade) => (
                      <option key={modalidade} value={modalidade}>
                        {modalidade}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Aula
                  </label>
                  <select
                    name="aula"
                    defaultValue={aulaFiltro}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="">Todas</option>
                    {aulas.map((aula) => (
                      <option key={aula} value={aula}>
                        {aula}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Professor
                  </label>
                  <select
                    name="professor"
                    defaultValue={professorFiltro}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="">Todos</option>
                    {professores.map((professor) => (
                      <option key={professor} value={professor}>
                        {professor}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Mensagem
                </label>
                <textarea
                  name="mensagem"
                  defaultValue={mensagem}
                  className="min-h-[140px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Use {'{nome}'} para personalizar a mensagem com o nome do contato.
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  className="rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Gerar lista de envio
                </button>
              </div>
            </form>
          </div>

          <div className={cardClassName()}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Lista para envio
            </h2>

            {contatosFiltrados.length > 0 ? (
              <div className="mt-5 space-y-3">
                {contatosFiltrados.map((contato) => (
                  <div
                    key={contato.id}
                    className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {contato.nome}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {formatarTelefone(contato.telefone)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Modalidade: {contato.modalidade} • Aula: {contato.aula} • Professor: {contato.professor}
                      </p>
                    </div>

                    <a
                      href={montarLinkWhatsApp(contato.telefone, contato.nome, mensagem)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      Enviar WhatsApp
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Nenhum contato encontrado para os filtros selecionados.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}