import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const MUNICIPIO_MINEIROS_ID = '30bbd150-57d9-4375-9c09-d9303c7a54c6'

const tabelasComMunicipio = new Set([
  'pessoas',
  'alunos',
  'aluno_matriculas',
  'aluno_biometrias',
  'modalidades',
  'professores',
  'aulas',
  'aula_professores',
  'modalidade_professores',
  'frequencias',
  'visitantes',
  'visitante_visitas',
  'agenda_eventos',
  'biblioteca_leitores',
  'biblioteca_emprestimos',
  'usuario_municipios',
  'municipio_assinaturas',
  'municipio_modulos',
  'casa_artesao_artesaos',
  'casa_artesao_produtos',
  'casa_artesao_vendas',
  'casa_artesao_venda_itens',
  'casa_artesao_estoque_movimentacoes',
  'casa_artesao_fechamentos',
  'casa_artesao_configuracoes',
  'museu_acervo',
  'museu_categorias',
  'museu_movimentacoes',
  'museu_visitantes',
  'banda_municipal_musicos',
  'banda_municipal_instrumentos',
  'banda_municipal_ensaios',
  'banda_municipal_ensaio_presencas',
  'banda_municipal_apresentacoes',
  'banda_municipal_apresentacao_musicos',
  'banda_municipal_apresentacao_participantes',
  'banda_municipal_presencas',
  'turismo_pontos',
  'turismo_demandas',
  'turismo_visitantes',
  'projetos_captacao_projetos',
  'projetos_captacao_fontes',
  'projetos_captacao_oportunidades',
  'projetos_captacao_analises',
  'projetos_captacao_matches',
  'captacao_projetos',
  'captacao_fontes',
  'captacao_oportunidades',
  'captacao_analises',
  'captacao_matching',
  'captacao_radar_fontes',
  'captacao_radar_capturas',
  'captacao_ia_historico',
  'contatos',
  'comunicacoes',
  'administrativo_logs',
  'auditoria_logs',
  'administrativo_usuarios',
  'administrativo_permissoes',
  'administrativo_acessos',
  'administrativo_configuracoes',
  'almoxarifado_categorias',
  'almoxarifado_produtos',
  'almoxarifado_movimentacoes',
])

type Registro = Record<string, unknown>

export function getMunicipioId(): string {
  /*
   * Modo single-tenant: Mineiros e o unico municipio ativo do sistema.
   * Toda operacao protegida deve usar este UUID fixo.
   */
  return MUNICIPIO_MINEIROS_ID
}

export function exigirMunicipioParaTabela(tabela: string): string {
  const municipioId = getMunicipioId()

  if (!municipioId) {
    throw new Error(
      `Consulta bloqueada: a tabela "${tabela}" exige municipio_id valido.`
    )
  }

  return municipioId
}

function tabelaExigeMunicipio(tabela: string) {
  return tabelasComMunicipio.has(tabela)
}

function incluirMunicipioNoRegistro<T extends Registro>(
  registro: T,
  municipioId: string
) {
  return {
    ...registro,
    municipio_id: municipioId,
  }
}

function incluirMunicipioNoPayload(payload: unknown, municipioId: string) {
  if (Array.isArray(payload)) {
    return payload.map((item) =>
      item && typeof item === 'object'
        ? incluirMunicipioNoRegistro(item as Registro, municipioId)
        : item
    )
  }

  if (payload && typeof payload === 'object') {
    return incluirMunicipioNoRegistro(payload as Registro, municipioId)
  }

  return payload
}

function aplicarFiltroMunicipio(query: any, tabela: string) {
  const municipioId = exigirMunicipioParaTabela(tabela)
  return query.eq('municipio_id', municipioId)
}

function protegerTabela(builder: any, tabela: string) {
  if (!tabelaExigeMunicipio(tabela)) return builder

  return new Proxy(builder, {
    get(target, prop, receiver) {
      if (prop === 'select') {
        return (...args: unknown[]) =>
          aplicarFiltroMunicipio(target.select(...args), tabela)
      }

      if (prop === 'update') {
        return (payload: unknown, ...args: unknown[]) => {
          const municipioId = exigirMunicipioParaTabela(tabela)
          return aplicarFiltroMunicipio(
            target.update(incluirMunicipioNoPayload(payload, municipioId), ...args),
            tabela
          )
        }
      }

      if (prop === 'delete') {
        return (...args: unknown[]) =>
          aplicarFiltroMunicipio(target.delete(...args), tabela)
      }

      if (prop === 'insert') {
        return (payload: unknown, ...args: unknown[]) => {
          const municipioId = exigirMunicipioParaTabela(tabela)
          return target.insert(incluirMunicipioNoPayload(payload, municipioId), ...args)
        }
      }

      if (prop === 'upsert') {
        return (payload: unknown, ...args: unknown[]) => {
          const municipioId = exigirMunicipioParaTabela(tabela)
          return target.upsert(incluirMunicipioNoPayload(payload, municipioId), ...args)
        }
      }

      return Reflect.get(target, prop, receiver)
    },
  })
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {}
        },
      },
    }
  )
}

export async function createTenantClient() {
  const supabase = await createClient()

  return new Proxy(supabase, {
    get(target, prop, receiver) {
      if (prop === 'from') {
        return (tabela: string) => protegerTabela(target.from(tabela), tabela)
      }

      return Reflect.get(target, prop, receiver)
    },
  })
}
