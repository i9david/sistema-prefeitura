/**
 * Componente Client para Ações na Página de Detalhe
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  descartarOportunidade,
  vincularOportunidadeAoProjeto,
  criarProjetoAPartirOportunidade
} from '@/lib/captacao-radar-actions'
import { AlertCircle, Trash2, Link as LinkIcon, Plus } from 'lucide-react'

interface DetalheClientComponentProps {
  oportunidadeId: string
  status: string
}

export function DetalheClientComponent({
  oportunidadeId,
  status
}: DetalheClientComponentProps) {
  const router = useRouter()
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState<'nenhum' | 'descartar' | 'vincular' | 'criar'>('nenhum')
  const [motivoDescarte, setMotivoDescarte] = useState('')
  const [projetoSelecionado, setProjetoSelecionado] = useState('')

  const podeAgir = !['descartada', 'arquivada'].includes(status)

  const handleDescartar = useCallback(async () => {
    if (!motivoDescarte.trim()) {
      setErro('Por favor, informe o motivo do descarte')
      return
    }

    setCarregando(true)
    setErro(null)

    try {
      await descartarOportunidade(oportunidadeId, motivoDescarte)
      setSucesso('Oportunidade descartada com sucesso')
      setTimeout(() => {
        router.push('/projetos-captacao/radar')
      }, 2000)
    } catch (err) {
      setErro(String(err))
    } finally {
      setCarregando(false)
    }
  }, [motivoDescarte, oportunidadeId, router])

  const handleVincular = useCallback(async () => {
    if (!projetoSelecionado) {
      setErro('Por favor, selecione um projeto')
      return
    }

    setCarregando(true)
    setErro(null)

    try {
      await vincularOportunidadeAoProjeto(oportunidadeId, projetoSelecionado)
      setSucesso('Oportunidade vinculada com sucesso')
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (err) {
      setErro(String(err))
    } finally {
      setCarregando(false)
    }
  }, [projetoSelecionado, oportunidadeId, router])

  const handleCriarProjeto = useCallback(async () => {
    setCarregando(true)
    setErro(null)

    try {
      const projeto = await criarProjetoAPartirOportunidade(oportunidadeId)
      setSucesso('Projeto criado e oportunidade vinculada com sucesso')
      setTimeout(() => {
        router.push(`/projetos-captacao/${projeto.id}`)
      }, 2000)
    } catch (err) {
      setErro(String(err))
    } finally {
      setCarregando(false)
    }
  }, [oportunidadeId, router])

  if (!podeAgir) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-amber-700" size={20} />
          <div>
            <h3 className="font-semibold text-amber-900">Ação Indisponível</h3>
            <p className="text-sm text-amber-800">
              Não é possível realizar ações em oportunidades {status}.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mensagens de Feedback */}
      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-700">{erro}</p>
        </div>
      )}

      {sucesso && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-medium text-emerald-700">✅ {sucesso}</p>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {/* Criar Novo Projeto */}
        <button
          onClick={() => setModalAberto('criar')}
          disabled={carregando}
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Criar Projeto</span>
        </button>

        {/* Vincular a Projeto Existente */}
        <button
          onClick={() => setModalAberto('vincular')}
          disabled={carregando}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          <LinkIcon size={18} />
          <span className="hidden sm:inline">Vincular</span>
        </button>

        {/* Descartar */}
        <button
          onClick={() => setModalAberto('descartar')}
          disabled={carregando}
          className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          <Trash2 size={18} />
          <span className="hidden sm:inline">Descartar</span>
        </button>
      </div>

      {/* Modal: Descartar */}
      {modalAberto === 'descartar' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="rounded-lg bg-white p-6 w-96 shadow-lg">
            <h3 className="mb-4 text-lg font-bold text-slate-950">Descartar Oportunidade</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Motivo do descarte
              </label>
              <textarea
                value={motivoDescarte}
                onChange={(e) => setMotivoDescarte(e.target.value)}
                placeholder="Ex: Duplicata, fora da realidade do município, etc"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalAberto('nenhum')}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDescartar}
                disabled={carregando || !motivoDescarte.trim()}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {carregando ? 'Descartando...' : 'Descartar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Criar Projeto */}
      {modalAberto === 'criar' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="rounded-lg bg-white p-6 w-96 shadow-lg">
            <h3 className="mb-4 text-lg font-bold text-slate-950">Criar Novo Projeto</h3>

            <p className="mb-4 text-sm text-slate-600">
              Um novo projeto será criado automaticamente com as informações da oportunidade
              e será vinculado imediatamente.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setModalAberto('nenhum')}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCriarProjeto}
                disabled={carregando}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {carregando ? 'Criando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Vincular */}
      {modalAberto === 'vincular' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="rounded-lg bg-white p-6 w-96 shadow-lg">
            <h3 className="mb-4 text-lg font-bold text-slate-950">Vincular a Projeto</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Selecione o projeto
              </label>
              <select
                value={projetoSelecionado}
                onChange={(e) => setProjetoSelecionado(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Carregando projetos...</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Nota: A lista de projetos será carregada aqui
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalAberto('nenhum')}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleVincular}
                disabled={carregando || !projetoSelecionado}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {carregando ? 'Vinculando...' : 'Vincular'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
