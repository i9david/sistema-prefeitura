'use server'

import { redirect } from 'next/navigation'
import { exigirPermissaoAction } from '@/lib/seguranca-actions'
import {
  getMensagemLimiteUsuariosParaVinculo,
  vincularUsuarioAoMunicipioAtual,
} from '@/lib/saas'

const PERMISSAO_MODULO = 'Administrativo'
const PERMISSAO_TELA = 'Usuarios e Acessos'

export async function criarUsuarioAdministrativo(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    PERMISSAO_MODULO,
    PERMISSAO_TELA,
    'criar'
  )

  const nome = String(formData.get('nome') || '').trim()
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const perfil = String(formData.get('perfil') || 'operador').trim()
  const status = String(formData.get('status') || 'ativo').trim()

  if (!nome) {
    redirect('/administrativo/usuarios?novo=1&message=Informe o nome do usuário')
  }

  if (!email) {
    redirect('/administrativo/usuarios?novo=1&message=Informe o e-mail do usuário')
  }

  const { data: usuarioExistente } = await supabase
    .from('administrativo_usuarios')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  const mensagemLimite = await getMensagemLimiteUsuariosParaVinculo(
    usuarioExistente?.id
  )

  if (mensagemLimite) {
    redirect(`/administrativo/usuarios?novo=1&message=${encodeURIComponent(mensagemLimite)}`)
  }

  const { data: usuario, error } = await supabase
    .from('administrativo_usuarios')
    .upsert(
      { nome, email, perfil, status },
      { onConflict: 'municipio_id,email' }
    )
    .select('id')
    .single()

  if (error) {
    redirect(`/administrativo/usuarios?novo=1&message=${encodeURIComponent(error.message)}`)
  }

  if (usuario?.id) {
    try {
      await vincularUsuarioAoMunicipioAtual(usuario.id, perfil)
    } catch (erro) {
      redirect(
        `/administrativo/usuarios?novo=1&message=${encodeURIComponent(
          erro instanceof Error ? erro.message : 'Erro ao vincular usuário ao município'
        )}`
      )
    }
  }

  redirect('/administrativo/usuarios?message=Usuário salvo com sucesso')
}

export async function atualizarAcesso(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    PERMISSAO_MODULO,
    PERMISSAO_TELA,
    'editar'
  )

  const id = String(formData.get('id') || '')
  const usuarioId = String(formData.get('usuario_id') || '')
  const modulo = String(formData.get('modulo') || '')

  const podeVisualizar = formData.get('pode_visualizar') === 'on'
  const podeCriar = formData.get('pode_criar') === 'on'
  const podeEditar = formData.get('pode_editar') === 'on'
  const podeExcluir = formData.get('pode_excluir') === 'on'

  if (!usuarioId || !modulo) {
    redirect('/administrativo/usuarios?message=Dados inválidos')
  }

  const { error } = await supabase
    .from('administrativo_acessos')
    .upsert(
      {
        id: id || undefined,
        usuario_id: usuarioId,
        modulo,
        pode_visualizar: podeVisualizar,
        pode_criar: podeCriar,
        pode_editar: podeEditar,
        pode_excluir: podeExcluir,
      },
      { onConflict: 'municipio_id,id' }
    )

  if (error) {
    redirect(`/administrativo/usuarios?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/administrativo/usuarios?message=Acesso atualizado com sucesso')
}

export async function criarAcesso(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    PERMISSAO_MODULO,
    PERMISSAO_TELA,
    'criar'
  )

  const usuarioId = String(formData.get('usuario_id') || '')
  const modulo = String(formData.get('modulo') || '')

  if (!usuarioId || !modulo) {
    redirect('/administrativo/usuarios?message=Informe usuário e módulo')
  }

  const { error } = await supabase
    .from('administrativo_acessos')
    .insert({
      usuario_id: usuarioId,
      modulo,
      pode_visualizar: true,
      pode_criar: false,
      pode_editar: false,
      pode_excluir: false,
    })

  if (error) {
    redirect(`/administrativo/usuarios?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/administrativo/usuarios?message=Acesso criado com sucesso')
}

export async function removerAcesso(formData: FormData) {
  const { supabase } = await exigirPermissaoAction(
    PERMISSAO_MODULO,
    PERMISSAO_TELA,
    'excluir'
  )

  const id = String(formData.get('id') || '')

  if (!id) {
    redirect('/administrativo/usuarios?message=ID inválido')
  }

  const { error } = await supabase
    .from('administrativo_acessos')
    .delete()
    .eq('id', id)

  if (error) {
    redirect(`/administrativo/usuarios?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/administrativo/usuarios?message=Acesso removido com sucesso')
}
