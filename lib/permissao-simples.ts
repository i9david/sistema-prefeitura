export function temAcesso(modulo: string) {
  // SIMPLES AGORA (depois ligamos no Supabase)
  const modulosPermitidos = [
    'centro-cultural',
    'banda-municipal',
    'casa-artesao',
  ]

  return modulosPermitidos.includes(modulo)
}