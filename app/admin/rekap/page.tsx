'use client'
import React, { useState, useEffect, useMemo } from "react"
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/admin/sidebar'
import { createLog } from "@/lib/logger"
import * as XLSX from 'xlsx'
import { 
  FileDown, 
  Search, 
  Calendar, 
  Filter, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  ArrowUpDown,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export default function RekapAntrean() {
  const supabase = createClient()
  const [data, setData] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  const [filterPeriode, setFilterPeriode] = useState('semua')
  const [filterLayanan, setFilterLayanan] = useState('semua')
  const [filterSlot, setFilterSlot] = useState('semua')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Slot waktu standar yang kupakai di sistem.
  const TIME_SLOTS = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30"
  ];

  const fetchData = async () => {
    setLoading(true)
    const [bookingRes, serviceRes] = await Promise.all([
      supabase.from('bookings').select('*, services(name)').order('created_at', { ascending: sortOrder === 'asc' }),
      supabase.from('services').select('*').order('name')
    ])
    setData(bookingRes.data || [])
    setServices(serviceRes.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [sortOrder])

  const filteredData = useMemo(() => {
    const result = data.filter(item => {
      const date = new Date(item.created_at)
      const now = new Date()
      
      const matchesSearch = item.visitor_name.toLowerCase().includes(search.toLowerCase()) ||
                            item.booking_number.toLowerCase().includes(search.toLowerCase())
      
      const matchesLayanan = filterLayanan === 'semua' || item.service_id === filterLayanan
      const matchesSlot = filterSlot === 'semua' || item.booking_time === filterSlot

      let matchesPeriode = true
      if (filterPeriode === 'hari-ini') {
        matchesPeriode = date.toDateString() === now.toDateString()
      } else if (filterPeriode === 'minggu-ini') {
        const weekAgo = new Date()
        weekAgo.setDate(now.getDate() - 7)
        matchesPeriode = date >= weekAgo
      } else if (filterPeriode === 'bulan-ini') {
        matchesPeriode = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      }

      return matchesSearch && matchesLayanan && matchesPeriode && matchesSlot
    })
    setCurrentPage(1)
    return result
  }, [data, search, filterLayanan, filterPeriode, filterSlot])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredData.slice(start, start + itemsPerPage)
  }, [filteredData, currentPage])

  const downloadExcel = () => {
    try {
      const report = filteredData.map(d => ({
        'Tanggal': new Date(d.created_at).toLocaleDateString('id-ID'),
        'Slot Waktu': d.booking_time || '-',
        'Nomor Antrean': d.booking_number,
        'Nama Pengunjung': d.visitor_name,
        'No. Telepon': d.visitor_phone,
        'Keperluan/Layanan': d.services?.name,
        'Status': d.status.toUpperCase()
      }))
      const ws = XLSX.utils.json_to_sheet(report)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Antrean")
      XLSX.writeFile(wb, `Rekap_Antrean_${new Date().getTime()}.xlsx`)

      createLog('PRINT_REKAP', `Admin mengunduh rekap antrean (Total: ${filteredData.length} data)`, 'info')
    } catch (error: any) {
      createLog('ERROR', `Gagal mengunduh rekap: ${error.message}`, 'error')
    }
  }

  return (
    <div className="flex h-screen w-full bg-sidebar text-foreground overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-sidebar">
        <div className="flex-1 overflow-y-auto bg-sidebar p-4 md:p-6 space-y-6 custom-scrollbar">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
            <div>
              <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter">Rekap Antrean</h2>
              <p className="text-primary/80 text-[10px] font-bold uppercase tracking-[0.2em]">Arsip Data Pengunjung & Slot Booking</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                variant="outline" 
                className="bg-card border-black text-muted-foreground hover:text-blue-700 font-bold text-[10px] uppercase h-10 px-4 rounded-xl gap-2"
              >
                {sortOrder === 'desc' ? <SortDesc size={16}/> : <SortAsc size={16}/>}
                Urutan: {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}
              </Button>
              <Button 
                onClick={downloadExcel} 
                size="sm" 
                className="h-10 px-6 bg-primary hover:brightness-95 text-foreground font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-black/20 gap-2 transition-all active:scale-95 border-b-4 border-black"
              >
                <FileDown size={16} /> 
                <span>Print Excel</span>
              </Button>
            </div>
          </header>

          <div className="bg-card/40 border border-black p-4 rounded-3xl backdrop-blur-xl shrink-0">
            <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-2 xl:flex-1">
                {/* Search */}
                <div className="w-full">
                  <label className="flex items-center gap-1.5 text-[9px] font-black text-foreground/70 uppercase tracking-widest ml-1 mb-1.5">
                    <Search size={11} className="text-primary"/> Cari Data
                  </label>
                  <Input 
                    placeholder="Nama / Nomor..." 
                    className="bg-background/50 border-black h-10 px-3.5 text-foreground rounded-xl text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* Periode */}
                <div className="w-full">
                  <label className="flex items-center gap-1.5 text-[9px] font-black text-foreground/70 uppercase tracking-widest ml-1 mb-1.5">
                    <Calendar size={11} className="text-primary"/> Periode
                  </label>
                  <Select value={filterPeriode} onValueChange={setFilterPeriode}>
                    <SelectTrigger className="w-full h-10 bg-background/50 border-black text-foreground rounded-xl font-bold uppercase text-[9px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-black text-foreground">
                      <SelectItem value="semua">Semua Waktu</SelectItem>
                      <SelectItem value="hari-ini">Hari Ini</SelectItem>
                      <SelectItem value="minggu-ini">Minggu Ini</SelectItem>
                      <SelectItem value="bulan-ini">Bulan Ini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Layanan */}
                <div className="w-full">
                  <label className="flex items-center gap-1.5 text-[9px] font-black text-foreground/70 uppercase tracking-widest ml-1 mb-1.5">
                    <Filter size={11} className="text-primary"/> Layanan
                  </label>
                  <Select value={filterLayanan} onValueChange={setFilterLayanan}>
                    <SelectTrigger className="w-full h-10 bg-background/50 border-black text-foreground rounded-xl font-bold uppercase text-[9px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-black text-foreground">
                      <SelectItem value="semua">Semua Layanan</SelectItem>
                      {services.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Slot waktu */}
                <div className="w-full">
                  <label className="flex items-center gap-1.5 text-[9px] font-black text-foreground/70 uppercase tracking-widest ml-1 mb-1.5">
                    <Clock size={11} className="text-primary"/> Slot
                  </label>
                  <Select value={filterSlot} onValueChange={setFilterSlot}>
                    <SelectTrigger className="w-full h-10 bg-background/50 border-black text-foreground rounded-xl font-bold uppercase text-[9px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-black text-foreground">
                      <SelectItem value="semua">Semua Slot</SelectItem>
                      {TIME_SLOTS.map(slot => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="h-10 min-w-[140px] self-start xl:self-end flex items-center justify-center px-5 bg-card border-2 border-black rounded-xl shadow-[4px_4px_0_var(--color-border)]">
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                  Total: <span className="text-primary text-lg ml-1 tabular-nums">{filteredData.length}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-card/40 border border-black rounded-3xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-xl border-2">
            <div className="overflow-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-background text-[9px] font-black uppercase text-foreground/70 tracking-widest border-b border-black z-10">
                  <tr>
                    <th className="px-5 py-4">Waktu & Tanggal</th>
                    <th className="px-5 py-4 text-center">Slot</th>
                    <th className="px-5 py-4">No. Antrean</th>
                    <th className="px-5 py-4">Nama Lengkap</th>
                    <th className="px-5 py-4">Layanan</th>
                    <th className="px-5 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/15">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <Loader2 className="animate-spin mx-auto mb-2 text-primary" size={24} />
                      </td>
                    </tr>
                  ) : paginatedData.map(d => (
                    <tr key={d.id} className="hover:bg-accent/40 transition-colors group">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <p className="text-foreground font-bold text-xs">{new Date(d.created_at).toLocaleDateString('id-ID')}</p>
                        <p className="text-[9px] text-foreground/70 font-mono italic">{new Date(d.created_at).toLocaleTimeString('id-ID')}</p>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge variant="outline" className="bg-background border-black text-primary font-mono text-[10px] px-2">
                          {d.booking_time || '--:--'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-lg font-mono font-black text-primary">{d.booking_number}</span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-black text-foreground uppercase text-xs truncate max-w-[150px]">{d.visitor_name}</p>
                        <p className="text-[9px] text-foreground/70 tabular-nums">{d.visitor_phone}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-block bg-background/50 px-3 py-1 rounded-lg border border-black text-[8px] font-bold text-muted-foreground uppercase">
                          {d.services?.name}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge className={`
                          ${d.status === 'completed' ? 'bg-emerald-600 text-white border-black' : 
                            d.status === 'in_progress' ? 'bg-primary text-white border-black' : 
                            d.status === 'cancelled' ? 'bg-red-600 text-white border-black' : 
                            'bg-amber-400 text-white border-black'}
                          border px-3 py-0.5 font-black text-[8px] tracking-wider rounded-md
                        `}>
                          {d.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="bg-background/50 p-4 border-t border-black flex justify-between items-center shrink-0">
              <p className="text-[10px] font-black text-foreground/70 uppercase tracking-widest">
                Halaman <span className="text-primary">{currentPage}</span> dari {totalPages || 1}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="h-9 w-9 p-0 bg-primary border-black text-primary-foreground [&_svg]:text-primary-foreground rounded-xl transition-all hover:brightness-95"
                >
                  <ChevronLeft size={18} />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage >= totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="h-9 w-9 p-0 bg-primary border-black text-primary-foreground [&_svg]:text-primary-foreground rounded-xl transition-all hover:brightness-95"
                >
                  <ChevronRight size={18} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

