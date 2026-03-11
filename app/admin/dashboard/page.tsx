'use client'
import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/admin/sidebar'
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  BarChart3,
  Activity,
  History,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type BookingStatus = 'waiting' | 'in_progress' | 'completed' | 'cancelled'

interface Booking {
  id: string
  created_at: string
  status: BookingStatus
  service_id: string
  booking_date: string
  services: {
    name: string
    estimated_duration: number
  }
}

interface ServiceStats {
  service_name: string
  total_bookings: number
  completed: number
  cancelled: number
  waiting: number
}

interface SystemLogItem {
  id: string
  created_at: string
  action_type: string
  message: string
  status: 'info' | 'warning' | 'error'
}

// Logika waktu WITA.
const getWitaNow = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Makassar" }));
};

const getWitaDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function AdminDashboard() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<any[]>([])
  const [recentLogs, setRecentLogs] = useState<SystemLogItem[]>([])
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today')
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3

  const fetchData = async () => {
    setLoading(true)
    const [bookingsRes, servicesRes, logsRes] = await Promise.all([
      supabase.from('bookings').select('*, services(name, estimated_duration)').order('created_at', { ascending: false }),
      supabase.from('services').select('*'),
      supabase.from('system_logs').select('id, created_at, action_type, message, status').order('created_at', { ascending: false }).limit(6),
    ])
    setBookings(bookingsRes.data || [])
    setServices(servicesRes.data || [])
    setRecentLogs((logsRes.data || []) as SystemLogItem[])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    
    const channel = supabase
      .channel('bookings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filteredBookings = bookings.filter(b => {
    const nowWita = getWitaNow();
    const todayString = getWitaDateString(nowWita);
    const bDateStr = b.booking_date || getWitaDateString(new Date(b.created_at));

    if (period === 'today') {
      return bDateStr === todayString;
    } else if (period === 'week') {
      const weekAgo = new Date(nowWita);
      weekAgo.setDate(nowWita.getDate() - 7);
      const bookingFullDate = new Date(b.created_at);
      return bookingFullDate >= weekAgo && bookingFullDate <= nowWita;
    } else if (period === 'month') {
      const bDate = new Date(b.created_at);
      return bDate.getMonth() === nowWita.getMonth() && bDate.getFullYear() === nowWita.getFullYear();
    }
    return true;
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [period])

  const totalBookings = filteredBookings.length
  const completedBookings = filteredBookings.filter(b => b.status === 'completed').length
  const cancelledBookings = filteredBookings.filter(b => b.status === 'cancelled').length
  const waitingBookings = filteredBookings.filter(b => b.status === 'waiting').length
  const inProgressBookings = filteredBookings.filter(b => b.status === 'in_progress').length

  const completionRate = totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : '0'

  const serviceStats: ServiceStats[] = services.map(service => {
    const serviceBookings = filteredBookings.filter(b => b.service_id === service.id)
    
    return {
      service_name: service.name,
      total_bookings: serviceBookings.length,
      completed: serviceBookings.filter(b => b.status === 'completed').length,
      cancelled: serviceBookings.filter(b => b.status === 'cancelled').length,
      waiting: serviceBookings.filter(b => b.status === 'waiting' || b.status === 'in_progress').length,
    }
  }).sort((a, b) => b.total_bookings - a.total_bookings)

  const topServices = serviceStats.slice(0, 5)
  const maxBookings = Math.max(...topServices.map(s => s.total_bookings), 1)

  const totalPages = Math.ceil(serviceStats.length / itemsPerPage)
  const paginatedServiceStats = serviceStats.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const visibleRecentLogs = recentLogs.slice(0, 4)

  const statusDistribution = [
    { label: 'Menunggu', value: waitingBookings, color: 'bg-amber-600', textColor: 'text-amber-700' },
    { label: 'Sedang Dilayani', value: inProgressBookings, color: 'bg-blue-700', textColor: 'text-blue-800' },
    { label: 'Selesai', value: completedBookings, color: 'bg-emerald-700', textColor: 'text-emerald-800' },
    { label: 'Dibatalkan', value: cancelledBookings, color: 'bg-red-700', textColor: 'text-red-800' },
  ]

  const getPeriodLabel = () => {
    switch(period) {
      case 'today': return 'Hari Ini'
      case 'week': return 'Minggu Ini'
      case 'month': return 'Bulan Ini'
      default: return 'Hari Ini'
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-sidebar text-foreground overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={48} />
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">Memuat Dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full bg-sidebar text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-sidebar">
        <div className="flex-1 overflow-y-auto bg-sidebar p-4 md:p-6 space-y-6 custom-scrollbar">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
            <div>
              <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter">Dashboard Analitik</h2>
              <p className="text-primary/80 text-[10px] font-bold uppercase tracking-[0.2em]">
                Monitoring & Statistik Real-Time (WITA)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black text-foreground/70 uppercase tracking-widest">Periode:</span>
              <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                <SelectTrigger className="w-[160px] h-10 bg-background/50 border-black text-foreground rounded-xl font-bold uppercase text-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-black text-foreground rounded-xl">
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="week">Minggu Ini</SelectItem>
                  <SelectItem value="month">Bulan Ini</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-primary border-black/70 p-6 rounded-3xl">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/15 rounded-2xl border border-black/20">
                  <Users className="text-white" size={24} />
                </div>
                <Badge className="bg-white text-primary border-black text-[8px] font-black">{getPeriodLabel()}</Badge>
              </div>
              <h3 className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-2">Total Antrean</h3>
              <p className="text-4xl font-black text-white mb-1">{totalBookings}</p>
            </Card>

            <Card className="bg-emerald-600 border-black p-6 rounded-3xl">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/15 rounded-2xl border border-black/20">
                  <CheckCircle2 className="text-white" size={24} />
                </div>
                <Badge className="bg-white text-emerald-700 border-black text-[8px] font-black">{completionRate}%</Badge>
              </div>
              <h3 className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-2">Selesai Dilayani</h3>
              <p className="text-4xl font-black text-white mb-1">{completedBookings}</p>
            </Card>

            <Card className="bg-amber-400 border-black p-6 rounded-3xl">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/15 rounded-2xl border border-black/20">
                  <Clock className="text-white" size={24} />
                </div>
                <Badge className="bg-white text-amber-700 border-black text-[8px] font-black animate-pulse">LIVE</Badge>
              </div>
              <h3 className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-2">Aktif Sekarang</h3>
              <p className="text-4xl font-black text-white mb-1">{waitingBookings + inProgressBookings}</p>
            </Card>

            <Card className="bg-red-600 border-black p-6 rounded-3xl">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/15 rounded-2xl border border-black/20">
                  <XCircle className="text-white" size={24} />
                </div>
                <Badge className="bg-white text-red-700 border-black text-[8px] font-black">
                  {totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : '0'}%
                </Badge>
              </div>
              <h3 className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-2">Dibatalkan</h3>
              <p className="text-4xl font-black text-white mb-1">{cancelledBookings}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/40 border-black p-6 rounded-3xl backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/20 rounded-xl"><TrendingUp className="text-primary" size={20} /></div>
                <div>
                  <h3 className="text-lg font-black text-foreground uppercase">Layanan Terpopuler</h3>
                  <p className="text-[9px] text-foreground/70 font-bold uppercase tracking-widest">Top 5 {getPeriodLabel()}</p>
                </div>
              </div>
              <div className="space-y-4">
                {topServices.length === 0 ? <p className="text-foreground/70 text-center py-8 text-sm">Belum ada data</p> : 
                  topServices.map((service, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-black text-slate-900 w-8">#{idx + 1}</span>
                          <div>
                            <p className="text-sm font-bold text-foreground uppercase">{service.service_name}</p>
                            <p className="text-[9px] text-foreground/70 font-bold">{service.completed} selesai • {service.cancelled} batal</p>
                          </div>
                        </div>
                        <Badge className="bg-primary/20 text-slate-900 border-black text-xs font-black px-3">{service.total_bookings}</Badge>
                      </div>
                      <div className="h-2 bg-black/15 border border-black/25 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(service.total_bookings / maxBookings) * 100}%` }} />
                      </div>
                    </div>
                  ))
                }
              </div>
            </Card>

            <Card className="bg-card/40 border-black p-6 rounded-3xl backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/20 rounded-xl"><Activity className="text-emerald-400" size={20} /></div>
                <div>
                  <h3 className="text-lg font-black text-foreground uppercase">Distribusi Status</h3>
                  <p className="text-[9px] text-foreground/70 font-bold uppercase tracking-widest">Breakdown {getPeriodLabel()}</p>
                </div>
              </div>
              <div className="space-y-4">
                {statusDistribution.map((status, idx) => {
                  const percentage = totalBookings > 0 ? ((status.value / totalBookings) * 100).toFixed(1) : '0'
                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full border border-black/30 ${status.color}`} />
                          <p className="text-sm font-bold text-foreground uppercase">{status.label}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-foreground">{percentage}%</span>
                          <Badge className="bg-primary/20 text-slate-900 border-black text-xs font-black px-3">{status.value}</Badge>
                        </div>
                      </div>
                      <div className="h-2 bg-black/15 border border-black/25 rounded-full overflow-hidden">
                        <div className={`h-full ${status.color} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2 bg-card/40 border-black rounded-3xl overflow-hidden backdrop-blur-xl flex min-h-[32rem] flex-col">
            <div className="p-6 border-b border-black shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-xl"><BarChart3 className="text-amber-400" size={20} /></div>
                <div>
                  <h3 className="text-lg font-black text-foreground uppercase">Performa Semua Layanan</h3>
                  <p className="text-[9px] text-foreground/70 font-bold uppercase tracking-widest">Analisis Detail {getPeriodLabel()}</p>
                </div>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
              <table className="w-full">
                <thead className="bg-background text-[9px] font-black uppercase text-foreground/70 tracking-widest">
                  <tr>
                    <th className="px-6 py-4 text-left">Layanan</th>
                    <th className="px-6 py-4 text-center">Total</th>
                    <th className="px-6 py-4 text-center text-emerald-400">Selesai</th>
                    <th className="px-6 py-4 text-center text-red-400">Dibatalkan</th>
                    <th className="px-6 py-4 text-center text-amber-400">Proses/Tunggu</th>
                    <th className="px-6 py-4 text-center">Success Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/15">
                  {serviceStats.length === 0 ? <tr><td colSpan={6} className="px-6 py-8 text-center text-foreground/70 text-sm">Belum ada data</td></tr> : 
                    paginatedServiceStats.map((service, idx) => {
                      const successRate = service.total_bookings > 0 ? ((service.completed / service.total_bookings) * 100).toFixed(1) : '0'
                      return (
                        <tr key={idx} className="hover:bg-accent/40 transition-colors">
                          <td className="px-6 py-4"><p className="text-sm font-bold text-foreground uppercase">{service.service_name}</p></td>
                          <td className="px-6 py-4 text-center"><Badge className="bg-primary/20 text-slate-800 border-black text-xs font-black">{service.total_bookings}</Badge></td>
                          <td className="px-6 py-4 text-center"><Badge className="bg-emerald-500/20 text-slate-800 border-emerald-500/30 text-xs font-black">{service.completed}</Badge></td>
                          <td className="px-6 py-4 text-center"><Badge className="bg-red-500/20 text-slate-800 border-red-500/30 text-xs font-black">{service.cancelled}</Badge></td>
                          <td className="px-6 py-4 text-center"><Badge className="bg-amber-500/20 text-slate-800 border-amber-500/30 text-xs font-black">{service.waiting}</Badge></td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 bg-background border border-black/30 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${parseFloat(successRate) >= 80 ? 'bg-emerald-700' : parseFloat(successRate) >= 50 ? 'bg-amber-600' : 'bg-red-700'}`} style={{ width: `${successRate}%` }} />
                              </div>
                              <span className="text-xs font-bold text-foreground w-12 text-right">{successRate}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
            {serviceStats.length > 0 && (
              <div className="mt-auto bg-background/50 p-4 border-t border-black flex justify-between items-center shrink-0">
                <p className="text-[10px] font-black text-foreground/70 uppercase tracking-widest">Halaman {currentPage} dari {totalPages || 1} • Total {serviceStats.length} Layanan</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="h-8 w-8 p-0 bg-primary border-black text-primary-foreground hover:brightness-95 [&_svg]:text-primary-foreground disabled:opacity-50"><ChevronLeft size={16} /></Button>
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="h-8 w-8 p-0 bg-primary border-black text-primary-foreground hover:brightness-95 [&_svg]:text-primary-foreground disabled:opacity-50"><ChevronRight size={16} /></Button>
                </div>
              </div>
            )}
            </Card>
            <Card className="bg-card/40 border-black rounded-3xl overflow-hidden backdrop-blur-xl flex flex-col">
              <div className="p-6 border-b border-black shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-xl"><History className="text-primary" size={20} /></div>
                  <div>
                    <h3 className="text-lg font-black text-foreground uppercase">Log Terkini</h3>
                    <p className="text-[9px] text-foreground/70 font-bold uppercase tracking-widest">Aktivitas Sistem Terbaru</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {visibleRecentLogs.length === 0 ? (
                  <p className="text-center py-8 text-sm text-foreground/70 font-bold">Belum ada log terbaru</p>
                ) : (
                  visibleRecentLogs.map((log) => (
                    <div key={log.id} className="rounded-xl border border-black bg-background/60 p-3">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <Badge className={`text-[8px] font-black border-black ${
                          log.status === 'error'
                            ? 'bg-red-600 text-white'
                            : log.status === 'warning'
                              ? 'bg-amber-600 text-black'
                              : 'bg-primary/20 text-primary'
                        }`}>
                          {log.action_type}
                        </Badge>
                        <span className="text-[9px] font-black text-foreground/70">
                          {new Date(log.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            timeZone: 'Asia/Makassar',
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] leading-snug font-bold text-slate-800">{log.message}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

