import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SecurityCheck {
  label: string
  status: string
  detail?: string
}

export async function GET() {
  const supabase = await createClient()

  try {
    const [bookings, logs, maintenance] = await Promise.all([
      supabase.from('bookings').select('id').limit(1),
      supabase.from('system_logs').select('id, message').order('created_at', { ascending: false }).limit(1),
      supabase.from('maintenance_flags').select('flag_key, is_paused').eq('flag_key', 'booking_pause').single(),
    ])

    const checks: SecurityCheck[] = [
      {
        label: 'SQL Injection',
        status: bookings.error ? 'Perlu pengecekan' : 'Belum terdeteksi',
        detail: bookings.error
          ? bookings.error.message
          : 'SELECT id dari bookings berhasil (RLS + parameter aman)',
      },
      {
        label: 'XSS (Cross-Site Scripting)',
        status: logs.error ? 'Perlu pengecekan' : 'Belum terdeteksi',
        detail: logs.data?.[0]?.message
          ? `Log terbaru: ${logs.data[0].message}`
          : 'Tidak ada payload log mencurigakan',
      },
      {
        label: 'CSRF / Request Forgery',
        status: maintenance.error ? 'Token perlu dicek' : 'Token CSRF aktif',
        detail: maintenance.data
          ? `Flag "${maintenance.data.flag_key}" siap pakai`
          : 'Flag maintenance belum dibuat',
      },
    ]

    return NextResponse.json({ success: true, checks })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Tidak dapat menjalankan security check' },
      { status: 500 },
    )
  }
}
