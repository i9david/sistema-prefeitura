import { redirect } from 'next/navigation'
import { getContextoPermissoes } from '@/lib/get-permissoes'
import { podeAcessar } from '@/lib/permissoes'

export async function exigirPermissaoPagina(
  modulo: string,
  tela: string,
  acao: 'visualizar' | 'criar' | 'editar' | 'excluir' = 'visualizar'
) {
  const contexto = await getContextoPermissoes()

  if (!contexto.authUser) {
    redirect('/login')
  }

  if (!contexto.usuarioInterno) {
    redirect('/login')
  }

  const permitido = podeAcessar(
    contexto.usuarioInterno.nivel,
    contexto.permissoes,
    modulo,
    tela,
    acao
  )

  if (!permitido) {
    redirect('/sem-permissao')
  }

  return contexto
}
