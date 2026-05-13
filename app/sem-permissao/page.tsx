import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import { ModuleHeader } from '@/components/module/module-header'
import { ModuleCard } from '@/components/module/module-card'
import { getTenantPath } from '@/lib/tenant-paths-server'

export default function SemPermissaoPage() {
  return (
    <main className="min-h-screen bg-[var(--color-page)] p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <ModuleHeader
          title="Acesso restrito"
          eyebrow="Permissão necessária"
          description="Esta área é protegida para manter a segurança dos dados institucionais. Solicite liberação ao administrador do sistema caso precise acessar este recurso."
          icon={ShieldAlert}
          accent="amber"
          context="Sistema municipal"
          action={
            <Link href={getTenantPath('/')} className="btn-primary w-full justify-center md:w-auto">
              Voltar ao início
            </Link>
          }
        />

        <ModuleCard className="border-amber-200 bg-amber-50">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-amber-900">
                O acesso não foi autorizado para o seu perfil.
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-800">
                Se você acredita que deveria visualizar esta página, peça ao gestor
                responsável para revisar suas permissões no módulo Administrativo.
              </p>
            </div>

            <span className="inline-flex rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-amber-700">
              Segurança ativa
            </span>
          </div>
        </ModuleCard>
      </div>
    </main>
  )
}
