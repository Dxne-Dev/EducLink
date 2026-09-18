import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  if (code) {
    const cookieStore = request.cookies
    let targetPath = '/login?verified=true'

    if (type === 'recovery') {
      targetPath = '/reset-password'
    }

    const response = NextResponse.redirect(`${origin}${targetPath}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // Pour recovery on va sur reset-password
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`, {
          headers: response.headers,
        })
      }

      // Récupérer le rôle de l'utilisateur pour une redirection directe
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      let dest = '/dashboard'
      if (profile?.role === 'admin') dest = '/admin/dashboard'
      else if (profile?.role === 'teacher') dest = '/prof/dashboard'
      else if (profile?.role === 'student') dest = '/etudiant/dashboard'

      return NextResponse.redirect(`${origin}${dest}`, {
        headers: response.headers,
      })
    }
  }

  // En cas d'erreur ou d'absence de code
  return NextResponse.redirect(`${origin}/login?error=verification_failed`)
}
