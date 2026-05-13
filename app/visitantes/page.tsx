import { ModuloCentroCulturalNav } from '@/components/modulo-centro-cultural-nav'
import { PageEmptyState, PageList, PageShell } from '@/components/page-shell'
import { FormMessage } from '@/components/form'
import { VisitanteForm } from '@/components/visitante-form'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { exigirPermissaoPagina } from '@/lib/seguranca-paginas'
import { criarVisitante, encerrarVisitante } from './actions'

type Visitante = {
  id: string
  nome: string
  telefone: string | null
  data_visita: string | null
  horario_entrada: string | null
  horario_saida: string | null
  status: string | null
  destino: string | null
  motivo: string | null
  observacoes: string | null
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

function getDestinoLabel(destino: string | null | undefined) {
  return destino === 'museu' ? 'Museu' : 'Centro Cultural'
}

function getHojeBrasil() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export default async function VisitantesPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
  }>
}) {
  await exigirPermissaoPagina('Centro Cultural', 'Visitantes', 'visualizar')

  const params = await searchParams
  const hoje = getHojeBrasil()
  const supabase = await createClient()

  const { data: visitantesData, error } = await supabase
    .from('visitantes')
    .select(`
      id,
      nome,
      telefone,
      data_visita,
      horario_entrada,
      horario_saida,
      status,
      destino,
      motivo,
      observacoes
    `)
    .eq('status', 'ativo')
    .order('data_visita', { ascending: false })
    .order('horario_entrada', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const visitantes = (visitantesData ?? []) as Visitante[]
  const visitantesHoje = visitantes.filter((visitante) => visitante.data_visita === hoje)

  return (
    <PageShell
      nav={<ModuloCentroCulturalNav currentPath="/visitantes" />}
      title="Visitantes"
      subtitle="Registre entradas, acompanhe visitantes ativos e encerre visitas em andamento."
      primaryAction={{ label: 'Relatório mensal', href: '/visitantes/relatorios' }}
    >
      {params.message && <FormMessage>{params.message}</FormMessage>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_1fr]">
        <section className="ui-card p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Registrar entrada</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cadastro rápido para recepção do Centro Cultural e Museu.
            </p>
          </div>

          <VisitanteForm action={criarVisitante} />
        </section>

        <PageList
          title="Visitantes ativos"
          subtitle="Visitas em andamento registradas pela recepção."
          meta={
            <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              {visitantesHoje.length} hoje
            </div>
          }
        >
          {visitantes.length > 0 ? (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="px-4 py-3 text-left">Visitante</th>
                    <th className="px-4 py-3 text-left">Telefone</th>
                    <th className="px-4 py-3 text-left">Destino</th>
                    <th className="px-4 py-3 text-left">Motivo</th>
                    <th className="px-4 py-3 text-left">Entrada</th>
                    <th className="px-4 py-3 text-left">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {visitantes.map((visitante) => (
                    <tr key={visitante.id} className="border-b">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {visitante.nome}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatarTelefone(visitante.telefone)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {getDestinoLabel(visitante.destino)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {visitante.motivo ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatarData(visitante.data_visita)} às{' '}
                        {visitante.horario_entrada ?? '-'}
                      </td>
                      <td className="px-4 py-3">
                        <form action={encerrarVisitante}>
                          <input type="hidden" name="id" value={visitante.id} />
                          <button type="submit" className="btn-secondary py-2">
                            Encerrar visita
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <PageEmptyState>Nenhum visitante ativo no momento.</PageEmptyState>
          )}
        </PageList>
      </div>
    </PageShell>
  )
}
