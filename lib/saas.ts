import { createTenantClient as createClient, getMunicipioId } from '@/lib/supabase/tenant-server'
import { createAdminClient } from '@/lib/supabase/admin'

export const MODULOS_SISTEMA = [
  'centro-cultural',
  'museu',
  'casa-artesao',
  'banda-municipal',
  'turismo',
  'administrativo',
  'projetos-captacao',
  'almoxarifado',
] as const

export type ModuloSistema = (typeof MODULOS_SISTEMA)[number]

export type PlanoMunicipio = {
  id: string | null
  nome: string
  slug: string
  limiteUsuarios: number | null
  limiteModulos: number | null
  statusAssinatura: string
  periodoTesteAte: string | null
}

export type UsoUsuariosMunicipio = {
  limiteUsuarios: number | null
  usuariosAtivos: number
  podeAdicionar: boolean
}

export type UsoModulosMunicipio = {
  limiteModulos: number | null
  modulosAtivos: number
  podeAtivar: boolean
}

function moduloValido(modulo: string): modulo is ModuloSistema {
  return MODULOS_SISTEMA.includes(modulo as ModuloSistema)
}

function planoLegado(): PlanoMunicipio {
  return {
    id: null,
    nome: 'Legado',
    slug: 'legado',
    limiteUsuarios: null,
    limiteModulos: null,
    statusAssinatura: 'ativa',
    periodoTesteAte: null,
  }
}

export async function getPlanoMunicipioAtual(): Promise<PlanoMunicipio> {
  const municipioId = getMunicipioId()

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('municipio_assinaturas')
    .select(`
      status,
      periodo_teste_ate,
      planos:saas_planos!municipio_assinaturas_plano_id_fkey (
        id,
        nome,
        slug,
        limite_usuarios,
        limite_modulos
      )
    `)
    .eq('municipio_id', municipioId)
    .eq('status', 'ativa')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return planoLegado()

  const planoRelacao = Array.isArray(data.planos)
    ? data.planos[0]
    : data.planos

  if (!planoRelacao) return planoLegado()

  return {
    id: planoRelacao.id,
    nome: planoRelacao.nome,
    slug: planoRelacao.slug,
    limiteUsuarios: planoRelacao.limite_usuarios,
    limiteModulos: planoRelacao.limite_modulos,
    statusAssinatura: data.status,
    periodoTesteAte: data.periodo_teste_ate,
  }
}

export async function getModulosAtivosMunicipioAtual(
  fallback: string[] = [...MODULOS_SISTEMA]
) {
  const municipioId = getMunicipioId()

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('municipio_modulos')
    .select('modulo, ativo')
    .eq('municipio_id', municipioId)

  if (error) return fallback
  if (!data || data.length === 0) return fallback

  return data
    .filter((item) => item.ativo)
    .map((item) => String(item.modulo))
    .filter(moduloValido)
}

export async function getUsoUsuariosMunicipioAtual(): Promise<UsoUsuariosMunicipio> {
  const municipioId = getMunicipioId()
  const plano = await getPlanoMunicipioAtual()

  let supabase: Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createAdminClient>

  try {
    supabase = createAdminClient()
  } catch {
    supabase = await createClient()
  }

  const { count, error } = await supabase
    .from('usuario_municipios')
    .select('id', { count: 'exact', head: true })
    .eq('municipio_id', municipioId)
    .eq('status', 'ativo')

  const usuariosAtivos = error ? 0 : count ?? 0

  return {
    limiteUsuarios: plano.limiteUsuarios,
    usuariosAtivos,
    podeAdicionar:
      plano.limiteUsuarios === null || usuariosAtivos < plano.limiteUsuarios,
  }
}

export async function municipioPodeAdicionarUsuario() {
  const uso = await getUsoUsuariosMunicipioAtual()
  return uso.podeAdicionar
}

export async function getUsoModulosMunicipioAtual(): Promise<UsoModulosMunicipio> {
  const municipioId = getMunicipioId()
  const plano = await getPlanoMunicipioAtual()

  const supabase = await createClient()

  const { count, error } = await supabase
    .from('municipio_modulos')
    .select('id', { count: 'exact', head: true })
    .eq('municipio_id', municipioId)
    .eq('ativo', true)

  const modulosAtivos = error ? 0 : count ?? 0

  return {
    limiteModulos: plano.limiteModulos,
    modulosAtivos,
    podeAtivar:
      plano.limiteModulos === null || modulosAtivos < plano.limiteModulos,
  }
}

export async function municipioPodeAtivarModulo() {
  const uso = await getUsoModulosMunicipioAtual()
  return uso.podeAtivar
}

export async function getMensagemLimiteUsuarios() {
  const uso = await getUsoUsuariosMunicipioAtual()

  if (uso.podeAdicionar) return null

  return `Limite de usuários atingido para o plano atual (${uso.usuariosAtivos}/${uso.limiteUsuarios}).`
}

export async function getMensagemLimiteUsuariosParaVinculo(usuarioId?: string) {
  const municipioId = getMunicipioId()
  if (!usuarioId) return await getMensagemLimiteUsuarios()

  const admin = createAdminClient()

  const { data: vinculoExistente } = await admin
    .from('usuario_municipios')
    .select('id')
    .eq('usuario_id', usuarioId)
    .eq('municipio_id', municipioId)
    .maybeSingle()

  if (vinculoExistente) return null

  return await getMensagemLimiteUsuarios()
}

export async function vincularUsuarioAoMunicipioAtual(
  usuarioId: string,
  papel = 'operador'
) {
  const municipioId = getMunicipioId()

  const admin = createAdminClient()

  const { error } = await admin.from('usuario_municipios').upsert(
    {
      usuario_id: usuarioId,
      municipio_id: municipioId,
      papel,
      status: 'ativo',
    },
    { onConflict: 'municipio_id,usuario_id' }
  )

  if (error) {
    throw new Error(error.message)
  }
}
