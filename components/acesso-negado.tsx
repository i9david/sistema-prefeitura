export function AcessoNegado() {
  return (
    <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <h1 className="text-2xl font-bold text-red-700">
        Acesso negado
      </h1>

      <p className="mt-3 text-sm text-red-700">
        Seu usuário não possui permissão para acessar esta área do sistema.
      </p>
    </div>
  )
}
