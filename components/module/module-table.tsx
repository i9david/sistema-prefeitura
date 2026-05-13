import type { ReactNode } from 'react'
import { ModuleEmptyState } from '@/components/module/module-state'

export type ModuleTableColumn<T> = {
  header: ReactNode
  render: (row: T) => ReactNode
  className?: string
  headerClassName?: string
}

type ModuleTableProps<T> = {
  data: T[]
  columns: ModuleTableColumn<T>[]
  getRowKey: (row: T) => string
  emptyTitle?: string
  emptyDescription?: string
}

export function ModuleTable<T>({
  data,
  columns,
  getRowKey,
  emptyTitle = 'Nenhum registro encontrado',
  emptyDescription = 'Ajuste os filtros ou cadastre um novo item para continuar.',
}: ModuleTableProps<T>) {
  if (data.length === 0) {
    return (
      <ModuleEmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={column.headerClassName}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row) => (
            <tr key={getRowKey(row)} className="transition hover:bg-slate-50">
              {columns.map((column, index) => (
                <td key={index} className={column.className}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
