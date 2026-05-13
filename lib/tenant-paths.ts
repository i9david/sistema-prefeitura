export function getTenantPath(path: string, municipioSlug?: string | null) {
  if (!municipioSlug) return path

  if (!path.startsWith('/')) {
    return path
  }

  if (path === '/') {
    return `/${municipioSlug}`
  }

  return `/${municipioSlug}${path}`
}

export function getTenantPathnameAtual(fallback = '', legacyPathname?: string | null) {
  return legacyPathname ?? fallback
}
