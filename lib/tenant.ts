import { getMunicipioId } from '@/lib/supabase/tenant-server'

/*
 * Camada single-tenant.
 * Mineiros e o unico municipio ativo e usa o UUID fixo de getMunicipioId().
 */

export type MunicipioAtual = {
  id: string
  nome: string
  slug: string
  uf: string | null
  status: string
  papel: string | null
  usuarioMunicipioId: string | null
}

export async function getMunicipioAtual(): Promise<MunicipioAtual> {
  const municipioId = getMunicipioId()

  return {
    id: municipioId,
    nome: 'Mineiros',
    slug: 'mineiros',
    uf: 'GO',
    status: 'ativo',
    papel: null,
    usuarioMunicipioId: null,
  }
}
