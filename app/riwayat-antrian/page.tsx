"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getBookingsFromCookie } from "@/lib/cookies";
import AdminPageInfoFab from "@/components/admin/page-info-fab";
import { createLog } from "@/lib/logger"; 
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getCancelReason, isAdminCancelled } from "@/lib/queue-status";
import {
  History, ChevronLeft, ChevronRight, Home, Loader2,
  Clock, CheckCircle2, XCircle, AlertCircle, Calendar,
  FileText, ShieldAlert, Monitor
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface BookingDetail {
  id: string;
  booking_number: string;
  visitor_name: string;
  visitor_phone: string;
  status: string;
  created_at: string;
  booking_date: string;
  booking_time: string;
  cancelled_at?: string;
  cancel_reason?: string;
  notes?: string;
  services?: { name: string; estimated_duration: number };
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string; icon: React.ReactNode }> = {
  waiting:    { label: "Menunggu",         dot: "bg-amber-400",   badge: "bg-amber-400 text-white border-black",    icon: <Clock size={11} /> },
  in_progress:{ label: "Sedang Dilayani",   dot: "bg-primary",      badge: "bg-primary text-white border-black",      icon: <AlertCircle size={11} /> },
  completed:  { label: "Selesai",           dot: "bg-emerald-600", badge: "bg-emerald-600 text-white border-black", icon: <CheckCircle2 size={11} /> },
  cancelled:  { label: "Dibatalkan",        dot: "bg-red-600",      badge: "bg-red-600 text-white border-black",     icon: <XCircle size={11} /> },
  cancelled_admin: { label: "Dibatalkan Admin", dot: "bg-red-700", badge: "bg-red-700 text-white border-black",    icon: <ShieldAlert size={11} /> },
};

const getStatusKey = (b: BookingDetail) =>
  b.status === "cancelled" && isAdminCancelled(b) ? "cancelled_admin" : b.status;

export default function MyQueueHistoryPage() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false); 
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Logic Responsive Pagination
  const [itemsPerPage, setItemsPerPage] = useState(6); 

  useEffect(() => {
    const handleResize = () => {
      // Jika layar di bawah 768px (Mobile), set 3. Jika PC set 6.
      setItemsPerPage(window.innerWidth < 768 ? 3 : 6);
    };
    handleResize(); // Cek saat pertama load
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchBookings = async () => {
    try {
      const cookieBookings = getBookingsFromCookie();
      if (!cookieBookings || cookieBookings.length === 0) { 
        setBookings([]); 
        setLoading(false); 
        return; 
      }
      const ids = cookieBookings.map((b: any) => b.id);
      const { data, error } = await supabase
        .from("bookings")
        .select("*, services(name, estimated_duration)")
        .in("id", ids)
        .order("booking_date", { ascending: false })
        .order("booking_time", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal sinkron riwayat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true); 
    fetchBookings();
    const ch = supabase
      .channel("user_history_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => fetchBookings())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const totalPages = Math.ceil(bookings.length / itemsPerPage);

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return bookings.slice(start, start + itemsPerPage);
  }, [bookings, currentPage, itemsPerPage]);

  const handleCancel = async () => {
    if (!selectedBooking || !cancelReason.trim()) return;
    setCancelling(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ 
          status: "cancelled", 
          cancelled_at: new Date().toISOString(), 
          cancel_reason: cancelReason.trim().substring(0, 50)
        })
        .eq("id", selectedBooking.id);
      
      if (error) throw error;

      createLog(
        'CANCEL', 
        `User [${selectedBooking.visitor_name}] membatalkan antrean ${selectedBooking.booking_number}. Alasan: ${cancelReason.trim()}`,
        'warning',
        { booking_id: selectedBooking.id, cancelled_by: 'USER' }
      );

      toast.success("Berhasil dibatalkan");
      setCancelDialogOpen(false);
      setCancelReason("");
      fetchBookings();
    } catch { 
      toast.error("Gagal membatalkan"); 
    } finally { 
      setCancelling(false); 
    }
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b-2 border-black px-4 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center bg-primary rounded-xl shrink-0 shadow-[4px_4px_0px_rgba(0,0,0,1)] border-2 border-black">
            <History size={18} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm md:text-xl font-black uppercase tracking-tight leading-none">Riwayat Antrean</h1>
            <p className="hidden md:block text-[10px] font-black text-foreground/60 uppercase mt-1 tracking-widest">Sistem Antrean Digital LOBAR</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/antrean">
            <Button variant="outline" size="sm" className="h-10 md:h-12 px-3 md:px-5 rounded-xl bg-amber-400 border-2 border-black !text-white font-black uppercase border-b-4 border-amber-800 active:translate-y-[2px] active:border-b-0 transition-all hover:bg-amber-500 [&_svg]:!text-white">
              <Monitor size={16} /> <span className="hidden sm:inline ml-1">Monitor</span>
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm" className="h-10 md:h-12 px-3 md:px-5 rounded-xl bg-primary border-2 border-black text-primary-foreground font-black uppercase border-b-4 border-black active:translate-y-[2px] active:border-b-0 transition-all hover:brightness-95 [&_svg]:text-primary-foreground">
              <Home size={16} /> <span className="hidden sm:inline ml-1">Home</span>
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 px-4 py-8 max-w-6xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-xs font-black text-foreground/40 uppercase tracking-[0.3em]">Memuat Data...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="p-6 bg-card border-2 border-black rounded-full mb-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
               <History size={48} className="text-foreground" />
            </div>
            <p className="text-foreground font-black uppercase text-base mb-8 tracking-widest">Riwayat Masih Kosong</p>
            <Link href="/booking">
              <Button className="bg-primary hover:brightness-95 text-foreground border-2 border-black border-b-6 rounded-2xl font-black text-sm px-10 h-14 shadow-xl active:scale-95 transition-all uppercase">
                Ambil Antrean Sekarang
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paginatedBookings.map((booking) => {
                const key = getStatusKey(booking);
                const sc = STATUS_CONFIG[key] ?? STATUS_CONFIG.waiting;
                const adminBatal = isAdminCancelled(booking);
                const reason = getCancelReason(booking);

                return (
                  <div key={booking.id}
                    className="bg-card rounded-[2.5rem] border-2 border-black overflow-hidden flex flex-col h-full shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <div className="p-6 flex items-start gap-5 flex-1">
                      <div className="bg-background rounded-2xl p-4 text-center border-2 border-black shrink-0 min-w-[80px] shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                        <p className="text-[8px] font-black text-foreground/50 uppercase mb-1">Nomor</p>
                        <p className="text-3xl font-black font-mono text-primary leading-none">{booking.booking_number}</p>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                          <h3 className="text-base font-black text-foreground uppercase truncate tracking-tight">
                            {booking.services?.name}
                          </h3>
                          <Badge className={`${sc.badge} border-2 border-black font-black text-[10px] uppercase px-3 py-1 shadow-[2px_2px_0px_rgba(0,0,0,1)]`}>
                            {sc.icon} <span className="ml-1">{sc.label}</span>
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2 text-foreground/70">
                            <Calendar size={14} className="text-primary" />
                            <span className="text-xs font-black uppercase">{booking.booking_date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-primary">
                            <Clock size={14} />
                            <span className="text-xs font-black uppercase">{booking.booking_time} WITA</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {booking.status === "cancelled" && adminBatal && (
                      <div className="mx-6 mb-4 p-4 bg-red-50 border-2 border-black rounded-2xl">
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldAlert size={14} className="text-red-600" />
                          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Catatan Petugas:</p>
                        </div>
                        <p className="text-xs text-foreground/80 font-bold italic">"{reason}"</p>
                      </div>
                    )}

                    <div className="px-6 pb-6 mt-auto flex gap-3">
                      <Link href={`/booking-confirmation/${booking.id}`} className="flex-1">
                        <Button className="w-full h-12 bg-white hover:bg-slate-50 border-2 border-black text-black rounded-xl text-xs font-black uppercase gap-2 border-b-4 active:translate-y-[2px] active:border-b-0 transition-all shadow-sm">
                          <FileText size={16} /> {booking.status === 'completed' ? 'Detail' : 'Lihat Tiket'}
                        </Button>
                      </Link>
                      {booking.status === "waiting" && (
                        <Button
                          variant="outline"
                          onClick={() => { setSelectedBooking(booking); setCancelDialogOpen(true); }}
                          className="h-12 px-6 bg-red-600 border-2 border-black !text-white hover:bg-red-700 rounded-xl text-xs font-black uppercase transition-all border-b-4 border-black active:translate-y-[2px] active:border-b-0"
                        >
                          Batal
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-6 pt-10 pb-16">
                <Button 
                  disabled={currentPage === 1} 
                  onClick={() => {
                    setCurrentPage((p) => p - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="h-12 w-12 rounded-xl bg-primary border-2 border-black text-primary-foreground border-b-4 active:translate-y-[2px] active:border-b-0 hover:brightness-95 shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                >
                  <ChevronLeft size={24} />
                </Button>
                
                <div className="flex items-center gap-3">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => {
                        setCurrentPage(i + 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`h-4 rounded-full transition-all duration-300 border-2 border-black ${
                        currentPage === i + 1 ? "w-10 bg-primary shadow-[2px_2px_0px_rgba(0,0,0,1)]" : "w-4 bg-slate-200"
                      }`}
                    />
                  ))}
                </div>

                <Button 
                  disabled={currentPage === totalPages} 
                  onClick={() => {
                    setCurrentPage((p) => p + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="h-12 w-12 rounded-xl bg-primary border-2 border-black text-primary-foreground border-b-4 active:translate-y-[2px] active:border-b-0 hover:brightness-95 shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                >
                  <ChevronRight size={24} />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="bg-background border-2 border-black text-foreground rounded-[2.5rem] max-w-[92vw] sm:max-w-md p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
          <DialogHeader className="space-y-4 text-center">
            <div className="p-4 bg-red-100 w-fit rounded-2xl text-red-600 border-2 border-black mx-auto shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <XCircle size={36} />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Konfirmasi Batal</DialogTitle>
            <DialogDescription className="text-sm text-foreground/70 font-bold leading-relaxed">
              Tiket <span className="text-primary font-black">{selectedBooking?.booking_number}</span> akan dibatalkan. Tindakan ini tidak bisa dikembalikan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-3">
            <div className="flex justify-between items-center px-1">
               <label className="text-[10px] font-black text-foreground/50 uppercase tracking-[0.2em]">Alasan Pembatalan</label>
               <span className={`text-[10px] font-black ${cancelReason.length >= 50 ? 'text-red-500' : 'text-foreground/30'}`}>{cancelReason.length}/50</span>
            </div>
            <Textarea
              placeholder="Berikan alasan singkat..."
              maxLength={50}
              className="bg-slate-50 border-2 border-black rounded-2xl resize-none text-sm h-28 text-foreground p-4 focus:ring-0 focus:border-primary transition-all shadow-inner"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <DialogFooter className="flex flex-col gap-3">
            <Button disabled={cancelling || !cancelReason.trim()}
              className="h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm border-2 border-black border-b-6 shadow-lg active:translate-y-[2px] active:border-b-0 transition-all uppercase"
              onClick={handleCancel}>
              {cancelling ? <Loader2 className="animate-spin" size={20} /> : "Ya, Saya Yakin Batal"}
            </Button>
            <Button variant="ghost" className="h-12 rounded-2xl font-black text-xs text-foreground/50 uppercase tracking-widest hover:text-foreground"
              onClick={() => setCancelDialogOpen(false)}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}