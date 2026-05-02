import { createClient } from '@/lib/supabase/server'

const todosModulos = [
  'centro-cultural',
  'museu',
  'casa-artesao',
  'banda-municipal',
  'turismo',
  'administrativo',
  'projetos-captacao',
]

export async function buscarModulosPermitidos() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) return []

  let { data: usuario } = await supabase
    .from('administrativo_usuarios')
    .select('id, nome, email, perfil, status')
    .eq('email', user.email)
    .maybeSingle()

  // Cria automaticamente se não existir
  if (!usuario) {
    const nome =
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.email.split('@')[0]

    const { data: novoUsuario } = await supabase
      .from('administrativo_usuarios')
      .insert({
        nome,
        email: user.email,
        perfil: 'usuario',
        status: 'ativo',
      })
      .select('id, nome, email, perfil, status')
      .single()

    usuario = novoUsuario
  }

  // Se inativo, não acessa nada
  if (!usuario || usuario.status !== 'ativo') return []

  // Admin vê tudo
  if (usuario.perfil === 'admin') {
    return todosModulos
  }

  // Busca acessos
  const { data: acessos } = await supabase
    .from('administrativo_acessos')
    .select('modulo')
    .eq('usuario_id', usuario.id)
    .eq('pode_visualizar', true)

  return (
    acessos
      ?.map((item) => item.modulo)
      .filter((modulo): modulo is string => Boolean(modulo))
      .filter((modulo) => todosModulos.includes(modulo)) || []
  )
}