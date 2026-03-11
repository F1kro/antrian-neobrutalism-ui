'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { getCancelReason } from '@/lib/queue-status'
import Link from 'next/link'
import { CheckCircle2, Monitor, Clock, Download, Calendar, HomeIcon, ShieldAlert } from 'lucide-react'

interface BookingDetail {
  id: string
  booking_number: string
  visitor_name: string
  visitor_phone: string
  service_id: string
  queue_position: number
  status: string
  created_at: string
  booking_date: string 
  booking_time: string 
  cancel_reason?: string | null
  notes?: string | null
  cancelled_at?: string | null
  service?: {
    name: string
    estimated_duration: number
  }
}

export default function BookingConfirmationPage() {
  const params = useParams()
  const bookingId = params.id as string
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [qrGenerated, setQrGenerated] = useState(false)
  const qrRef = useRef<HTMLCanvasElement>(null)

  const generateQRCode = async (serviceId: string) => {
    if (qrRef.current && !qrGenerated) {
      try {
        const monitorUrl = `${window.location.origin}/monitor?service=${serviceId}`
        await QRCode.toCanvas(qrRef.current, monitorUrl, {
          width: 200,
          margin: 2,
          color: { dark: '#4f46e5', light: '#ffffff' },
        })
        setQrGenerated(true)
      } catch (error) {
        console.error('Error generating QR code:', error)
      }
    }
  }

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id, booking_number, visitor_name, visitor_phone, service_id,
            queue_position, status, created_at, booking_date, booking_time,
            services:service_id (name, estimated_duration)
          `)
          .eq('id', bookingId)
          .single()

        if (error) throw error
        setBooking({ ...data, service: data.services })
      } catch (err) {
        console.error('Error fetching booking:', err)
      } finally {
        setLoading(false)
      }
    }

    if (bookingId) fetchBooking()
  }, [bookingId])

  useEffect(() => {
    if (booking?.service_id && qrRef.current) {
      generateQRCode(booking.service_id)
    }
  }, [booking, qrGenerated])

  const handleDownloadQR = () => {
    if (!qrRef.current) return
    const canvas = qrRef.current
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `QR-Antrean-${booking?.booking_number}.png`
    link.href = url
    link.click()
  }

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatDateTime = (dateStr?: string | null) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

  if (loading) return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-black uppercase text-xs md:text-sm tracking-widest">Menyiapkan Tiket...</p>
      </div>
    </main>
  )

  if (!booking) return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
       <Card className="bg-card border-black text-foreground rounded-[2rem] p-6 text-center">
          <p className="text-red-400 font-bold mb-4">Antrean tidak ditemukan.</p>
          <Link href="/booking"><Button className="bg-primary">Booking Ulang</Button></Link>
       </Card>
    </main>
  )

  const isCancelled = booking.status === "cancelled"
  const cancelledByAdmin = isCancelled && Boolean(booking.notes) && !booking.cancel_reason
  const cancellationReason = getCancelReason(booking)
  const heroSubtitle = isCancelled
    ? "Antrean ini telah dibatalkan. Lihat detail alasan dan status di bawah."
    : "Simpan tiket ini dan tunjukkan kepada petugas 5 menit sebelum jadwal kedatangan."

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-10 font-sans pb-20">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <div className={`flex flex-col items-center p-6 md:p-8 rounded-[2.5rem] text-center text-white space-y-4 animate-in fade-in zoom-in duration-500 ${isCancelled ? "bg-red-600" : "bg-primary"}`}>
          <div className="flex justify-center">
            <div className={`p-4 rounded-full border-4 ${isCancelled ? "bg-red-500/10 border-red-500/50" : "bg-primary/10 border-black/70"}`}>
                {isCancelled ? (
                  <ShieldAlert className="h-14 w-14 text-red-100" />
                ) : (
                  <CheckCircle2 className="h-14 w-14 text-primary" />
                )}
            </div>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">
            {isCancelled ? "Antrean Dibatalkan!" : "Booking Berhasil!"}
          </h1>
          <p className="text-xs md:text-sm font-semibold text-white/70 leading-tight">
            {heroSubtitle}
          </p>
          {isCancelled && (
            <p className="text-[11px] uppercase tracking-[0.4em] text-white/60">
              Dibatalkan oleh {cancelledByAdmin ? "Admin" : "Anda"}
            </p>
          )}
        </div>

        {isCancelled && (
          <div className="space-y-2 bg-red-500/5 border border-red-500/30 rounded-2xl p-4 text-left">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.45em] text-red-500">
              <ShieldAlert size={14} />
              <span>Status Dibatalkan</span>
            </div>
            <p className="text-base font-black text-red-700">
              Alasan: {cancellationReason}
            </p>
            <p className="text-[12px] text-foreground/70">
              Dibatalkan oleh {cancelledByAdmin ? "Admin" : "Anda"}
              {booking.cancelled_at ? ` pada ${formatDateTime(booking.cancelled_at)}` : ""}.
            </p>
          </div>
        )}

        <Card className="bg-card/50 border border-black rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-xl">
          <CardContent className="p-6 md:p-8 space-y-8">
            
            <div className="flex flex-col items-center gap-6 p-6 md:p-8 bg-primary rounded-[2.5rem] text-center">
              <div>
                <p className="text-white/80 text-xs md:text-sm font-black uppercase tracking-widest">Nomor Antrean</p>
                <h2 className="text-5xl md:text-7xl font-black text-foreground font-mono tracking-tighter">{booking.booking_number}</h2>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full border border-white/20">
                  <Clock size={16} className="text-foreground" />
                  <span className="text-xl font-black text-foreground uppercase">{booking.booking_time} WITA</span>
                </div>
                <p className="text-xs md:text-sm font-bold text-white/80 mt-2 uppercase tracking-widest">
                  {formatDate(booking.booking_date)}
                </p>
              </div>
              
              <div className="bg-white p-3 rounded-2xl border-4 border-black/20 w-full max-w-[220px] flex items-center justify-center">
                <canvas 
                  ref={qrRef} 
                  className="w-full h-auto"
                  style={{ maxWidth: '200px', aspectRatio: '1/1' }}
                />
              </div>
              
              <Button 
                onClick={handleDownloadQR} 
                variant="secondary" 
                className="bg-white/10 hover:bg-white/20 text-foreground border-2 border-black rounded-xl font-bold uppercase text-xs md:text-sm gap-2 w-full max-w-xs"
              >
                 <Download size={14}/> Unduh QR Code
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-background/50 border border-black rounded-2xl">
                <p className="text-xs md:text-sm font-black text-foreground/70 uppercase flex items-center gap-2"><Calendar size={14}/> Tanggal</p>
                <p className="text-base md:text-lg font-bold text-foreground uppercase">{formatDate(booking.booking_date)}</p>
              </div>
              <div className="p-5 bg-background/50 border border-black rounded-2xl">
                <p className="text-xs md:text-sm font-black text-foreground/70 uppercase flex items-center gap-2"><Clock size={14}/> Jam Kedatangan</p>
                <p className="text-base md:text-lg font-bold text-primary uppercase">{booking.booking_time} WITA</p>
              </div>
              <div className="p-5 bg-background/50 border border-black rounded-2xl">
                <p className="text-xs md:text-sm font-black text-foreground/70 uppercase">Nama Pengunjung</p>
                <p className="text-base md:text-lg font-bold text-foreground uppercase break-words">{booking.visitor_name}</p>
              </div>
              <div className="p-5 bg-background/50 border border-black rounded-2xl">
                <p className="text-xs md:text-sm font-black text-foreground/70 uppercase">Layanan</p>
                <p className="text-base md:text-lg font-bold text-primary uppercase break-words">{booking.service?.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="print:hidden">
          <Link href="/" className="w-full block">
            <Button className="w-full h-14 bg-primary hover:brightness-95 text-foreground font-black rounded-xl gap-3 uppercase text-xs md:text-sm shadow-xl">
              <HomeIcon size={18}/> Kembali ke Beranda
            </Button>
          </Link>
        </div>
        <div className="print:hidden">
          <Link href="/antrean" className="w-full block">
            <Button className="w-full h-14 bg-accent hover:brightness-95 text-black font-black rounded-xl gap-3 uppercase text-xs md:text-sm">
              <Monitor size={18}/> Cek Live Antrian
            </Button>
          </Link>
        </div>

        <div className="p-6 bg-primary/5 border border-black/40 rounded-2xl text-center">
           <p className="text-xs md:text-sm font-black text-primary uppercase tracking-widest mb-2">PENTING</p>
           <p className="text-xs md:text-sm font-medium text-foreground/70 italic px-2">
             Mohon hadir 5 menit sebelum jadwal <b>{booking.booking_time}</b>. Tunjukkan tiket ini kepada petugas.
           </p>
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </main>
  )
}
