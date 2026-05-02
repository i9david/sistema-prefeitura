import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"Sidebar currentPath="/" /> } from '@/components/<Sidebar currentPath="/" />'

function cardClassName() {
  return 'rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
}

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
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <<Sidebar currentPath="/" /> currentPath="/administrativo/agenda" />
        <section className="space-y-6">
          {/* HEADER */}
          <div className={cardClassName()}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Agenda Institucional
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Agenda oficial integrada ao Google Agenda da Secretaria
                </p>
              </div>

              {/* BOTÕES CORRIGIDOS */}
              <div className="flex flex-wrap gap-3">
                
                {/* VOLTAR */}
                <Link
                  href="/administrativo"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Voltar ao módulo
                </Link>

                {/* GERENCIAR */}
                <a
                  href={googleCalendarManageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Gerenciar agenda
                </a>

                {/* CRIAR EVENTO */}
                <a
                  href={googleCalendarCreateEventUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
                >
                  Criar evento
                </a>
              </div>
            </div>
          </div>

          {/* CALENDÁRIO */}
          <div className={cardClassName()}>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                Visualização da agenda
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Alterações feitas no Google Agenda aparecem aqui automaticamente
              </p>
            </div>

            {calendarEmbedUrl ? (
              <div className="overflow-hidden rounded-3xl border border-slate-200">
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
              <div className="rounded-2xl bg-slate-100 p-5 text-sm text-slate-700">
                Agenda não configurada. Configure no arquivo <strong>.env.local</strong>.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}