'use server'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar" from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function criarUsuarioAdministrativo(formData: FormData) {
  const supabase = await createClient()

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

  const { error } = await supabase
    .from('administrativo_usuarios')
    .upsert(
      {
        nome,
        email,
        perfil,
        status,
      },
      {
        onConflict: 'email',
      }
    )

  if (error) {
    redirect(`/administrativo/usuarios?novo=1&message=${encodeURIComponent(error.message)}`)
  }

  redirect('/administrativo/usuarios?message=Usuário salvo com sucesso')
}

export async function atualizarAcesso(formData: FormData) {
  const supabase = await createClient()

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
      {
        onConflict: 'id',
      }
    )

  if (error) {
    redirect(`/administrativo/usuarios?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/administrativo/usuarios?message=Acesso atualizado com sucesso')
}

export async function criarAcesso(formData: FormData) {
  const supabase = await createClient()

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
  const supabase = await createClient()

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