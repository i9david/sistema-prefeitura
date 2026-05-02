type DashboardCardProps = {
  title: string
  value: string | number
}

export function DashboardCard({ title, value }: DashboardCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.10)]">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
        {value}
      </h3>
    </div>
  )
}