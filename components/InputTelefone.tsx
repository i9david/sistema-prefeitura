'use client'

import { useMemo, useState } from 'react'

type InputTelefoneProps = {
  defaultValue?: string
}

export function InputTelefone({ defaultValue = '' }: InputTelefoneProps) {
  function somenteNumeros(valor: string) {
    return valor.replace(/\D/g, '').slice(0, 11)
  }

  function formatarTelefone(valor: string) {
    const numeros = somenteNumeros(valor)

    if (numeros.length <= 2) {
      return numeros
    }

    if (numeros.length <= 6) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`
    }

    if (numeros.length <= 10) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
  }

  const valorInicial = useMemo(() => formatarTelefone(defaultValue), [defaultValue])
  const [valor, setValor] = useState(valorInicial)

  const telefoneLimpo = somenteNumeros(valor)

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        WhatsApp
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-green-600">
          WhatsApp
        </span>

        <input
          type="text"
          placeholder="(64) 99999-9999"
          value={valor}
          onChange={(e) => setValor(formatarTelefone(e.target.value))}
          className="w-full rounded-2xl border py-3 pl-28 pr-4"
          inputMode="numeric"
          autoComplete="tel"
          required
        />

        <input type="hidden" name="telefone" value={telefoneLimpo} />
      </div>
    </div>
  )
}