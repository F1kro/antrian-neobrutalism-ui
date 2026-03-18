// Endpoint logout admin.
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createClient()
    
    // Aku sign out sekalian hapus session.
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Logout error:', error)
      return NextResponse.json(
        { error: 'Gagal logout' },
        { status: 500 }
      )
    }

    // Aku balikin response dengan cookie yang sudah clear.
    const response = NextResponse.json(
      { message: 'Logout berhasil' },
      { status: 200 }
    )

    // Aku bersihin semua cookie auth.
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    response.cookies.delete('admin_last_active')
    
    return response
    
  } catch (error) {
    console.error('Logout route error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat logout' },
      { status: 500 }
    )
  }
}
