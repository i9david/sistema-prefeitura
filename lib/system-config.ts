import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'

export const NOME_SISTEMA_PADRAO = 'Secretaria de Cultura e Turismo'

export async function getNomeSistemaAtual() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('administrativo_configuracoes')
      .select('valor')
      .eq('chave', 'nome_sistema')
      .maybeSingle()

    if (error || !data?.valor) return NOME_SISTEMA_PADRAO

    return String(data.valor)
  } catch {
    return NOME_SISTEMA_PADRAO
  }
}
