import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const LEGACY_ROOTS = new Set([
  '',
  'api',
  'login',
  'logout',
  'dashboard',
  'agenda-cultural',
  'centro-cultural',
  'alunos',
  'professores',
  'modalidades',
  'modalidade-professores',
  'aulas',
  'aula-professores',
  'frequencia',
  'frequencia-biometria',
  'visitantes',
  'contatos',
  'relatorios',
  'pessoas',
  'bi-pessoas',
  'bi-temporal',
  'casa-artesao',
  'banda-municipal',
  'turismo',
  'projetos-captacao',
  'administrativo',
  'almoxarifado',
])

const ROTAS_SEM_TENANT_PERSISTIDO = new Set(['api', 'login', 'logout'])

function getTenantRewrite(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const segmentos = pathname.split('/').filter(Boolean)
  const primeiroSegmento = segmentos[0] ?? ''

  if (!primeiroSegmento || LEGACY_ROOTS.has(primeiroSegmento)) {
    const headers = new Headers(request.headers)
    const municipioSlugCookie = request.cookies.get('municipio_slug_atual')?.value ?? null

    headers.set('x-legacy-pathname', pathname)

    if (
      municipioSlugCookie &&
      primeiroSegmento &&
      !ROTAS_SEM_TENANT_PERSISTIDO.has(primeiroSegmento)
    ) {
      headers.set('x-municipio-slug', municipioSlugCookie)
      headers.set('x-original-pathname', pathname)
    }

    return {
      headers,
      rewriteUrl: null as URL | null,
      municipioSlug: municipioSlugCookie,
      legacyPathname: pathname,
      persistirSlug: false,
    }
  }

  const legacyPathname = `/${segmentos.slice(1).join('/')}` || '/'
  const rewriteUrl = request.nextUrl.clone()
  rewriteUrl.pathname = legacyPathname

  const headers = new Headers(request.headers)
  headers.set('x-municipio-slug', primeiroSegmento)
  headers.set('x-legacy-pathname', legacyPathname)
  headers.set('x-original-pathname', pathname)

  return {
    headers,
    rewriteUrl,
    municipioSlug: primeiroSegmento,
    legacyPathname,
    persistirSlug: true,
  }
}

export async function updateSession(request: NextRequest) {
  const tenantRewrite = getTenantRewrite(request)

  let response = tenantRewrite.rewriteUrl
    ? NextResponse.rewrite(tenantRewrite.rewriteUrl, {
        request: {
          headers: tenantRewrite.headers,
        },
      })
    : NextResponse.next({
        request: {
          headers: tenantRewrite.headers,
        },
      })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.getUser()

  if (tenantRewrite.persistirSlug && tenantRewrite.municipioSlug) {
    response.cookies.set('municipio_slug_atual', tenantRewrite.municipioSlug, {
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
    })
  }

  return response
}
