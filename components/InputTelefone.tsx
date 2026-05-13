'use client'

import { memo, useMemo, useState } from 'react'
import { FormField } from '@/components/form'

type InputTelefoneProps = {
  defaultValue?: string
  name?: string
  label?: string
  prefix?: string
  required?: boolean
}

function InputTelefoneInner({
  defaultValue = '',
  name = 'telefone',
  label = 'WhatsApp',
  prefix = 'WhatsApp',
  required = true,
}: InputTelefoneProps) {
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
    <FormField label={label}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-green-700">
          {prefix}
        </span>

        <input
          type="text"
          placeholder="(64) 99999-9999"
          value={valor}
          onChange={(e) => setValor(formatarTelefone(e.target.value))}
          className="form-control pl-24"
          inputMode="numeric"
          autoComplete="tel"
          required={required}
        />

        <input type="hidden" name={name} value={telefoneLimpo} />
      </div>
    </FormField>
  )
}

export const InputTelefone = memo(InputTelefoneInner)
