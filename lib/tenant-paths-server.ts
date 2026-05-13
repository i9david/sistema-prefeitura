import { getTenantPath as getTenantPathWithSlug } from './tenant-paths'

const MUNICIPIO_SLUG = 'mineiros'

export function getMunicipioSlugAtual() {
  return MUNICIPIO_SLUG
}

export function getTenantPath(path: string) {
  return getTenantPathWithSlug(path, MUNICIPIO_SLUG)
}

export function getTenantPathnameAtual(fallback = '') {
  return fallback
}
