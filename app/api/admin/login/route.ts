// Endpoint login admin.
import { createClient } from '@/lib/supabase/server' 
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // createClient di sini harus bisa baca/tulis cookie.
    const supabase = createClient()

    // 1) Aku validasi autentikasi dulu.
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { error: 'Email atau password salah' }, 
        { status: 401 }
      )
    }

    // 2) Aku cek role admin.
    // Aku pastiin user ini ada di tabel admin_users.
    const { data: adminProfile, error: profileError } = await supabase
      .from('admin_users')
      .select('role, name')
      .eq('id', authData.user.id)
      .single()

    // Kalau ada di Auth tapi bukan admin,
    if (profileError || !adminProfile) {
      // aku logout lagi karena akses ditolak.
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses administrator' }, 
        { status: 403 }
      )
    }

    // 3) Kalau lolos semua, login sukses.
    return NextResponse.json({
      message: 'Login berhasil',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: adminProfile.name,
        role: adminProfile.role
      }
    })

  } catch (error) {
    console.error('Login Route Error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 })
  }
}
