import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Aku selalu bikin client Supabase baru per request.
 * Biar session aman dan tidak nyangkut di state global.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Kalau ini kepanggil dari Server Component, aman di-skip.
            // Karena refresh session sudah ditangani di proxy.
            // Jadi user session tetap sinkron.
          }
        },
      },
    },
  )
}


