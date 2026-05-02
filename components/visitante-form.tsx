'use client'

import { useMemo, useState } from 'react'

const motivos = [
  'Aula',
  'Matrícula',
  'Informações',
  'Evento',
  'Biblioteca',
  'Museu',
  'Reunião',
  'Acompanhamento de aluno',
  'Entrega de documentos',
  'Visita institucional',
  'Outros',
]

function formatarTelefone(valor: string) {
  const numeros = valor.replace(/\D/g, '').slice(0, 11)

  if (numeros.length <= 10) {
    return numeros.replace(
      /^(\d{0,2})(\d{0,4})(\d{0,4}).*/,
      (_, ddd, parte1, parte2) => {
        let resultado = ''
        if (ddd) resultado += `(${ddd}`
        if (ddd.length === 2) resultado += ') '
        if (parte1) resultado += parte1
        if (parte2) resultado += `-${parte2}`
        return resultado
      }
    )
  }

  return numeros.replace(
    /^(\d{0,2})(\d{0,5})(\d{0,4}).*/,
    (_, ddd, parte1, parte2) => {
      let resultado = ''
      if (ddd) resultado += `(${ddd}`
      if (ddd.length === 2) resultado += ') '
      if (parte1) resultado += parte1
      if (parte2) resultado += `-${parte2}`
      return resultado
    }
  )
}

function nomeCompletoValido(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  return partes.length >= 2
}

export function VisitanteForm({
  action,
}: {
  action: (formData: FormData) => void
}) {
  const [motivo, setMotivo] = useState('')
  const [telefone, setTelefone] = useState('')
  const [nome, setNome] = useState('')
  const [destino, setDestino] = useState('centro-cultural')

  const telefoneValido = useMemo(() => {
    const numeros = telefone.replace(/\D/g, '')
    return numeros.length === 11
  }, [telefone])

  const nomeValido = useMemo(() => {
    if (!nome) return false
    return nomeCompletoValido(nome)
  }, [nome])

  return (
    <form action={action} className="mt-6 grid gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Nome do visitante
        </label>
        <input
          name="nome"
          placeholder="Nome e sobrenome"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
        />
        {!nomeValido && nome.length > 0 && (
          <p className="mt-1 text-xs text-red-600">
            Informe pelo menos nome e sobrenome
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Telefone
          </label>
          <input
            name="telefone"
            placeholder="(64) 99999-9999"
            required
            inputMode="numeric"
            value={telefone}
            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          />
          {!telefoneValido && telefone.length > 0 && (
            <p className="mt-1 text-xs text-red-600">
              Informe um telefone com DDD e 11 dígitos
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Destino da visita
          </label>
          <select
            name="destino"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            required
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value="centro-cultural">Centro Cultural</option>
            <option value="museu">Museu</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Motivo da visita
        </label>
        <select
          name="motivo_select"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          required
          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
        >
          <option value="">Selecione o motivo da visita</option>
          {motivos.map((item) => (
            <option key={item} value={item === 'Outros' ? 'outros' : item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {motivo === 'outros' && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Informe o motivo
          </label>
          <input
            name="motivo_outro"
            placeholder="Digite o motivo da visita"
            required
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Observações
        </label>
        <textarea
          name="observacoes"
          placeholder="Observações"
          className="min-h-[100px] w-full rounded-2xl border border-slate-300 px-4 py-3"
        />
      </div>

      <button
        type="submit"
        className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Registrar entrada
      </button>
    </form>
  )
}