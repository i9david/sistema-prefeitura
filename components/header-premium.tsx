import { LogOut, UserCircle } from 'lucide-react'
import { logout } from '@/app/logout/actions'
import { createClient } from '@/lib/supabase/server'
import { getNomeSistemaAtual } from '@/lib/system-config'

type HeaderPremiumProps = {
  user?: {
    email?: string | null
  } | null
  title?: string
  subtitle?: string
}

function getNomeUsuario(email?: string | null) {
  if (!email) return 'Usuário'
  return email.split('@')[0]
}

async function getAuthUser() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function HeaderPremium({
  user: providedUser,
  title,
  subtitle = 'Sistema de Gestão Integrada',
}: HeaderPremiumProps) {
  const [nomeSistema, authUser] = await Promise.all([
    title ? Promise.resolve(title) : getNomeSistemaAtual(),
    providedUser ? Promise.resolve(providedUser) : getAuthUser(),
  ])

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
            Sistema
          </p>
          <h1 className="mt-1 truncate text-xl font-bold text-slate-950">
            {nomeSistema}
          </h1>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
              <UserCircle size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">Usuário logado</p>
              <p className="max-w-[180px] truncate text-sm font-bold text-slate-900 sm:max-w-[260px]">
                {authUser?.email || getNomeUsuario(authUser?.email)}
              </p>
            </div>
          </div>

          <form action={logout}>
            <button type="submit" className="btn-danger">
              <LogOut size={16} />
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
