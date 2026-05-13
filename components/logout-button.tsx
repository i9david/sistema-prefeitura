'use client'

import { LogOut } from 'lucide-react'
import { logout } from '@/app/logout/actions'
import { memo } from 'react'

function LogoutButtonInner({
  label = 'Sair do sistema',
  className = '',
}: {
  label?: string
  className?: string
}) {
  return (
    <form action={logout}>
      <button
        type="submit"
        className={className || 'btn-danger'}
      >
        <LogOut size={16} />
        <span className="module-sidebar-text">{label}</span>
      </button>
    </form>
  )
}

export const LogoutButton = memo(LogoutButtonInner)
