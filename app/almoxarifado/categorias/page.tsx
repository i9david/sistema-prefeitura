import { redirect } from 'next/navigation'
import { Plus, Shapes } from 'lucide-react'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuloAlmoxarifadoNav } from '@/components/modulo-almoxarifado-nav'
import { ModuleCard, ModuleMetricCard } from '@/components/module/module-card'
import { ModuleGrid } from '@/components/module/module-grid'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { ModuleTable } from '@/components/module/module-table'
import { criarCategoria, listarCategorias } from '../actions'

function formatarData(valor: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(valor))
}

export default async function AlmoxarifadoCategoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const categorias = await listarCategorias()

  return (
    <ModuleLayout sidebar={<ModuloAlmoxarifadoNav currentPath="/almoxarifado/categorias" />}>
      <ModuleHeader
        title="Categorias"
        eyebrow="Cadastros"
        description="Classifique os materiais para facilitar filtros, relatórios e controle operacional."
        icon={Shapes}
        accent="emerald"
      />

      <ModuleGrid columns={2}>
        <ModuleMetricCard
          label="Categorias cadastradas"
          value={categorias.length}
          icon={Shapes}
          accent="emerald"
        />
        <ModuleCard>
          <h2 className="text-lg font-bold text-slate-950">Nova categoria</h2>
          <form action={criarCategoria} className="mt-4 grid gap-3">
            <input
              name="nome"
              required
              placeholder="Nome da categoria"
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm"
            />
            <textarea
              name="descricao"
              placeholder="Descrição"
              rows={3}
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm"
            />
            <button type="submit" className="btn-primary justify-center">
              <Plus size={16} aria-hidden="true" />
              Cadastrar categoria
            </button>
          </form>
          {params.message && (
            <p className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
              {params.message}
            </p>
          )}
        </ModuleCard>
      </ModuleGrid>

      <ModuleCard>
        <h2 className="text-lg font-bold text-slate-950">Lista de categorias</h2>
        <div className="mt-4">
          <ModuleTable
            data={categorias}
            getRowKey={(categoria) => categoria.id}
            emptyTitle="Nenhuma categoria cadastrada"
            emptyDescription="Cadastre a primeira categoria para organizar os produtos."
            columns={[
              {
                header: 'Categoria',
                headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                className: 'px-4 py-3 text-sm font-semibold text-slate-900',
                render: (categoria) => categoria.nome,
              },
              {
                header: 'Descrição',
                headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                className: 'px-4 py-3 text-sm text-slate-600',
                render: (categoria) => categoria.descricao || '-',
              },
              {
                header: 'Criada em',
                headerClassName: 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
                className: 'px-4 py-3 text-sm text-slate-600',
                render: (categoria) => formatarData(categoria.created_at),
              },
            ]}
          />
        </div>
      </ModuleCard>
    </ModuleLayout>
  )
}
