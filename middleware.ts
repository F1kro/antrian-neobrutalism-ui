// middleware.ts (di root project, sejajar dengan app/)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isLoginPage = request.nextUrl.pathname === '/admin/login'
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')

  // Skip middleware untuk API routes
  if (isApiRoute) {
    return response
  }

  // ✅ SECURITY FIX: Gunakan getUser() bukan getSession()
  // getUser() authenticates dengan Supabase Auth server, lebih secure!
  // getSession() hanya baca dari cookies yang bisa di-manipulasi
  const { data: { user }, error } = await supabase.auth.getUser()
  const now = Date.now()
  const idleTimeoutMs = 30 * 60 * 1000
  const lastActiveCookie = request.cookies.get('admin_last_active')?.value
  const lastActiveTimestamp = lastActiveCookie ? Number(lastActiveCookie) : now
  const hasTimedOut =
    lastActiveTimestamp &&
    !Number.isNaN(lastActiveTimestamp) &&
    now - lastActiveTimestamp > idleTimeoutMs

  if (hasTimedOut && isAdminRoute && !isLoginPage && user && !error) {
    await supabase.auth.signOut()
    const redirectUrl = new URL('/admin/login', request.url)
    const timeoutResponse = NextResponse.redirect(redirectUrl)
    timeoutResponse.cookies.set({
      name: 'admin_last_active',
      value: '',
      path: '/admin',
      maxAge: 0,
      httpOnly: true,
    })
    timeoutResponse.cookies.delete('sb-access-token')
    timeoutResponse.cookies.delete('sb-refresh-token')
    return timeoutResponse
  }

  // Jika akses halaman admin (bukan login) tapi tidak ada user atau error auth
  if (isAdminRoute && !isLoginPage && (!user || error)) {
    const redirectUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Jika sudah login dan akses halaman login, redirect ke dashboard
  if (isLoginPage && user && !error) {
    const redirectUrl = new URL('/admin/dashboard', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Verifikasi admin role untuk halaman admin (RECOMMENDED untuk security)
  if (isAdminRoute && !isLoginPage && user && !error) {
    try {
      const { data: adminProfile } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', user.id)
        .single()

      // Jika bukan admin, redirect ke login
      if (!adminProfile) {
        const redirectUrl = new URL('/admin/login', request.url)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Middleware error:', error)
      // Jika error checking admin, redirect ke login untuk safety
      const redirectUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  if (user && !error && isAdminRoute && !isLoginPage) {
    response.cookies.set({
      name: 'admin_last_active',
      value: String(now),
      path: '/admin',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: idleTimeoutMs / 1000,
      secure: process.env.NODE_ENV === 'production',
    })
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
