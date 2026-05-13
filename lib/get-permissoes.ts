import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'

export type UsuarioInternoPermissao = {
  id: string
  nome: string
  email: string
  nivel: string
  perfil: string | null
  status: string
  auth_user_id: string | null
  professor_id: string | null
}

export type PermissaoUsuario = {
  id: string
  usuario_id: string
  modulo: string
  area: string | null
  recurso?: string | null
  pode_visualizar: boolean
  pode_criar: boolean
  pode_editar: boolean
  pode_excluir: boolean
}

type AcessoAdministrativo = {
  id: string
  usuario_id: string
  modulo: string
  pode_visualizar: boolean
  pode_criar: boolean
  pode_editar: boolean
  pode_excluir: boolean
}

const areasPorModulo: Record<string, { modulo: string; areas: string[] }> = {
  'centro-cultural': {
    modulo: 'Centro Cultural',
    areas: [
      'Alunos',
      'Aulas',
      'Professores',
      'Modalidades',
      'Frequência',
      'Visitantes',
    ],
  },
  museu: {
    modulo: 'Museu',
    areas: ['Acervo', 'Categorias', 'Movimentações', 'Visitantes'],
  },
  'casa-artesao': {
    modulo: 'Casa do Artesão',
    areas: ['Artesãos', 'Produtos', 'Estoque', 'Caixa', 'Fechamentos', 'Relatórios'],
  },
  'banda-municipal': {
    modulo: 'Banda Municipal',
    areas: ['Músicos', 'Instrumentos', 'Ensaios', 'Apresentações', 'Presenças', 'Relatórios'],
  },
  turismo: {
    modulo: 'Turismo',
    areas: ['Dashboard', 'Pontos', 'Demandas', 'Visitantes', 'Relatórios'],
  },
  'projetos-captacao': {
    modulo: 'Projetos de Captação',
    areas: ['Projetos', 'Fontes', 'Oportunidades', 'Análises', 'Matching', 'Radar'],
  },
  almoxarifado: {
    modulo: 'Almoxarifado',
    areas: ['Categorias', 'Produtos', 'Movimentações', 'Relatórios'],
  },
  administrativo: {
    modulo: 'Administrativo',
    areas: [
      'Usuarios e Acessos',
      'Usuários e Acessos',
      'Comunicação',
      'Configuracoes do Sistema',
      'Configurações do Sistema',
      'Agenda Institucional',
      'Relatorios Gerais',
      'Relatórios Gerais',
    ],
  },
}

function expandirAcessosAdministrativos(
  acessos: AcessoAdministrativo[] = []
): PermissaoUsuario[] {
  return acessos.flatMap((acesso) => {
    const definicao = areasPorModulo[acesso.modulo]

    if (!definicao) return []

    return definicao.areas.map((area) => ({
      id: `${acesso.id}:${area}`,
      usuario_id: acesso.usuario_id,
      modulo: definicao.modulo,
      area,
      recurso: area,
      pode_visualizar: acesso.pode_visualizar,
      pode_criar: acesso.pode_criar,
      pode_editar: acesso.pode_editar,
      pode_excluir: acesso.pode_excluir,
    }))
  })
}

export async function getContextoPermissoes() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      authUser: null,
      usuarioInterno: null,
      permissoes: [],
    }
  }

  const { data: usuarioPorAuth } = await supabase
    .from('administrativo_usuarios')
    .select('id, nome, email, nivel, perfil, status, auth_user_id, professor_id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  let usuarioInterno = usuarioPorAuth

  if (!usuarioInterno && user.email) {
    const { data: usuarioPorEmail } = await supabase
      .from('administrativo_usuarios')
      .select('id, nome, email, nivel, perfil, status, auth_user_id, professor_id')
      .eq('email', user.email.toLowerCase())
      .maybeSingle()

    usuarioInterno = usuarioPorEmail
  }

  if (!usuarioInterno) {
    return {
      authUser: user,
      usuarioInterno: null,
      permissoes: [],
    }
  }

  const [{ data: permissoes }, { data: acessos }] = await Promise.all([
    supabase
      .from('administrativo_permissoes')
      .select('*')
      .eq('usuario_id', usuarioInterno.id),
    supabase
      .from('administrativo_acessos')
      .select('id, usuario_id, modulo, pode_visualizar, pode_criar, pode_editar, pode_excluir')
      .eq('usuario_id', usuarioInterno.id),
  ])

  const usuarioNormalizado = {
    ...usuarioInterno,
    nivel: usuarioInterno.nivel || usuarioInterno.perfil || '',
  } as UsuarioInternoPermissao

  return {
    authUser: user,
    usuarioInterno: usuarioNormalizado,
    permissoes: [
      ...((permissoes ?? []) as PermissaoUsuario[]),
      ...expandirAcessosAdministrativos((acessos ?? []) as AcessoAdministrativo[]),
    ],
  }
}
