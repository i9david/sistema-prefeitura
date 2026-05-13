/**
 * Componente Client para Radar
 * Interatividade e filtros do radar avançado
 */

'use client'

import { memo, useState, useCallback } from 'react'
import { ChevronRight, Filter, Zap } from 'lucide-react'

interface Oportunidade {
  id: string
  titulo: string
  area: string
  tipo: string
  score: number
  valor_estimado?: number
  data_encerramento?: string
  status: string
  fonte?: { nome: string }
}

interface RadarClientProps {
  oportunidades: Oportunidade[]
  total: number
  parametrosFiltro: Record<string, string | undefined>
}

function RadarClientComponentInner({
  oportunidades,
  total,
  parametrosFiltro
}: RadarClientProps) {
  const [filtroAberto, setFiltroAberto] = useState(false)
  const [filtroArea, setFiltroArea] = useState(parametrosFiltro.area || '')
  const [filtroScore, setFiltroScore] = useState(parametrosFiltro.score || '')

  const areaOpcoes = ['cultura', 'turismo', 'educacao', 'assistencia', 'saude', 'meio_ambiente']
  const tipoOpcoes = ['edital', 'convenio', 'patrocinio', 'subvencao']

  const aplicarFiltros = useCallback(() => {
    const params = new URLSearchParams()
    if (filtroArea) params.set('area', filtroArea)
    if (filtroScore) params.set('score', filtroScore)
    window.location.href = `/projetos-captacao/radar?${params.toString()}`
  }, [filtroArea, filtroScore])

  const limparFiltros = useCallback(() => {
    window.location.href = '/projetos-captacao/radar'
  }, [])

  const formatarValor = (valor?: number) => {
    if (!valor) return '-'
    return `R$ ${(valor / 1000).toFixed(0)}k`
  }

  const getCorScore = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 border-emerald-200 text-emerald-700'
    if (score >= 60) return 'bg-amber-50 border-amber-200 text-amber-700'
    return 'bg-slate-50 border-slate-200 text-slate-700'
  }

  const getStatusBadge = (status: string) => {
    const mapa: Record<string, string> = {
      nova: 'bg-blue-100 text-blue-700',
      analisada: 'bg-slate-100 text-slate-700',
      vinculada: 'bg-emerald-100 text-emerald-700',
      descartada: 'bg-red-100 text-red-700',
      arquivada: 'bg-gray-100 text-gray-700'
    }
    return mapa[status] || 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="space-y-4">
      {/* Barra de Filtros */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setFiltroAberto(!filtroAberto)}
            className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
          >
            <Filter size={16} />
            Filtros {filtroArea || filtroScore ? '(ativo)' : ''}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">
              Mostrando {oportunidades.length} de {total} oportunidades
            </span>
            {(filtroArea || filtroScore) && (
              <button
                onClick={limparFiltros}
                className="text-xs font-medium text-blue-600 transition hover:text-blue-700 underline"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Painel de Filtros */}
        {filtroAberto && (
          <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
            {/* Área */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Área
              </label>
              <select
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Todas as áreas</option>
                {areaOpcoes.map((area) => (
                  <option key={area} value={area}>
                    {area.charAt(0).toUpperCase() + area.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Score Mínimo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Score mínimo: {filtroScore || '0'}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={filtroScore || 0}
                onChange={(e) => setFiltroScore(e.target.value)}
                className="w-full"
              />
              <div className="mt-1 flex gap-2">
                {[30, 50, 70, 80].map((valor) => (
                  <button
                    key={valor}
                    onClick={() => setFiltroScore(String(valor))}
                    className={`rounded px-2 py-1 text-xs font-medium transition ${
                      filtroScore === String(valor)
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {valor}+
                  </button>
                ))}
              </div>
            </div>

            {/* Botão Aplicar */}
            <button
              onClick={aplicarFiltros}
              className="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Aplicar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Lista de Oportunidades */}
      {oportunidades.length > 0 ? (
        <div className="space-y-3">
          {oportunidades.map((opp) => (
            <a
              key={opp.id}
              href={`/projetos-captacao/radar/${opp.id}`}
              className="group rounded-lg border border-slate-200 bg-white p-4 transition hover:border-violet-300 hover:bg-violet-50"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Conteúdo Principal */}
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    {/* Score */}
                    <div
                      className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg border text-center ${getCorScore(
                        opp.score
                      )}`}
                    >
                      <div>
                        <div className="font-bold text-lg">{opp.score}</div>
                        <div className="text-xs">/100</div>
                      </div>
                    </div>

                    {/* Informações */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-950 group-hover:text-violet-700">
                        {opp.titulo}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {/* Badges */}
                        <span className={`badge text-xs ${getStatusBadge(opp.status)}`}>
                          {opp.status}
                        </span>
                        <span className="badge bg-slate-100 text-slate-700 text-xs">
                          {opp.tipo}
                        </span>
                        <span className="badge bg-slate-100 text-slate-700 text-xs">
                          {opp.area}
                        </span>
                      </div>

                      {/* Meta */}
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
                        <span>💰 {formatarValor(opp.valor_estimado)}</span>
                        {opp.data_encerramento && (
                          <span>📅 {new Date(opp.data_encerramento).toLocaleDateString('pt-BR')}</span>
                        )}
                        {opp.fonte && <span>🔗 {opp.fonte.nome}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex flex-shrink-0 items-center gap-2">
                  <button
                    className="flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-700"
                    onClick={(e) => {
                      e.preventDefault()
                      window.location.href = `/projetos-captacao/radar/${opp.id}`
                    }}
                  >
                    <Zap size={14} />
                    Ação
                  </button>
                  <ChevronRight className="text-slate-400" size={20} />
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-slate-600">Nenhuma oportunidade encontrada com os filtros selecionados.</p>
        </div>
      )}
    </div>
  )
}

export const RadarClientComponent = memo(RadarClientComponentInner)
