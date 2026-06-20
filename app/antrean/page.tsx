"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { getBookingsFromCookie } from "@/lib/cookies";
import { unlockTTS } from "@/lib/notifications";

import {
  requestNotificationPermission,
  notifyQueueCalled,
  isNotificationSupported,
  playTTSNotification,
} from "@/lib/notifications";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
  ShieldCheck,
  Ticket,
  Bell,
  BellOff,
  History as HistoryIcon,
  Star,
  Home,
  SkipForward,
  AlertCircle,
  CalendarDays,
  Coffee,
  Users2,
  Inbox,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const getWitaDateString = () => {
  const now = new Date();
  const witaString = now.toLocaleString("en-US", { timeZone: "Asia/Makassar" });
  const d = new Date(witaString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getWitaHour = () => {
  const now = new Date();
  const witaString = now.toLocaleString("en-US", { timeZone: "Asia/Makassar" });
  return new Date(witaString).getHours();
};

const MonitorTimer = ({
  startTime,
  durationMinutes,
}: {
  startTime: string;
  durationMinutes: number;
}) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const calculate = () => {
      if (!startTime) return;
      const start = new Date(startTime).getTime();
      const end = start + durationMinutes * 60000;
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(diff);
    };
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [startTime, durationMinutes]);

  if (timeLeft === null)
    return <div className="text-2xl md:text-5xl font-mono text-foreground/60">--:--</div>;

  const min = Math.floor(timeLeft / 60);
  const sec = timeLeft % 60;

  return (
    <div
      className={`flex items-center gap-2 font-mono font-black text-2xl md:text-5xl rounded-2xl px-4 py-2 border border-black shadow-lg transition ${timeLeft < 60 ? "animate-pulse" : ""}`}
      style={{ backgroundColor: "#dc2626", color: "#fff" }}
    >
      <Clock size={20} className="md:hidden !text-white" />
      <Clock size={32} className="hidden md:block !text-white" />
      {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
    </div>
  );
};

const SKIP_REASON_MAP: Record<string, string> = {
  "Orang tidak ada di tempat": "Anda tidak ada di tempat saat dipanggil",
  "Dokumen tidak lengkap": "Dokumen Anda belum lengkap",
  "Minta reschedule": "Anda meminta penjadwalan ulang",
};

const getSkipReasonDisplay = (notes: string | null) => {
  if (!notes) return "Antrean Anda dilewati oleh petugas";
  return SKIP_REASON_MAP[notes] || notes;
};

export default function PersonalMonitorPage() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [maintenanceFlag, setMaintenanceFlag] = useState<{ is_paused: boolean; message: string | null } | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [userBookingIds, setUserBookingIds] = useState<string[]>([]);
  const [skippedInfo, setSkippedInfo] = useState<Record<string, { reason: string; at: Date }>>({});
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  
  const [allUserBookings, setAllUserBookings] = useState<any[]>([]);
  
  useEffect(() => {
    const handler = () => unlockTTS();
    window.addEventListener('pointerdown', handler, { once: true });
    return () => window.removeEventListener('pointerdown', handler);
  }, []);

  const notificationsEnabledRef = useRef(false);
  const userBookingIdsRef = useRef<string[]>([]);
  const lastNotificationTimestampsRef = useRef<Record<string, string>>({});
  // TAMBAHAN: ref khusus guard panggil ulang (in_progress -> in_progress)
  const lastCalledAtRef = useRef<Record<string, string>>({});

  useEffect(() => {
    notificationsEnabledRef.current = notificationsEnabled;
  }, [notificationsEnabled]);

  useEffect(() => {
    if (notificationsEnabled) setShowNotificationPrompt(false);
  }, [notificationsEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const alreadyPrompted = localStorage.getItem("notifPromptShown");
    if (!alreadyPrompted && Notification.permission !== "granted") {
      setShowNotificationPrompt(true);
    }
  }, []);

  useEffect(() => {
    userBookingIdsRef.current = userBookingIds;
  }, [userBookingIds]);

  useEffect(() => {
    import("@/lib/notifications").then((mod) => {
      mod.initTTSVoices();
    });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth < 768 ? 1 : 3);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const loadMaintenance = async () => {
      const { data } = await supabase
        .from("maintenance_flags")
        .select("is_paused, message")
        .eq("flag_key", "booking_pause")
        .single();

      setMaintenanceFlag(data || null);
    };

    loadMaintenance();
  }, [supabase]);

  const fetchData = useCallback(async () => {
    const todayWita = getWitaDateString();

    const [bookingRes, serviceRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("*, services(name, prefix_code)")
        .eq("booking_date", todayWita)
        .order("booking_time", { ascending: true }),
      supabase.from("services").select("*").order("name"),
    ]);

    const allBookings = bookingRes.data || [];
    const idsToUse = userBookingIdsRef.current;

    setBookings(allBookings);

    const allServices = serviceRes.data || [];
    
    const sortedServices = [...allServices].sort((a: any, b: any) => {
      const userHasA = allBookings.some(
        (bk) => bk.service_id === a.id && idsToUse.includes(bk.id) && bk.status !== "completed"
      );
      const userHasB = allBookings.some(
        (bk) => bk.service_id === b.id && idsToUse.includes(bk.id) && bk.status !== "completed"
      );
      if (userHasA && !userHasB) return -1;
      if (!userHasA && userHasB) return 1;
      return 0;
    });

    setServices(sortedServices);
    setCurrentPage(1);
  }, [supabase]);

  const fetchAllUserBookings = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const { data } = await supabase
      .from("bookings")
      .select("*, services(name)")
      .in("id", ids)
      .neq("status", "completed")
      .neq("status", "cancelled");
    setAllUserBookings(data || []);
  }, [supabase]);

  useEffect(() => {
    const cookieBookings = getBookingsFromCookie();
    const ids = cookieBookings.map((b: any) => b.id);

    userBookingIdsRef.current = ids;
    setUserBookingIds(ids);
    fetchAllUserBookings(ids);

    fetchData();
  }, [fetchData, fetchAllUserBookings]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const notified = localStorage.getItem("notificationsEnabled");
    if (notified === "true" && Notification.permission === "granted") {
      setNotificationsEnabled(true);
      notificationsEnabledRef.current = true;
    }
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("user-live-monitor")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings" },
        (payload) => {
          const updated = payload.new as any;
          const old = payload.old as any;

          fetchData();

          const currentIds = userBookingIdsRef.current;
          if (!currentIds.includes(updated.id)) return;

          const eventKey = updated.updated_at;
          if (eventKey) {
            if (lastNotificationTimestampsRef.current[updated.id] === eventKey) {
              return;
            }
            lastNotificationTimestampsRef.current[updated.id] = eventKey;
          }

          const isNotifEnabled = notificationsEnabledRef.current;

          if (updated.status === "in_progress" && old.status === "waiting") {
            // MODIFIKASI: guard agar tidak double fire
            const lastCalledAt = lastCalledAtRef.current[updated.id];
            if (lastCalledAt === updated.updated_at) return;
            lastCalledAtRef.current[updated.id] = updated.updated_at;

            if (isNotifEnabled) notifyQueueCalled(updated.booking_number);
            else {
              const nomorEja = updated.booking_number.replace("-", " ").split("").join(" ");
              playTTSNotification(`Nomor antrean ${nomorEja}, silakan menuju loket pelayanan.`);
            }
            toast.success(`NOMOR ANDA (${updated.booking_number}) SEDANG DIPANGGIL!`, {
              duration: 10000,
              icon: <Bell className="text-indigo-500" size={24} />,
            });
          }
          else if (updated.status === "in_progress" && old.status === "in_progress") {
            // MODIFIKASI: fixing double call
            const lastCalledAt = lastCalledAtRef.current[updated.id];
            if (lastCalledAt === updated.updated_at) return;
            lastCalledAtRef.current[updated.id] = updated.updated_at;

            if (isNotifEnabled) notifyQueueCalled(updated.booking_number);
            else {
              const nomorEja = updated.booking_number.replace("-", " ").split("").join(" ");
              playTTSNotification(`Nomor antrean ${nomorEja}, dipanggil kembali. Silakan menuju loket.`);
            }
            toast.warning(`NOMOR ANDA (${updated.booking_number}) DIPANGGIL LAGI!`, {
              duration: 10000,
              icon: <Bell className="text-orange-500" size={24} />,
            });
          }
          else if (updated.status === "waiting" && old.status === "in_progress") {
            const reasonDisplay = getSkipReasonDisplay(updated.notes);
            setSkippedInfo((prev) => ({
              ...prev,
              [updated.id]: { reason: reasonDisplay, at: new Date() },
            }));
            toast.error(
              <div className="flex flex-col gap-1">
                <span className="font-black text-sm">Antrean {updated.booking_number} Dilewati</span>
                <span className="text-xs text-foreground/80">{reasonDisplay}</span>
              </div>,
              { duration: 15000, icon: <SkipForward className="text-amber-500" size={24} /> }
            );
          }
          else if (updated.status === "cancelled") {
            toast.error(`Antrean ${updated.booking_number} Dibatalkan`, {
              icon: <AlertCircle className="text-red-500" />,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, supabase]);

  const handleToggleNotifications = async () => {
    if (!isNotificationSupported()) return toast.error("Browser tidak mendukung notifikasi");
    
    unlockTTS();

    if (notificationsEnabled) {
      notificationsEnabledRef.current = false;
      setNotificationsEnabled(false);
      toast.info("Notifikasi dimatikan");
      localStorage.setItem("notifPromptShown", "1");
      localStorage.setItem("notificationsEnabled", "false");
    } else {
      const permission = await requestNotificationPermission();
      if (permission === "granted") {
        notificationsEnabledRef.current = true;
        setNotificationsEnabled(true);
        toast.success("Notifikasi dan suara AKTIF!");
        localStorage.setItem("notifPromptShown", "1");
        localStorage.setItem("notificationsEnabled", "true");
      }
    }
  };

  const userHasActiveBookingInService = (serviceId: string) => {
    return bookings.some(
      (b) => b.service_id === serviceId && userBookingIdsRef.current.includes(b.id) && b.status !== "completed"
    );
  };

  const futureBookings = useMemo(() => {
    const today = getWitaDateString();
    return allUserBookings.filter(b => b.booking_date > today);
  }, [allUserBookings]);

  const totalPages = Math.max(1, Math.ceil(services.length / (itemsPerPage || 1)));
  const currentServices = services.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const activeUserBookingsCount = bookings.filter(
    (b) => userBookingIdsRef.current.includes(b.id) && b.status !== "completed"
  ).length;

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  return (
    <main className="min-h-screen w-full bg-background text-foreground font-sans p-3 md:p-10 flex flex-col gap-4 md:gap-6 overflow-hidden">
      <header className="bg-card/50 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-black backdrop-blur-xl shrink-0 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2.5 md:p-4 bg-primary rounded-xl md:rounded-2xl shadow-lg text-foreground">
              <Ticket size={24} />
            </div>
            <div>
              <h1 className="text-base md:text-2xl font-black tracking-tighter uppercase leading-none text-foreground">
                Cek Antrean
              </h1>
              <div className="flex items-center gap-2 mt-1 md:mt-1.5">
                <p className="hidden md:block text-xs md:text-sm font-black text-foreground/70 uppercase tracking-widest">
                  Sistem Antrian Online DPMPTSP - LOBAR
                </p>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full">
                  <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs md:text-sm font-black text-red-500 uppercase">Live</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <Link href="/" className="flex-1 min-w-0 md:flex-none md:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="w-full md:w-auto h-11 md:h-12 rounded-2xl gap-2 bg-primary border-black text-primary-foreground font-black text-xs md:text-sm uppercase border-b-4 border-black hover:brightness-95 [&_svg]:text-primary-foreground justify-center"
              >
                <Home size={16} /> Dashboard
              </Button>
            </Link>
            <div className="relative flex-1 min-w-0 md:flex-none md:w-auto">
              <Button
                onClick={handleToggleNotifications}
                variant="outline"
                className={`w-full md:w-auto h-11 md:h-12 px-4 md:px-6 rounded-xl font-bold text-xs md:text-sm uppercase gap-2 transition-all active:translate-y-[2px] active:border-b-0 border-b-4 ${
                  notificationsEnabled
                    ? "bg-emerald-600 border-black !text-white border-b-emerald-800 hover:bg-emerald-700 [&_svg]:!text-white"
                    : "bg-amber-400 border-black !text-white border-b-amber-700 hover:bg-amber-500 [&_svg]:!text-white"
                } ${showNotificationPrompt && !notificationsEnabled ? "ring-4 ring-amber-300/60" : ""} justify-center`}
              >
                {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                <span>{notificationsEnabled ? "Notif On" : "Notif Off"}</span>
              </Button>
              {showNotificationPrompt && !notificationsEnabled && (
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-60 p-3 bg-white border border-black rounded-2xl shadow-xl text-[10px] font-black uppercase text-amber-500 flex flex-col items-center gap-1">
                  <span className="text-foreground">Aktifkan notifikasi</span>
                  <p className="text-[9px] text-foreground/80 leading-snug">
                    Tekan Notif On agar panggilan nomor Anda muncul dengan suara saat dipanggil.
                  </p>
                  <span className="h-2 w-2 rotate-45 bg-white border-t border-l border-black absolute top-full left-1/2 -translate-x-1/2" />
                </div>
              )}
            </div>
            {userBookingIds.length > 0 && (
              <Link href="/riwayat-antrian" className="flex-1 min-w-0 md:flex-none md:w-auto">
                <Button
                  variant="outline"
                  className="w-full md:w-auto h-11 md:h-12 px-3 md:px-5 rounded-xl bg-red-600 border-black !text-white font-bold text-xs md:text-sm uppercase gap-1 border-b-4 border-black active:translate-y-[2px] active:border-b-0 transition-all hover:bg-red-700 [&_svg]:!text-white min-w-0 justify-center"
                >
                  <HistoryIcon size={16} />
                  <span>Riwayat</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {maintenanceFlag?.is_paused && (
        <div className="bg-red-600 border border-red-700 p-4 rounded-xl flex items-start gap-3 shadow-lg border-b-4 border-red-800 text-white">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] !text-white">Booking Sedang Dihentikan</p>
            <p className="text-[11px] font-bold mt-1 !text-white text-justify">
              {maintenanceFlag.message || "Booking online ditutup sementara untuk perawatan sistem."}
            </p>
          </div>
        </div>
      )}

      {futureBookings.length > 0 && (
        <div className="bg-amber-400 border-2 border-black p-4 rounded-xl flex items-start gap-3 shrink-0 shadow-lg border-b-4 border-amber-700">
          <CalendarDays size={20} className="!text-white shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm font-black text-white uppercase tracking-widest">Antrean Terjadwal</p>
            <p className="text-sm md:text-sm text-white font-bold leading-tight">
              Anda memiliki antrean <span className="text-red-600">[{futureBookings[0].booking_number}]</span> untuk tanggal <span className="text-red-600">{futureBookings[0].booking_date}</span>. Monitoring live akan aktif pada tanggal tersebut.
            </p>
          </div>
        </div>
      )}

      {getWitaHour() >= 16 && (
        <div className="bg-card/70 border border-black/80 p-4 rounded-xl flex items-center gap-3 shrink-0 shadow-md border-b-4 border-black">
          <Coffee size={20} className="text-muted-foreground" />
          <p className="text-xs md:text-sm font-black text-muted-foreground uppercase tracking-[0.12em]">
            Layanan hari ini berakhir. Monitoring dibuka kembali besok pukul 08:00 WITA.
          </p>
        </div>
      )}

      {activeUserBookingsCount > 0 && (
        <div className="bg-primary/10 border-2 border-black/70 p-3 md:p-4 rounded-xl flex items-center gap-3 shrink-0 shadow-lg shadow-indigo-500/5 border-b-4 border-black">
          <Star size={20} className="text-primary fill-indigo-400" />
          <p className="text-sm md:text-base font-black text-primary/80 uppercase tracking-tight">
            Layanan Anda Diprioritaskan!
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 bg-card/40 p-2 rounded-xl border border-black shrink-0 shadow-xl">
        <Button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary border-black text-primary-foreground hover:brightness-95 [&_svg]:text-primary-foreground transition-all border-b-4 border-black active:translate-y-[2px] active:border-b-0"
        >
          <ChevronLeft />
        </Button>
        <h3 className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-widest">
          Hal {currentPage} / {totalPages}
        </h3>
        <Button
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary border-black text-primary-foreground hover:brightness-95 [&_svg]:text-primary-foreground transition-all border-b-4 border-black active:translate-y-[2px] active:border-b-0"
        >
          <ChevronRight />
        </Button>
      </div>

      <div
        className={`flex-1 grid gap-4 md:gap-6 ${
          itemsPerPage === 1 ? "grid-cols-1" : "grid-cols-3"
        } min-h-0 overflow-hidden`}
      >
        {currentServices.map((service) => {
          const current = bookings.find(
            (b) => b.service_id === service.id && b.status === "in_progress"
          );
          const waiting = bookings.filter(
            (b) => b.service_id === service.id && b.status === "waiting"
          );
          const isUserBooking = current && userBookingIdsRef.current.includes(current.id);
          const hasUserBookingInService = userHasActiveBookingInService(service.id);
          const userBookingInService = bookings.find(
            (b) =>
              b.service_id === service.id &&
              userBookingIdsRef.current.includes(b.id) &&
              b.status !== "completed"
          );
          const userSkippedBooking = bookings.find(
            (b) =>
              b.service_id === service.id &&
              userBookingIdsRef.current.includes(b.id) &&
              b.status === "waiting" &&
              skippedInfo[b.id]
          );

          return (
            <Card
              key={service.id}
              className={`bg-card/60 border-black rounded-2xl md:rounded-[2.5rem] flex flex-col border-2 transition-all h-full ${
                isUserBooking
                  ? "border-black ring-2 ring-emerald-400/60 shadow-[0_15px_35px_rgba(16,185,129,0.35)]"
                  : userSkippedBooking
                  ? "border-amber-500/40 ring-1 ring-amber-500/20 shadow-[0_10px_20px_rgba(234,179,8,0.2)]"
                  : hasUserBookingInService
                  ? "border-black ring-1 ring-black/20"
                  : "border-black/70 shadow-2xl"
              }`}
            >
              <CardContent className="p-0 flex flex-col h-full">
                <div className="p-3 md:p-5 bg-background/50 border-b border-black flex justify-between items-center">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-black/70 font-black px-2 py-0.5">
                      {service.prefix_code || "A"}
                    </Badge>
                    <h3 className="font-black uppercase text-sm md:text-base text-primary truncate">
                      {service.name}
                    </h3>
                  </div>
                  {current && <div className="h-2 w-2 bg-emerald-500 rounded-full animate-ping" />}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs md:text-sm font-black text-foreground/70 uppercase tracking-widest">
                      {isUserBooking ? "Antrean Anda Sedang Dilayani" : current ? "Antrean Sekarang" : "Belum Ada Antrean"}
                    </p>
                    <h2
                      className={`text-6xl md:text-[8rem] font-black font-mono leading-none ${
                        isUserBooking ? "text-white" : current ? "text-foreground" : "text-foreground/20"
                      }`}
                    >
                      {current?.booking_number || "---"}
                    </h2>
                  </div>
                  
                  {current ? (
                    <>
                      <MonitorTimer startTime={current.updated_at} durationMinutes={30} />
                      <div
                        className={`w-full p-4 rounded-2xl border flex items-center gap-4 ${
                          isUserBooking
                            ? "bg-emerald-600 border-emerald-700"
                            : "bg-indigo-600 border-indigo-700"
                        }`}
                      >
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                            isUserBooking
                              ? "bg-emerald-700/80 border border-emerald-700"
                              : "bg-indigo-700/80 border border-indigo-800"
                          }`}
                        >
                          {isUserBooking ? <ShieldCheck size={20} className="!text-white" /> : <Users2 size={20} className="!text-white" />}
                        </div>
                        <div className="text-left overflow-hidden">
                          <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.15em] !text-white/80`}>
                            {isUserBooking ? "Antrean Anda Dipanggil" : "Pengunjung Lain"}
                          </p>
                          <p className={`text-sm md:text-base font-black uppercase truncate !text-white`}>
                            {current?.visitor_name || "Petugas Melayani..."}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full flex flex-col items-center gap-3 opacity-30 py-4">
                       <Inbox size={48} className="text-foreground" strokeWidth={3} />
                       <p className="text-[10px] font-black uppercase tracking-[0.2em]">Loket Sedang Kosong</p>
                    </div>
                  )}

                  {userBookingInService &&
                    userBookingInService.status === "waiting" &&
                    !userSkippedBooking && (
                      <div className="w-full p-3 bg-primary/10 border border-black/70 rounded-xl flex justify-between items-center border-b-4 border-black">
                        <p className="text-xs md:text-sm font-black text-primary uppercase">
                          No. Anda: {userBookingInService.booking_number}
                        </p>
                        <Badge className="bg-primary text-xs md:text-sm">
                          SISA {waiting.findIndex((b: any) => b.id === userBookingInService.id) + 1} LAGI
                        </Badge>
                      </div>
                    )}

                  {userSkippedBooking && skippedInfo[userSkippedBooking.id] && (
                    <div className="w-full space-y-2">
                      <div className="w-full p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-left border-b-4 border-amber-800">
                        <SkipForward size={16} className="!text-white mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs md:text-sm font-black text-amber-400 uppercase tracking-widest">
                            Antrean Dilewati
                          </p>
                          <p className="text-xs md:text-sm text-amber-300 font-bold">
                            {skippedInfo[userSkippedBooking.id].reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-background/50 border-t border-black grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xs md:text-sm font-black text-foreground/70 uppercase tracking-wide">Sisa</p>
                    <p className="text-3xl font-black text-foreground font-mono">{waiting.length}</p>
                  </div>
                  <div className="border-l border-black">
                    <p className="text-xs md:text-sm font-black text-foreground/70 uppercase tracking-wide">Estimasi</p>
                    <p className="text-3xl font-black text-emerald-400 font-mono">
                      {waiting.length * 30}m
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
