import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, ExternalLink, Plus } from 'lucide-react'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { ModuloAdministrativoNav } from '@/components/modulo-administrativo-nav'
import { ModuleCard } from '@/components/module/module-card'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleLayout } from '@/components/module/module-layout'
import { getTenantPath } from '@/lib/tenant-paths-server'

export default async function AdministrativoAgendaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const calendarEmbedUrl =
    process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_EMBED_URL || ''

  const calendarId =
    '80a7652c9fc4403563a4eb01269794547157ff581c6f11be5db553cff70c60d4@group.calendar.google.com'

  const googleCalendarManageUrl =
    `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(calendarId)}`

  const googleCalendarCreateEventUrl =
    `https://calendar.google.com/calendar/u/0/r/eventedit?cid=${encodeURIComponent(calendarId)}`

  return (
    <ModuleLayout sidebar={<ModuloAdministrativoNav currentPath="/administrativo/agenda" />}>
      <ModuleHeader
        title="Agenda Institucional"
        eyebrow="Operação"
        description="Agenda oficial integrada ao Google Agenda da Secretaria."
        icon={CalendarDays}
        accent="blue"
        context="Compromissos institucionais"
        action={
          <div className="flex flex-wrap gap-3">
            <Link href={getTenantPath('/administrativo')} className="btn-secondary">
              Voltar ao módulo
            </Link>

            <a
              href={googleCalendarManageUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
            >
              <ExternalLink size={16} aria-hidden="true" />
              Gerenciar agenda
            </a>

            <a
              href={googleCalendarCreateEventUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
            >
              <Plus size={16} aria-hidden="true" />
              Criar evento
            </a>
          </div>
        }
      />

      <ModuleCard>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">
            Visualização da agenda
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Alterações feitas no Google Agenda aparecem aqui automaticamente.
          </p>
        </div>

        {calendarEmbedUrl ? (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <iframe
              src={calendarEmbedUrl}
              width="100%"
              height="720"
              className="w-full"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="rounded-lg bg-slate-100 p-5 text-sm text-slate-700">
            Agenda não configurada. Configure no arquivo <strong>.env.local</strong>.
          </div>
        )}
      </ModuleCard>
    </ModuleLayout>
  )
}
