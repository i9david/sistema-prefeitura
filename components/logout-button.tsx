import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from "@/components/sidebar"

export function LogoutButton({
  label = 'Sair do sistema',
  className = '',
}: {
  label?: string
  className?: string
}) {
  async function logout() {
    'use server'

    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <form action={logout}>
      <button
        type="submit"
        className={
          className ||
          'inline-flex rounded-2xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700'
        }
      >
        {label}
      </button>
    </form>
  )
}