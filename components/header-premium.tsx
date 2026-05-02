import { LogOut } from 'lucide-react'
import { logout } from '@/app/logout/actions'

export function HeaderPremium({ user }: any) {
  return (
    <div className="rounded-[30px] bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-bold">
            Secretaria de Cultura e Turismo
          </h1>
          <p className="text-sm opacity-80">
            Sistema de Gestão Integrada
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm opacity-80">Usuário</p>
            <p className="font-bold">{user.email}</p>
          </div>

          <form action={logout}>
            <button className="flex items-center gap-2 bg-red-500 px-4 py-2 rounded-xl hover:bg-red-600 transition">
              <LogOut size={16} />
              Sair
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}