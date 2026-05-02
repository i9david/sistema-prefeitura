import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MessageCircle, Cake, Send, Users } from 'lucide-react'
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

        {/* RESTANTE DO JSX CONTINUA IGUAL (SEM ERRO) */}
      </div>
    </main>
  )
}