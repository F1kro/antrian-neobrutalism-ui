import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Jangan simpan client ini sebagai global.
  // Aku selalu bikin baru per request.
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
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Jangan sisipin logic di antara createServerClient dan
  // supabase.auth.getUser(), biar bug logout random gak kejadian.
  // Ini penting buat jaga session tetap stabil.

  // Kalau getUser() dihapus saat SSR, session bisa kacau.
  // Dampaknya user bisa tiba-tiba logout.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    // Kalau belum login dan masuk route privat, aku arahkan ke login.
    request.nextUrl.pathname.startsWith('/protected') &&
    !user
  ) {
    // Kalau user kosong, respons defaultnya redirect login.
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Aku wajib return supabaseResponse asli.
  // Kalau bikin response baru, cookie wajib ikut disalin.
  // 1) Kirim request saat NextResponse.next().
  //    const myNewResponse = NextResponse.next({ request })
  // 2) Salin semua cookie dari supabaseResponse.
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3) Boleh ubah response lain, jangan otak-atik cookie.
  //    cookie tetap apa adanya.
  // 4) Terakhir, return response barunya.
  //    return myNewResponse
  // Kalau tidak, state browser vs server bisa beda.
  // Efeknya session user bisa putus lebih cepat.

  return supabaseResponse
}

