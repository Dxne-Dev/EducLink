import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isProtectedPath =
    path.startsWith('/dashboard') ||
    path.startsWith('/prof') ||
    path.startsWith('/etudiant') ||
    path.startsWith('/admin')

  // Redirection si non authentifié sur une page protégée
  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Contrôles d'accès par rôle
  if (user && isProtectedPath) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'student'

    // Accès /admin
    if (path.startsWith('/admin') && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'teacher' ? '/prof/dashboard' : '/etudiant/dashboard'
      return NextResponse.redirect(url)
    }

    // Accès /prof
    if (path.startsWith('/prof') && role !== 'teacher' && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/etudiant/dashboard'
      return NextResponse.redirect(url)
    }

    // Accès /etudiant
    if (path.startsWith('/etudiant') && role !== 'student' && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/prof/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
