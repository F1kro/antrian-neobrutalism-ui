'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/admin/sidebar'
import { 
  History, 
  AlertCircle, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  Terminal,
  SortAsc,
  SortDesc,
  Filter
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function SystemLogsPage() {
  const supabase = createClient()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [filterAction, setFilterAction] = useState('semua') // Aku simpan state filter aksi.
  const itemsPerPage = 7 // Aku batasi 7 item per halaman.

  // Daftar tipe aksi dari logger.ts.
  const ACTION_TYPES = [
    'BOOKING', 'CALL', 'COMPLETE', 'CANCEL', 'SERVICE_CRUD', 'PRINT_REKAP', 'SYSTEM', 'ERROR'
  ]

  useEffect(() => {
    fetchLogs()
  }, [page, sortOrder, filterAction])

  const fetchLogs = async () => {
    setLoading(true)
    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    let query = supabase
      .from('system_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: sortOrder === 'asc' })
      .range(from, to)

    // Aku terapkan filter kalau bukan "semua".
    if (filterAction !== 'semua') {
      query = query.eq('action_type', filterAction)
    }

    const { data, error } = await query

    if (!error) setLogs(data)
    setLoading(false)
  }

  const getStatusIcon = (status: string) => {
  switch (status) {
    case 'error': return <AlertCircle className="text-white" size={14} />
    case 'warning': return <AlertCircle className="text-white" size={14} />
    default: return <Info className="text-white" size={14} />
  }
  }

  return (
    <div className="flex h-screen w-full bg-sidebar text-foreground overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-sidebar">
        <div className="flex-1 overflow-y-auto bg-sidebar p-4 md:p-6 space-y-6 custom-scrollbar">
          
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
            <div>
              <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter leading-none">Log Sistem</h2>
              <p className="text-primary/80 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
                Audit Trail & Monitoring Aktivitas (WITA)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filter jenis info */}
              <div className="flex items-center gap-2 h-10">
                <div className="h-10 w-10 rounded-xl border-2 border-black bg-card flex items-center justify-center shadow-[4px_4px_0_var(--color-border)]">
                  <Filter size={14} className="text-primary" />
                </div>
                <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setPage(1); }}>
                  <SelectTrigger className="w-[160px] h-10 bg-card border-black !rounded-xl text-[10px] font-black uppercase text-foreground/80 focus:ring-0">
                    <SelectValue placeholder="Jenis Aksi" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-black text-foreground">
                    <SelectItem value="semua" className="text-[10px] font-bold uppercase">Semua Aksi</SelectItem>
                    {ACTION_TYPES.map(type => (
                      <SelectItem key={type} value={type} className="text-[10px] font-bold uppercase">{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tombol sorting */}
              <Button 
                onClick={() => {
                  setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                  setPage(1);
                }}
                variant="outline" 
                className="bg-card border-black text-muted-foreground hover:text-foreground font-bold text-[10px] uppercase h-10 px-4 rounded-xl gap-2 shadow-xl"
              >
                {sortOrder === 'desc' ? <SortDesc size={16}/> : <SortAsc size={16}/>}
                Urutan: {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}
              </Button>

            </div>
          </header>

          <div className="flex-1 bg-card/40 border border-black rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl border-2 flex flex-col min-h-0">
            <div className="p-6 border-b border-black bg-background/30 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-xl">
                  <History className="text-primary" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground uppercase">History Aktivitas</h3>
                  <p className="text-[9px] text-foreground/70 font-bold uppercase tracking-widest">Urutan kejadian sistem terfilter</p>
                </div>
              </div>
            </div>

            <div className="overflow-auto flex-1 custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-background text-[9px] font-black uppercase text-foreground/70 tracking-widest border-b border-black/50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4">Waktu (WITA)</th>
                    <th className="px-6 py-4">Aksi</th>
                    <th className="px-6 py-4">Pesan</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/15">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-32 text-center">
                        <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={40} />
                        <p className="text-foreground/70 font-black uppercase text-[10px] tracking-widest">Sinkronisasi Log...</p>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-foreground/60 font-bold uppercase text-[10px] tracking-widest italic">
                        Tidak ada aktivitas ditemukan untuk filter ini
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-primary/[0.02] transition-colors border-b border-black/50 group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-mono text-[11px] text-primary font-bold leading-none">
                              {format(new Date(log.created_at), 'HH:mm:ss', { locale: id })}
                            </span>
                            <span className="text-[9px] text-foreground/60 font-bold mt-1">
                              {format(new Date(log.created_at), 'dd MMM yyyy', { locale: id })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="bg-background border-black text-muted-foreground text-[8px] font-black px-2 py-0.5 group-hover:border-black/50 transition-colors uppercase">
                            {log.action_type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-foreground/80 group-hover:text-foreground transition-colors leading-relaxed">
                            {log.message}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl border border-black shadow-inner ${
                            log.status === 'error'
                              ? 'bg-red-600 text-white'
                              : log.status === 'warning'
                                ? 'bg-amber-400 text-white'
                                : 'bg-primary text-white'
                          }`}>
                            {getStatusIcon(log.status)}
                            <span className="text-[9px] font-black uppercase tracking-wider text-white">
                              {log.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-background/50 p-4 border-t border-black flex justify-between items-center shrink-0">
              <p className="text-[10px] font-black text-foreground/70 uppercase tracking-widest">
                Halaman <span className="text-foreground">{page}</span> • Monitoring Logs
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="h-9 w-9 p-0 bg-primary border-black text-primary-foreground [&_svg]:text-primary-foreground rounded-xl transition-all hover:brightness-95"
                >
                  <ChevronLeft size={18} />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={logs.length < itemsPerPage}
                  onClick={() => setPage(p => p + 1)}
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


