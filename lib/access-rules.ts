export type AccessAction = 'visualizar' | 'criar' | 'editar' | 'excluir'

export type PermissionRecord = {
  modulo: string
  area: string
  pode_visualizar: boolean
  pode_criar: boolean
  pode_editar: boolean
  pode_excluir: boolean
}

export type AccessRule = {
  pathPrefix: string
  modulo: string
  area: string
  action: AccessAction
}

export const ACCESS_RULES: AccessRule[] = [
  { pathPrefix: '/alunos', modulo: 'Centro Cultural', area: 'Alunos', action: 'visualizar' },
  { pathPrefix: '/aulas', modulo: 'Centro Cultural', area: 'Aulas', action: 'visualizar' },
  { pathPrefix: '/professores', modulo: 'Centro Cultural', area: 'Professores', action: 'visualizar' },
  { pathPrefix: '/frequencia', modulo: 'Centro Cultural', area: 'Frequência', action: 'visualizar' },
  { pathPrefix: '/visitantes', modulo: 'Centro Cultural', area: 'Visitantes', action: 'visualizar' },
  { pathPrefix: '/centro-cultural/relatorios', modulo: 'Centro Cultural', area: 'Alunos', action: 'visualizar' },

  { pathPrefix: '/biblioteca/leitores', modulo: 'Biblioteca', area: 'Leitores', action: 'visualizar' },
  { pathPrefix: '/biblioteca/livros', modulo: 'Biblioteca', area: 'Livros', action: 'visualizar' },
  { pathPrefix: '/biblioteca/emprestimos', modulo: 'Biblioteca', area: 'Empréstimos', action: 'visualizar' },
  { pathPrefix: '/biblioteca/relatorios', modulo: 'Biblioteca', area: 'Leitores', action: 'visualizar' },

  { pathPrefix: '/casa-artesao/artesaos', modulo: 'Casa do Artesão', area: 'Artesãos', action: 'visualizar' },
  { pathPrefix: '/casa-artesao/produtos', modulo: 'Casa do Artesão', area: 'Produtos', action: 'visualizar' },
  { pathPrefix: '/casa-artesao/estoque', modulo: 'Casa do Artesão', area: 'Estoque', action: 'visualizar' },
  { pathPrefix: '/casa-artesao/relatorios', modulo: 'Casa do Artesão', area: 'Artesãos', action: 'visualizar' },

  { pathPrefix: '/banda-municipal/musicos', modulo: 'Banda Municipal', area: 'Músicos', action: 'visualizar' },
  { pathPrefix: '/banda-municipal/instrumentos', modulo: 'Banda Municipal', area: 'Instrumentos', action: 'visualizar' },
  { pathPrefix: '/banda-municipal/ensaios', modulo: 'Banda Municipal', area: 'Ensaios', action: 'visualizar' },
  { pathPrefix: '/banda-municipal/apresentacoes', modulo: 'Banda Municipal', area: 'Apresentações', action: 'visualizar' },
  { pathPrefix: '/banda-municipal/relatorios', modulo: 'Banda Municipal', area: 'Músicos', action: 'visualizar' },

  { pathPrefix: '/administrativo/agenda', modulo: 'Administrativo', area: 'Agenda Institucional', action: 'visualizar' },
  { pathPrefix: '/administrativo/usuarios', modulo: 'Administrativo', area: 'Usuários e Acessos', action: 'visualizar' },
  { pathPrefix: '/relatorios', modulo: 'Administrativo', area: 'Relatórios Gerais', action: 'visualizar' },
]

export function getAccessRuleForPath(pathname: string): AccessRule | null {
  const ordered = [...ACCESS_RULES].sort(
    (a, b) => b.pathPrefix.length - a.pathPrefix.length
  )

  return ordered.find((rule) => pathname.startsWith(rule.pathPrefix)) ?? null
}

export function hasPermission(
  permissions: PermissionRecord[],
  modulo: string,
  area: string,
  action: AccessAction
) {
  const permission = permissions.find(
    (item) => item.modulo === modulo && item.area === area
  )

  if (!permission) return false

  if (action === 'visualizar') return permission.pode_visualizar
  if (action === 'criar') return permission.pode_criar
  if (action === 'editar') return permission.pode_editar
  return permission.pode_excluir
}

export function hasAnyModuleAccess(
  permissions: PermissionRecord[],
  modulo: string
) {
  return permissions.some(
    (item) =>
      item.modulo === modulo &&
      (item.pode_visualizar || item.pode_criar || item.pode_editar || item.pode_excluir)
  )
}