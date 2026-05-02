'use client'

type Permissao = {
  modulo: string
  area: string
  chave: string
}

type PermissaoBanco = {
  modulo: string
  area: string
  pode_visualizar: boolean
  pode_criar: boolean
  pode_editar: boolean
  pode_excluir: boolean
}

type Props = {
  permissoes: Permissao[]
  permissoesAtuais?: PermissaoBanco[]
}

function temPermissao(
  permissoesAtuais: PermissaoBanco[] | undefined,
  modulo: string,
  area: string,
  tipo: 'visualizar' | 'criar' | 'editar' | 'excluir'
) {
  const permissao = permissoesAtuais?.find(
    (item) => item.modulo === modulo && item.area === area
  )

  if (!permissao) return false

  if (tipo === 'visualizar') return permissao.pode_visualizar
  if (tipo === 'criar') return permissao.pode_criar
  if (tipo === 'editar') return permissao.pode_editar
  return permissao.pode_excluir
}

export function PermissionMatrix({ permissoes, permissoesAtuais = [] }: Props) {
  const modulos = Array.from(new Set(permissoes.map((item) => item.modulo)))

  function handleDependency(baseKey: string, checked: boolean) {
    const visualizar = document.querySelector<HTMLInputElement>(
      `input[name="${baseKey}_visualizar"]`
    )

    if (checked && visualizar) {
      visualizar.checked = true
    }
  }

  return (
    <div className="space-y-4">
      {modulos.map((modulo) => (
        <div key={modulo} className="rounded-2xl border border-slate-200 p-4">
          <h4 className="text-base font-bold text-slate-900">{modulo}</h4>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2">Área</th>
                  <th>Visualizar</th>
                  <th>Criar</th>
                  <th>Editar</th>
                  <th>Excluir</th>
                </tr>
              </thead>

              <tbody>
                {permissoes
                  .filter((item) => item.modulo === modulo)
                  .map((item) => (
                    <tr key={item.chave} className="border-t">
                      <td className="py-3 font-medium text-slate-900">{item.area}</td>

                      <td>
                        <input
                          type="checkbox"
                          name={`${item.chave}_visualizar`}
                          defaultChecked={temPermissao(
                            permissoesAtuais,
                            item.modulo,
                            item.area,
                            'visualizar'
                          )}
                        />
                      </td>

                      <td>
                        <input
                          type="checkbox"
                          name={`${item.chave}_criar`}
                          defaultChecked={temPermissao(
                            permissoesAtuais,
                            item.modulo,
                            item.area,
                            'criar'
                          )}
                          onChange={(e) => handleDependency(item.chave, e.target.checked)}
                        />
                      </td>

                      <td>
                        <input
                          type="checkbox"
                          name={`${item.chave}_editar`}
                          defaultChecked={temPermissao(
                            permissoesAtuais,
                            item.modulo,
                            item.area,
                            'editar'
                          )}
                          onChange={(e) => handleDependency(item.chave, e.target.checked)}
                        />
                      </td>

                      <td>
                        <input
                          type="checkbox"
                          name={`${item.chave}_excluir`}
                          defaultChecked={temPermissao(
                            permissoesAtuais,
                            item.modulo,
                            item.area,
                            'excluir'
                          )}
                          onChange={(e) => handleDependency(item.chave, e.target.checked)}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}