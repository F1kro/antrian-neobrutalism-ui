'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '@/components/admin/sidebar'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/textarea'
import { toast } from 'sonner'
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'

interface MaintenanceFlag {
  flag_key: string
  is_paused: boolean
  message: string | null
  updated_at: string
}

interface SecurityCheck {
  label: string
  status: string
  detail?: string
}

const formatWitaTimestamp = (timestamp: string) => {
  const target = new Date(new Date(timestamp).toLocaleString('en-US', { timeZone: 'Asia/Makassar' }))
  return target.toLocaleString('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  })
}

export default function MaintenancePage() {
  const supabase = createClient()
  const [maintenanceFlag, setMaintenanceFlag] = useState<MaintenanceFlag | null>(null)
  const [messageDraft, setMessageDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [pauseLoading, setPauseLoading] = useState(false)
  const [messageSaving, setMessageSaving] = useState(false)

  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [queueResponseTime, setQueueResponseTime] = useState<number | null>(null)
  const [healthStatus, setHealthStatus] = useState('Belum dicek')
  const [queueHealthStatus, setQueueHealthStatus] = useState('Belum dicek')
  const [metricsLoading, setMetricsLoading] = useState(false)

  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([
    { label: 'SQL Injection', status: 'Belum dicek' },
    { label: 'XSS (Cross-Site Scripting)', status: 'Belum dicek' },
    { label: 'CSRF / Request Forgery', status: 'Belum dicek' },
  ])
  const [securityLoading, setSecurityLoading] = useState(false)

  const fetchMaintenanceFlag = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('maintenance_flags')
      .select('*')
      .eq('flag_key', 'booking_pause')
      .single()

    setLoading(false)
    if (error) {
      toast.error('Gagal membaca status maintenance.')
      return
    }

    setMaintenanceFlag(data)
    setMessageDraft(data?.message || '')
  }

  const fetchMetrics = async () => {
    setMetricsLoading(true)
    try {
      const webStart = performance.now()
      await fetch('/', { cache: 'no-store' })
      setResponseTime(Math.round(performance.now() - webStart))

      const queueStart = performance.now()
      const { error } = await supabase.from('bookings').select('id', { count: 'exact', head: true }).limit(1)
      setQueueResponseTime(Math.round(performance.now() - queueStart))
      setHealthStatus(error ? 'Database tidak merespons (cek log)' : 'Semua layanan sehat')
      setQueueHealthStatus(error ? 'Database tidak merespons' : 'Antrian siap respons')
    } catch (error) {
      setHealthStatus('Tidak bisa menjangkau front-end')
      setQueueHealthStatus('Ping database gagal')
      setQueueResponseTime(null)
    } finally {
      setMetricsLoading(false)
    }
  }

  useEffect(() => {
    fetchMaintenanceFlag()
    fetchMetrics()
  }, [])

  const handleTogglePause = async () => {
    if (!maintenanceFlag) return
    setPauseLoading(true)
    const newStatus = !maintenanceFlag.is_paused
    const { data, error } = await supabase
      .from('maintenance_flags')
      .upsert({
        flag_key: 'booking_pause',
        is_paused: newStatus,
        message: messageDraft || maintenanceFlag.message,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    setPauseLoading(false)
    if (error || !data) {
      toast.error('Gagal mengubah status maintenance.')
      return
    }

    setMaintenanceFlag(data)
    toast.success(newStatus ? 'Booking dihentikan sementara.' : 'Booking aktif kembali.')
  }

  const handleSaveMessage = async () => {
    if (!maintenanceFlag) return
    setMessageSaving(true)
    const { data, error } = await supabase
      .from('maintenance_flags')
      .update({
        message: messageDraft,
        updated_at: new Date().toISOString(),
      })
      .eq('flag_key', 'booking_pause')
      .select()
      .single()

    setMessageSaving(false)
    if (error || !data) {
      toast.error('Gagal menyimpan pesan maintenance.')
      return
    }

    setMaintenanceFlag(data)
    toast.success('Pesan maintenance tersimpan.')
  }

  const runSecurityScan = async () => {
    setSecurityLoading(true)
    try {
      const res = await fetch('/api/maintenance/security')
      if (!res.ok) throw new Error('Gagal membaca status keamanan')
      const data = await res.json()

      if (!data?.success) {
        throw new Error(data?.message || 'Security check gagal dieksekusi')
      }

      if (!data?.checks?.length) {
        throw new Error('Hasil security check kosong')
      }

      setSecurityChecks((prev) =>
        prev.map((check) => {
          const fromApi = data.checks.find((item: SecurityCheck) => item.label === check.label)
          return fromApi || check
        }),
      )
      toast.success('Security check selesai')
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menjalankan security check')
    } finally {
      setSecurityLoading(false)
    }
  }

  const currentStatusBadgeClass = maintenanceFlag?.is_paused ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
  const currentStatusLabel = maintenanceFlag?.is_paused ? 'Booking Paused' : 'Booking Aktif'

  return (
    <div className="flex h-screen w-full bg-sidebar text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-sidebar">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
            <div>
              <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter leading-none">Maintenance Sistem</h2>
              <p className="text-primary/80 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
                Pengelolaan pause booking, monitoring metrik & keamanan
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em]">
              <span className="text-foreground/60">Status:</span>
              <Badge className={`rounded-full border border-black px-4 py-1 ${currentStatusBadgeClass}`}>
                {currentStatusLabel}
              </Badge>
            </div>
          </header>

          <div className="grid gap-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-card/40 border-black rounded-3xl border-2 p-6 shadow-lg flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={28} className="text-amber-500" />
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-foreground/60">Status Booking</p>
                    <p className="text-2xl font-black uppercase tracking-tight text-foreground">
                      {maintenanceFlag?.is_paused ? 'Dihentikan untuk Maintenance' : 'Aktif untuk Publik'}
                    </p>
                    <p className="text-sm text-foreground/70">
                  {maintenanceFlag?.message || 'Pesan belum ditetapkan.'}
                </p>
                {maintenanceFlag && (
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-foreground/60">
                    Terakhir diperbarui: {formatWitaTimestamp(maintenanceFlag.updated_at)}
                  </p>
                )}
                  </div>
                </div>
                <Badge
                  className={`w-fit rounded-full border border-black px-5 py-1 text-[10px] font-black uppercase tracking-[0.3em] ${currentStatusBadgeClass}`}
                >
                  {currentStatusLabel}
                </Badge>
              </Card>

              <Card className="bg-card/40 border-black rounded-3xl border-2 p-6 shadow-lg flex flex-col gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/70 font-black">Pause / Resume Booking</p>
                  <p className="text-lg font-black uppercase tracking-tight">Kelola antrean publik</p>
                </div>
                <Textarea
                  value={messageDraft}
                  onChange={(event) => setMessageDraft(event.target.value)}
                  placeholder="Tuliskan pesan maintenance yang akan ditampilkan di booking page."
                  className="min-h-[200px] text-sm leading-relaxed bg-background/80 placeholder:text-foreground/60"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="uppercase tracking-[0.3em] font-black rounded-xl border-2 border-black shadow-[4px_4px_0_#000] px-4 py-3 bg-primary text-white hover:brightness-95 transition-colors focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSaveMessage}
                    disabled={messageSaving || !maintenanceFlag}
                  >
                    {messageSaving ? 'Menyimpan...' : 'Simpan Pesan'}
                  </Button>
                  <Button
                    size="sm"
                    className={`uppercase tracking-[0.3em] font-black rounded-xl border-2 border-black shadow-[4px_4px_0_#000] px-4 py-3 !text-white transition-colors ${
                      maintenanceFlag?.is_paused ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                    }`}
                    onClick={handleTogglePause}
                    disabled={!maintenanceFlag || pauseLoading}
                  >
                    {pauseLoading ? 'Memperbarui...' : maintenanceFlag?.is_paused ? 'Aktifkan Booking' : 'Pause Booking'}
                  </Button>
                </div>
              </Card>
            </div>

            <Card className="bg-card/40 border-black rounded-3xl border-2 p-6 shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/70 font-black">System Metrics</p>
                  <p className="text-lg font-black uppercase tracking-tight mt-1">Monitor response, antrean & kesehatan</p>
                </div>
                <Button
                  size="sm"
                  className={`uppercase tracking-[0.3em] font-black rounded-xl border-2 border-black shadow-[4px_4px_0_#000] px-4 py-3 text-white transition-colors ${
                    metricsLoading ? 'bg-neutral-500 border-neutral-600' : 'bg-primary hover:brightness-95'
                  }`}
                  onClick={fetchMetrics}
                  disabled={metricsLoading}
                >
                  {metricsLoading ? <Loader2 className="animate-spin" size={16} /> : 'Segarkan'}
                </Button>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="bg-background/60 border border-black p-4 rounded-2xl flex flex-col gap-1">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/70">Response Time (Web)</p>
                  <p className="text-3xl font-black text-foreground">{responseTime !== null ? `${responseTime} ms` : '--'}</p>
                  <p className="text-[11px] text-foreground/60">Ping landing page (cache bust).</p>
                </div>
                <div className="bg-background/60 border border-black p-4 rounded-2xl flex flex-col gap-1">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/70">Queue Response</p>
                  <p className="text-3xl font-black text-foreground">{queueResponseTime !== null ? `${queueResponseTime} ms` : '--'}</p>
                  <p className="text-[11px] text-foreground/60">Query supabase (bookings) + RLS.</p>
                </div>
                <div className="bg-background/60 border border-black p-4 rounded-2xl flex flex-col gap-1">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/70">Health Status</p>
                  <p className="text-base font-black uppercase">{healthStatus}</p>
                  <p className="text-[11px] text-foreground/60">{queueHealthStatus}</p>
                </div>
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-card/40 border-black rounded-3xl border-2 p-6 shadow-lg space-y-4">
                <div className="flex items-center gap-2">
                  <RefreshCw className="text-primary" size={18} />
                  <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/70 font-black">Security Checks</p>
                </div>
                <ul className="space-y-3 text-[11px]">
                  {securityChecks.map((check) => (
                    <li key={check.label} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black uppercase tracking-[0.1em]">{check.label}</span>
                        <Badge
                      className={`px-3 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] border border-black ${
                        check.status.includes('Belum') ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                      }`}
                        >
                          {check.status}
                        </Badge>
                      </div>
                      {check.detail && (
                        <p className="text-[10px] text-foreground/70 italic">{check.detail}</p>
                      )}
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  className={`uppercase tracking-[0.3em] font-black rounded-xl border-2 border-black shadow-[4px_4px_0_#000] px-4 py-3 !text-white transition-colors ${
                    securityLoading ? 'bg-neutral-500 border-neutral-600' : 'bg-primary hover:brightness-95'
                  }`}
                  onClick={runSecurityScan}
                  disabled={securityLoading}
                >
                  {securityLoading ? 'Memindai...' : 'Periksa Keamanan'}
                </Button>
              </Card>

              <Card className="bg-card/40 border-black rounded-3xl border-2 p-6 shadow-lg">
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-[0.3em] font-black text-foreground/70">Security Notes</p>
                  <ul className="space-y-1 text-[11px] text-foreground/80 list-disc list-inside marker:text-primary">
                    <li>SQL Injection: {securityChecks[0]?.status || 'Belum dicek'}</li>
                    <li>XSS: {securityChecks[1]?.status || 'Belum dicek'}</li>
                    <li>CSRF / Token: {securityChecks[2]?.status || 'Belum dicek'}</li>
                    <li>Front-end ping: {responseTime !== null ? `${responseTime} ms` : 'Belum dicek'}</li>
                    <li>Antrian response: {queueResponseTime !== null ? `${queueResponseTime} ms` : 'Belum dicek'}</li>
                    <li>DB health: {queueHealthStatus}</li>
                    <li>Maintenance flag ready: {maintenanceFlag ? 'Siap' : 'Belum ada flag'}</li>
                  </ul>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
