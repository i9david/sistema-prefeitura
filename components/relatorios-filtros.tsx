'use client'

import { memo, useMemo, useState } from 'react'

type Modalidade = {
  id: string
  nome: string
}

type Aula = {
  id: string
  nome: string
  modalidade_id: string
}

type Aluno = {
  id: string
  nome: string
  aula_id: string
}

type Props = {
  modalidades: Modalidade[]
  aulas: Aula[]
  alunos: Aluno[]
  modalidadeId?: string
  aulaId?: string
  alunoId?: string
  dataInicio?: string
  dataFim?: string
}

function RelatoriosFiltrosInner({
  modalidades,
  aulas,
  alunos,
  modalidadeId = '',
  aulaId = '',
  alunoId = '',
  dataInicio = '',
  dataFim = '',
}: Props) {
  const [modalidade, setModalidade] = useState(modalidadeId)
  const [aula, setAula] = useState(aulaId)

  const aulasFiltradas = useMemo(() => {
    if (!modalidade) return []
    return aulas.filter((a) => a.modalidade_id === modalidade)
  }, [modalidade, aulas])

  const alunosFiltrados = useMemo(() => {
    if (!aula) return []
    return alunos.filter((a) => a.aula_id === aula)
  }, [aula, alunos])

  return (
    <form method="get" className="grid gap-4 md:grid-cols-5">
      <select
        name="modalidade_id"
        value={modalidade}
        onChange={(e) => {
          setModalidade(e.target.value)
          setAula('')
        }}
        className="rounded-2xl border px-4 py-3"
      >
        <option value="">Modalidade</option>
        {modalidades.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nome}
          </option>
        ))}
      </select>

      <select
        name="aula_id"
        value={aula}
        onChange={(e) => setAula(e.target.value)}
        className="rounded-2xl border px-4 py-3"
        disabled={!modalidade}
      >
        <option value="">
          {modalidade ? 'Turma' : 'Selecione modalidade'}
        </option>
        {aulasFiltradas.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nome}
          </option>
        ))}
      </select>

      <select
        name="aluno_id"
        defaultValue={alunoId}
        className="rounded-2xl border px-4 py-3"
        disabled={!aula}
      >
        <option value="">Aluno</option>
        {alunosFiltrados.map((aluno) => (
          <option key={aluno.id} value={aluno.id}>
            {aluno.nome}
          </option>
        ))}
      </select>

      <input
        type="date"
        name="data_inicio"
        defaultValue={dataInicio}
        className="rounded-2xl border px-4 py-3"
      />

      <input
        type="date"
        name="data_fim"
        defaultValue={dataFim}
        className="rounded-2xl border px-4 py-3"
      />

      <button className="rounded-2xl bg-blue-600 text-white px-4 py-3">
        Gerar
      </button>
    </form>
  )
}

export const RelatoriosFiltros = memo(RelatoriosFiltrosInner)
