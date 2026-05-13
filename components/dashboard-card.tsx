type DashboardCardProps = {
  title: string
  value: string | number
}

export function DashboardCard({ title, value }: DashboardCardProps) {
  return (
    <div className="ui-card p-5 transition hover:border-blue-200 hover:shadow-[var(--shadow-card)]">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </h3>
    </div>
  )
}
