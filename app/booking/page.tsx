"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { saveBookingToCookie } from "@/lib/cookies";
import AdminPageInfoFab from "@/components/admin/page-info-fab";
import { createLog } from "@/lib/logger"; // Aku pakai logger di sini.
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as UiCalendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Home,
  Loader2,
  Sparkles,
  User,
  Phone,
  Briefcase,
  Clock,
  CalendarDays,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30",
];
const DEFAULT_OPEN_DAYS = [0, 1, 2, 3, 4, 5, 6];
const DAY_NAME_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const sanitizeNameInput = (value: string) => {
  const clean = value.replace(/[<>/"'`;\\\d]/g, "");
  return clean.slice(0, 100);
};

const sanitizePhoneInput = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.slice(0, 13);
};

const isValidName = (value: string) => {
  return value.length >= 3 && /^[a-zA-Z\s.'-]+$/.test(value);
};

const isValidPhone = (value: string) => {
  return /^\d{10,13}$/.test(value);
};

const normalizeOpenDays = (openDays: unknown) => {
  if (Array.isArray(openDays)) {
    const parsed = openDays.map((day) => Number(day)).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
    return parsed.length > 0 ? parsed : [...DEFAULT_OPEN_DAYS];
  }
  if (typeof openDays === "string") {
    const parsed = openDays
      .replace(/[{}]/g, "")
      .split(",")
      .map((day) => Number(day.trim()))
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
    return parsed.length > 0 ? parsed : [...DEFAULT_OPEN_DAYS];
  }
  return [...DEFAULT_OPEN_DAYS];
};

const parseDateString = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export default function BookingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [now, setNow] = useState<Date>(getWitaNow());
  const [maintenanceFlag, setMaintenanceFlag] = useState<{ is_paused: boolean; message: string | null } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    serviceId: "",
    date: "",
    time: "",
  });

  // Aku refresh status slot tiap 30 detik.
  useEffect(() => {
    const tick = () => setNow(getWitaNow());
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  // Aku ambil data layanan.
  useEffect(() => {
    supabase.from("services").select("*").order("name").then(({ data }) => {
      const mapped = (data || []).map((service: any) => ({
        ...service,
        open_days: normalizeOpenDays(service.open_days),
      }));
      setServices(mapped);
    });
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

  // Aku ambil slot terisi (kecuali yang cancel).
  const fetchBookedSlots = async () => {
    if (!formData.date) {
      setBookedSlots([]);
      return;
    }
    const { data } = await supabase
      .from("bookings")
      .select("booking_time")
      .eq("booking_date", formData.date)
      .neq("status", "cancelled");

    if (data) setBookedSlots(data.map((b) => b.booking_time));
  };

  useEffect(() => { 
    fetchBookedSlots(); 
  }, [formData.date]);

  const selectedService = services.find((service) => service.id === formData.serviceId);
  const selectedServiceOpenDays = selectedService?.open_days || DEFAULT_OPEN_DAYS;

  const isServiceOpenOnDate = (dateString: string) => {
    if (!dateString) return false;
    const date = parseDateString(dateString);
    return selectedServiceOpenDays.includes(date.getDay());
  };

  const todayWitaString = getWitaDateString(now);
  const selectedDateObj = formData.date ? parseDateString(formData.date) : undefined;
  const closedDayLabels = DAY_NAME_ID.filter((_, dayIndex) => !selectedServiceOpenDays.includes(dayIndex));

  // Aku cek ketersediaan slot hari ini.
  const isToday = formData.date === todayWitaString;
  const canShowSlots = Boolean(formData.serviceId && formData.date && isServiceOpenOnDate(formData.date));
  const availableSlots = canShowSlots ? TIME_SLOTS.filter((slot) => {
    const isBooked = bookedSlots.includes(slot);
    const [sH, sM] = slot.split(":").map(Number);
    const isPast = isToday && (sH * 60 + sM) <= (now.getHours() * 60 + now.getMinutes());
    return !isBooked && !isPast;
  }) : [];

  const isAllPast = isToday && TIME_SLOTS.every((slot) => {
    const [sH, sM] = slot.split(":").map(Number);
    return (sH * 60 + sM) <= (now.getHours() * 60 + now.getMinutes());
  });

  const isAllBooked = TIME_SLOTS.every((slot) => bookedSlots.includes(slot));
  const bookingPaused = maintenanceFlag?.is_paused === true;
  const maintenanceMessage = maintenanceFlag?.message || "Booking sementara ditutup untuk perawatan sistem.";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bookingPaused) {
      toast.error(maintenanceMessage);
      return;
    }
    if (!isValidName(formData.name)) {
      toast.error("Nama harus minimal 3 karakter dan tidak boleh mengandung simbol berbahaya.");
      return;
    }
    if (!isValidPhone(formData.phone)) {
      toast.error("Nomor HP harus angka valid (10-13 digit).");
      return;
    }
    if (!formData.serviceId || !formData.date || !formData.time) return toast.error("Lengkapi data!");
    if (!isServiceOpenOnDate(formData.date)) return toast.error("Layanan tutup pada tanggal yang dipilih.");

    setLoading(true);
    try {
      // Aku validasi waktu WITA.
      if (isToday) {
        const [h, m] = formData.time.split(":").map(Number);
        const slotMins = h * 60 + m;
        const nowMins = now.getHours() * 60 + now.getMinutes();
        if (slotMins <= nowMins) {
          throw new Error("Waktu sudah lewat, pilih jam lain!");
        }
      }

      // Panggil RPC atomic buat booking (anti race condition)
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_booking', {
        p_visitor_name: formData.name,
        p_visitor_phone: formData.phone,
        p_service_id: formData.serviceId,
        p_booking_date: formData.date,
        p_booking_time: formData.time,
      });

      if (rpcError) {
        if (rpcError.message?.includes('SLOT_TAKEN')) {
          fetchBookedSlots();
          throw new Error("Slot ini baru saja diambil orang lain!");
        }
        throw rpcError;
      }

      const bookingResult = rpcData?.[0];
      if (bookingResult) {
        const { data: fullBooking } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingResult.out_id)   // ← ganti dari bookingResult.id
          .single();
      
        createLog(
          'BOOKING',
          `Pengunjung baru: ${formData.name} mengambil antrean ${bookingResult.out_booking_number}`,  // ← ganti
          'info',
          { booking_id: bookingResult.out_id, visitor_name: formData.name }  // ← ganti
        );
      
        saveBookingToCookie({ ...fullBooking });
        toast.success("Booking berhasil!");
        router.push(`/booking-confirmation/${bookingResult.out_id}`);  // ← ganti
      }
    } catch (error: any) {
      // Log: booking gagal.
      createLog('ERROR', `Gagal ambil antrean: ${error.message}`, 'error', { visitor_name: formData.name });
      toast.error(error.message);
      fetchBookedSlots();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-background text-foreground flex flex-col items-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-1/4 w-[500px] h-[500px] bg-primary/15 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-6xl z-10 p-4 md:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <header className="flex items-center justify-between bg-card p-4 md:p-5 rounded-[10px] border-2 border-black shadow-[5px_5px_0_#000] gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary border-2 border-black rounded-[6px] shadow-[3px_3px_0_#000]">
                  <Sparkles size={18} className="text-foreground" />
                </div>
                <h1 className="text-base md:text-lg font-black uppercase tracking-tight leading-none">Ambil Antrean</h1>
              </div>
              <Link href="/" className="flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 md:h-12 px-4 md:px-6 rounded-xl gap-2 bg-primary border-black text-primary-foreground font-black text-xs md:text-sm uppercase border-b-4 border-black hover:brightness-95 [&_svg]:text-primary-foreground"
                >
                  <Home size={16} /> Dashboard
                </Button>
              </Link>
            </header>

            <div className="text-center space-y-2 bg-card p-4 md:p-5 rounded-[10px] border-2 border-black shadow-[5px_5px_0_#000]">
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Reservasi Jadwal</h2>
              <p className="text-muted-foreground text-sm md:text-base font-medium italic">Pilih waktu kedatangan (WITA) yang tersedia.</p>
            </div>
            
            {bookingPaused && (
              <div className="bg-red-600 border border-red-700 p-5 rounded-xl flex items-start gap-3 shadow-lg border-b-4 border-red-800 text-white">
                <div>
                  <p className="text-md font-black uppercase tracking-widest !text-white">Booking Ditangguhkan</p>
                  <p className="text-sm font-bold !text-white text-justify">{maintenanceMessage}</p>
                </div>
              </div>
            )}

           
          </div>

          <div className="space-y-6">
            <Card className="bg-card border-black rounded-[10px] overflow-hidden border-2">
              <CardContent className="p-6 md:p-10">
                <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs md:text-sm font-black text-foreground/70 uppercase tracking-widest ml-1 flex items-center gap-2"><User size={14} /> Nama</Label>
                    <Input
                      placeholder="Nama Lengkap"
                      className="h-12 rounded-[8px] text-foreground text-base"
                      value={formData.name}
                      inputMode="text"
                      autoCapitalize="words"
                      autoComplete="name"
                      pattern="[A-Za-z\s.'-]+"
                      title="Hanya huruf, spasi, titik, dan tanda hubung."
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: sanitizeNameInput(e.target.value) }))
                      }
                      required
                      disabled={bookingPaused}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs md:text-sm font-black text-foreground/70 uppercase tracking-widest ml-1 flex items-center gap-2"><Phone size={14} /> WhatsApp</Label>
                    <Input
                      type="tel"
                      placeholder="0812..."
                      className="h-12 rounded-[8px] text-foreground text-base"
                      value={formData.phone}
                      inputMode="tel"
                      autoComplete="tel-national"
                      pattern="[0-9]*"
                      title="Hanya angka, max 13 digit."
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, phone: sanitizePhoneInput(e.target.value) }))
                      }
                      required
                      disabled={bookingPaused}
                      maxLength={13}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs md:text-sm font-black text-foreground/70 uppercase tracking-widest ml-1 flex items-center gap-2"><Briefcase size={14} /> Layanan</Label>
                  <Select
                    value={formData.serviceId}
                    onValueChange={(val) => {
                      const nextService = services.find((service) => service.id === val);
                      const nextOpenDays = nextService?.open_days || DEFAULT_OPEN_DAYS;
                      const keepDate = formData.date && nextOpenDays.includes(parseDateString(formData.date).getDay());
                      setFormData((prev) => ({
                        ...prev,
                        serviceId: val,
                        date: keepDate ? prev.date : "",
                        time: "",
                      }));
                    }}
                  disabled={bookingPaused}
                  >
                    <SelectTrigger className="w-full !h-12 rounded-[8px] text-foreground font-bold text-base"><SelectValue placeholder="Pilih Layanan" /></SelectTrigger>
                    <SelectContent className="bg-card border-black text-foreground rounded-[8px]">
                      {services.map((s) => (<SelectItem key={s.id} value={s.id} className="py-3 font-bold text-sm">{s.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs md:text-sm font-black text-foreground/70 uppercase tracking-widest ml-1 flex items-center gap-2"><CalendarDays size={14} /> Tanggal Kedatangan</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!formData.serviceId || bookingPaused}
                        className={cn(
                          "w-full !h-12 rounded-[8px] text-left justify-between border-black font-bold text-base",
                          !formData.date && "text-muted-foreground"
                        )}
                      >
                        {formData.date && selectedDateObj ? format(selectedDateObj, "EEEE, dd MMMM yyyy", { locale: id }) : "Pilih tanggal"}
                        <ChevronDown size={16} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-black" align="start">
                      <UiCalendar
                        mode="single"
                        selected={selectedDateObj}
                        onSelect={(date) => {
                          if (!date) return;
                          const pickedDate = getWitaDateString(date);
                          setFormData((prev) => ({ ...prev, date: pickedDate, time: "" }));
                        }}
                        disabled={(date) => {
                          if (!formData.serviceId) return true;
                          const pickedDate = getWitaDateString(date);
                          const pickedDay = date.getDay();
                          return pickedDate < todayWitaString || !selectedServiceOpenDays.includes(pickedDay);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {formData.serviceId && closedDayLabels.length > 0 && (
                    <p className="text-[11px] text-muted-foreground font-semibold">
                      Hari tutup layanan ini: {closedDayLabels.join(", ")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs md:text-sm font-black text-foreground/70 uppercase tracking-widest ml-1 flex items-center gap-2"><Clock size={14} /> Jam Tersedia</Label>
                  
                  {/* Alert saat slot penuh atau layanan selesai */}
                  {canShowSlots && availableSlots.length === 0 && (
                    <div className="flex items-center gap-3 p-4 bg-amber-400 border-2 border-black rounded-xl text-white mb-4 border-b-4 border-amber-700 shadow-lg">
                      <AlertCircle size={18} className="text-white shrink-0" />
                      <p className="text-sm md:text-base font-bold uppercase leading-tight text-white">
                        {isAllPast 
                          ? "Jam layanan hari ini sudah selesai, silahkan booking antrean untuk besok." 
                          : "Slot layanan untuk hari ini sudah full, silahkan booking antrean untuk besok."}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const isBooked = bookedSlots.includes(slot);
                      const [sH, sM] = slot.split(":").map(Number);
                      const isPast = isToday && (sH * 60 + sM) <= (now.getHours() * 60 + now.getMinutes());
                      
                      const isDisabled = bookingPaused || !canShowSlots || isBooked || isPast;
                      const isSelected = formData.time === slot;

                      return (
                        <button 
                          key={slot} 
                          type="button" 
                          disabled={isDisabled} 
                          onClick={() => setFormData({ ...formData, time: slot })}
                          className={`py-3 rounded-[8px] text-xs md:text-sm font-black transition-all border-2 border-black shadow-[3px_3px_0_#000] ${
                            isDisabled ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50" :
                            isSelected ? "bg-primary text-foreground translate-x-[2px] translate-y-[2px] shadow-[1px_1px_0_#000]" :
                            "bg-card text-foreground hover:bg-accent"
                          }`}
                        >
                          {slot}
                          <span className="block text-xs md:text-sm opacity-70">
                            {isBooked ? "FULL" : isPast ? "LEWAT" : "READY"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button 
                  disabled={loading || !formData.serviceId || !formData.date || !formData.time || bookingPaused} 
                  className="w-full h-14 bg-primary hover:brightness-95 text-foreground font-black uppercase tracking-widest rounded-[8px] mt-4"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "KONFIRMASI JADWAL"}
                </Button>
              </form>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
      <AdminPageInfoFab
        title="Daftar Antrean"
        description="Halaman ini dipakai untuk mengambil nomor antrean online sesuai layanan, tanggal, dan slot waktu yang tersedia."
        points={[
          "Isi nama, nomor WhatsApp, layanan, tanggal, dan jam kedatangan.",
          "Pilih hanya slot yang masih tersedia dan belum lewat.",
          "Setelah berhasil, tiket antrean akan tersimpan dan bisa dibuka kembali.",
        ]}
      />
    </main>
  );
}