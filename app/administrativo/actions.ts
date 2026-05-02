'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const areas = [
  { modulo: 'Centro Cultural', area: 'Alunos', chave: 'centro_alunos' },
  { modulo: 'Centro Cultural', area: 'Aulas', chave: 'centro_aulas' },
  { modulo: 'Centro Cultural', area: 'Professores', chave: 'centro_professores' },
  { modulo: 'Centro Cultural', area: 'Frequência', chave: 'centro_frequencia' },
  { modulo: 'Centro Cultural', area: 'Visitantes', chave: 'centro_visitantes' },

  { modulo: 'Biblioteca', area: 'Leitores', chave: 'biblioteca_leitores' },
  { modulo: 'Biblioteca', area: 'Livros', chave: 'biblioteca_livros' },
  { modulo: 'Biblioteca', area: 'Empréstimos', chave: 'biblioteca_emprestimos' },

  { modulo: 'Casa do Artesão', area: 'Artesãos', chave: 'casa_artesaos' },
  { modulo: 'Casa do Artesão', area: 'Produtos', chave: 'casa_produtos' },
  { modulo: 'Casa do Artesão', area: 'Estoque', chave: 'casa_estoque' },

  { modulo: 'Banda Municipal', area: 'Músicos', chave: 'banda_musicos' },
  { modulo: 'Banda Municipal', area: 'Instrumentos', chave: 'banda_instrumentos' },
  { modulo: 'Banda Municipal', area: 'Ensaios', chave: 'banda_ensaios' },
  { modulo: 'Banda Municipal', area: 'Apresentações', chave: 'banda_apresentacoes' },

  { modulo: 'Administrativo', area: 'Agenda Institucional', chave: 'admin_agenda' },
  { modulo: 'Administrativo', area: 'Usuários e Acessos', chave: 'admin_usuarios' },
  { modulo: 'Administrativo', area: 'Relatórios Gerais', chave: 'admin_relatorios' },
]

function extrairPermissoesDoFormulario(formData: FormData, usuarioId: string) {
  const permissoes = []

  for (const item of areas) {
    const visualizar = formData.get(`${item.chave}_visualizar`) === 'on'
    const criar = formData.get(`${item.chave}_criar`) === 'on'
    const editar = formData.get(`${item.chave}_editar`) === 'on'
    const excluir = formData.get(`${item.chave}_excluir`) === 'on'

    const visualizarFinal = visualizar || criar || editar || excluir

    if (visualizarFinal || criar || editar || excluir) {
      permissoes.push({
        usuario_id: usuarioId,
        modulo: item.modulo,
        area: item.area,
        pode_visualizar: visualizarFinal,
        pode_criar: criar,
        pode_editar: editar,
        pode_excluir: excluir,
      })
    }
  }

  return permissoes
}

export async function criarUsuarioInterno(formData: FormData) {
  const nome = String(formData.get('nome') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const senha = String(formData.get('senha') ?? '').trim()
  const status = String(formData.get('status') ?? 'ativo').trim()
  const nivel = String(formData.get('nivel') ?? 'operador').trim()
  const professorId = String(formData.get('professor_id') ?? '').trim()

  if (!nome || !email || !senha) {
    redirect('/administrativo/usuarios?message=Preencha nome, email e senha')
  }

  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: authCriado, error: authError } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome_completo: nome },
  })

  if (authError || !authCriado.user) {
    redirect(`/administrativo/usuarios?message=${encodeURIComponent(authError?.message || 'Erro ao criar usuário no Auth')}`)
  }

  const { data: usuario, error } = await supabase
    .from('administrativo_usuarios')
    .insert({
      auth_user_id: authCriado.user.id,
      nome,
      email,
      status,
      nivel,
      professor_id: professorId || null,
    })
    .select('id')
    .single()

  if (error || !usuario) {
    redirect(`/administrativo/usuarios?message=${encodeURIComponent(error?.message || 'Erro ao cadastrar usuário')}`)
  }

  const permissoes = extrairPermissoesDoFormulario(formData, usuario.id)

  if (permissoes.length > 0) {
    const { error: permissaoError } = await supabase
      .from('administrativo_permissoes')
      .insert(permissoes)

    if (permissaoError) {
      redirect(`/administrativo/usuarios?message=${encodeURIComponent(permissaoError.message)}`)
    }
  }

  redirect('/administrativo/usuarios?message=Usuário cadastrado com sucesso')
}

export async function atualizarUsuarioInterno(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim()
  const nome = String(formData.get('nome') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const senha = String(formData.get('senha') ?? '').trim()
  const status = String(formData.get('status') ?? 'ativo').trim()
  const nivel = String(formData.get('nivel') ?? 'operador').trim()
  const professorId = String(formData.get('professor_id') ?? '').trim()

  if (!id || !nome || !email) {
    redirect('/administrativo/usuarios?message=Preencha nome e email')
  }

  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: usuarioAtual, error: usuarioAtualError } = await supabase
    .from('administrativo_usuarios')
    .select('auth_user_id')
    .eq('id', id)
    .single()

  if (usuarioAtualError || !usuarioAtual) {
    redirect('/administrativo/usuarios?message=Usuário não encontrado')
  }

  const { error } = await supabase
    .from('administrativo_usuarios')
    .update({
      nome,
      email,
      status,
      nivel,
      professor_id: professorId || null,
    })
    .eq('id', id)

  if (error) {
    redirect(`/administrativo/usuarios?message=${encodeURIComponent(error.message)}`)
  }

  if (usuarioAtual.auth_user_id) {
    const payload: any = {
      email,
      user_metadata: { nome_completo: nome },
    }

    if (senha) {
      payload.password = senha
    }

    const { error: authUpdateError } = await admin.auth.admin.updateUserById(
      usuarioAtual.auth_user_id,
      payload
    )

    if (authUpdateError) {
      redirect(`/administrativo/usuarios?message=${encodeURIComponent(authUpdateError.message)}`)
    }
  }

  await supabase.from('administrativo_permissoes').delete().eq('usuario_id', id)

  const permissoes = extrairPermissoesDoFormulario(formData, id)

  if (permissoes.length > 0) {
    const { error: insertError } = await supabase
      .from('administrativo_permissoes')
      .insert(permissoes)

    if (insertError) {
      redirect(`/administrativo/usuarios?message=${encodeURIComponent(insertError.message)}`)
    }
  }

  redirect('/administrativo/usuarios?message=Usuário atualizado com sucesso')
}

export async function inativarUsuarioInterno(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect('/administrativo/usuarios?message=Usuário não encontrado')
  }

  const supabase = await createClient()

  await supabase.from('administrativo_usuarios').update({ status: 'inativo' }).eq('id', id)

  redirect('/administrativo/usuarios?message=Usuário inativado com sucesso')
}

export async function redefinirSenhaUsuario(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()

  if (!email) {
    redirect('/administrativo/usuarios?message=Email não encontrado')
  }

  const supabase = await createClient()

  const redirectTo =
    process.env.NEXT_PUBLIC_PASSWORD_RESET_REDIRECT_URL || 'http://localhost:3000/login'

  await supabase.auth.resetPasswordForEmail(email, { redirectTo })

  redirect('/administrativo/usuarios?message=Email de redefinição enviado com sucesso')
}