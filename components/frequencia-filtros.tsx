'use client'

import { useMemo, useState } from 'react'

type Modalidade = {
  id: string
  nome: string
}

type Aula = {
  id: string
  nome: string
  modalidade_id: string
  dia_semana: string
  horario_inicio: string
  horario_fim: string
}

type Props = {
  modalidades: Modalidade[]
  aulas: Aula[]
  modalidadeIdSelecionada?: string
  aulaIdSelecionada?: string
  dataAulaSelecionada: string
}

function getDescricaoAula(aula: Aula, modalidades: Modalidade[]) {
  const modalidadeNome =
    modalidades.find((modalidade) => modalidade.id === aula.modalidade_id)?.nome ||
    'Sem modalidade'

  return `${aula.nome} • ${modalidadeNome} • ${aula.dia_semana} • ${aula.horario_inicio} às ${aula.horario_fim}`
}

export function FrequenciaFiltros({
  modalidades,
  aulas,
  modalidadeIdSelecionada = '',
  aulaIdSelecionada = '',
  dataAulaSelecionada,
}: Props) {
  const [modalidadeId, setModalidadeId] = useState(modalidadeIdSelecionada)
  const [aulaId, setAulaId] = useState(aulaIdSelecionada)

  const aulasFiltradas = useMemo(() => {
    if (!modalidadeId) return []
    return aulas.filter((aula) => aula.modalidade_id === modalidadeId)
  }, [aulas, modalidadeId])

  return (
    <form method="get" className="grid gap-4 md:grid-cols-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Modalidade
        </label>
        <select
          name="modalidade_id"
          value={modalidadeId}
          onChange={(e) => {
            setModalidadeId(e.target.value)
            setAulaId('')
          }}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
        >
          <option value="">Selecione a modalidade</option>
          {modalidades.map((modalidade) => (
            <option key={modalidade.id} value={modalidade.id}>
              {modalidade.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Turma
        </label>
        <select
          name="aula_id"
          required
          value={aulaId}
          onChange={(e) => setAulaId(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          disabled={!modalidadeId}
        >
          <option value="">
            {modalidadeId ? 'Selecione a turma' : 'Escolha primeiro a modalidade'}
          </option>
          {aulasFiltradas.map((aula) => (
            <option key={aula.id} value={aula.id}>
              {getDescricaoAula(aula, modalidades)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Data da aula
        </label>
        <input
          type="date"
          name="data_aula"
          required
          defaultValue={dataAulaSelecionada}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
        />
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-white"
        >
          Carregar
        </button>
      </div>
    </form>
  )
}