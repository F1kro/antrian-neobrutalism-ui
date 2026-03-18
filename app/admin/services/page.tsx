"use client";
import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/admin/sidebar";
import { createLog } from "@/lib/logger";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Search,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const DAY_OPTIONS = [
  { value: 1, label: "Sen" },
  { value: 2, label: "Sel" },
  { value: 3, label: "Rab" },
  { value: 4, label: "Kam" },
  { value: 5, label: "Jum" },
];
const ALL_DAYS = DAY_OPTIONS.map((d) => d.value);
const DURATION_OPTIONS = [
  { value: "<=30", label: "<= 30 menit" },
  { value: "<=60", label: "<= 60 menit" },
  { value: ">60", label: "> 60 menit" },
];

const normalizeOpenDays = (openDays: unknown) => {
  const parseRaw = (values: unknown[]) =>
    values
      .map((day) => Number(day))
      .filter((day) => Number.isInteger(day) && ALL_DAYS.includes(day));

  if (Array.isArray(openDays)) {
    const parsed = parseRaw(openDays);
    return parsed.length > 0 ? parsed : [...ALL_DAYS];
  }
  if (typeof openDays === "string") {
    const parsed = parseRaw(
      openDays.replace(/[{}]/g, "").split(",").map((value) => value.trim())
    );
    return parsed.length > 0 ? parsed : [...ALL_DAYS];
  }
  return [...ALL_DAYS];
};

export default function ManajemenLayanan() {
  const supabase = createClient();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPrefix, setFilterPrefix] = useState("semua");
  const [filterDay, setFilterDay] = useState("semua");
  const [filterDuration, setFilterDuration] = useState("semua");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState<string | null>(null);

  const [newService, setNewService] = useState({
    name: "",
    description: "",
    estimated_duration: 30,
    prefix_code: "",
    open_days: [...ALL_DAYS],
  });
  const [editService, setEditService] = useState({
    id: "",
    name: "",
    description: "",
    estimated_duration: 30,
    prefix_code: "",
    open_days: [...ALL_DAYS],
  });

  const fetchServices = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("services")
      .select("*")
      .order("name", { ascending: true });
    setServices(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const prefixOptions = useMemo(() => {
    const codes = new Set<string>();
    services.forEach((service) => {
      if (service.prefix_code) {
        codes.add(service.prefix_code.toUpperCase());
      }
    });
    return Array.from(codes).sort();
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        service.name.toLowerCase().includes(query) ||
        (service.description && service.description.toLowerCase().includes(query)) ||
        (service.prefix_code && service.prefix_code.toLowerCase().includes(query));

      const matchesPrefix =
        filterPrefix === "semua" ||
        (service.prefix_code && service.prefix_code.toUpperCase() === filterPrefix);

      const dayFilterValue = Number(filterDay);
      const matchesDay =
        filterDay === "semua" ||
        (Array.isArray(service.open_days) && service.open_days.includes(dayFilterValue));
      
      const duration = service.estimated_duration || 0;
      const matchesDuration =
        filterDuration === "semua" ||
        (filterDuration === "<=30" && duration <= 30) ||
        (filterDuration === "<=60" && duration > 30 && duration <= 60) ||
        (filterDuration === ">60" && duration > 60);

      return matchesSearch && matchesPrefix && matchesDay && matchesDuration;
    });
  }, [services, searchQuery, filterPrefix, filterDay, filterDuration]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterPrefix, filterDay, filterDuration]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredServices.slice(start, start + itemsPerPage);
  }, [filteredServices, currentPage]);

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.prefix_code) return toast.error("Kode Prefix wajib diisi!");
    if (newService.open_days.length === 0) return toast.error("Pilih minimal satu hari operasional!");
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("services").insert([{
        ...newService,
        prefix_code: newService.prefix_code.toUpperCase(),
        open_days: [...newService.open_days].sort((a, b) => a - b),
      }]);
      
      if (error) throw error;

      createLog(
        'SERVICE_CRUD', 
        `Admin menambah layanan baru: ${newService.name} (Kode: ${newService.prefix_code.toUpperCase()})`,
        'info',
        { detail: newService }
      );

      toast.success("Layanan Berhasil Ditambahkan");
      setOpenAdd(false);
      setNewService({ name: "", description: "", estimated_duration: 30, prefix_code: "", open_days: [...ALL_DAYS] });
      fetchServices();
    } catch (error: any) {
      createLog('ERROR', `Gagal tambah layanan: ${error.message}`, 'error');
      toast.error("Gagal menambahkan layanan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editService.open_days.length === 0) return toast.error("Pilih minimal satu hari operasional!");
    setIsSubmitting(true);

    const oldService = services.find((s) => s.id === editService.id);

    try {
      const { error } = await supabase
        .from("services")
        .update({
          name: editService.name,
          description: editService.description,
          estimated_duration: editService.estimated_duration,
          prefix_code: editService.prefix_code.toUpperCase(),
          open_days: [...editService.open_days].sort((a, b) => a - b),
        })
        .eq("id", editService.id);

      if (error) throw error;

      let changes = [];
      if (oldService.name !== editService.name) 
        changes.push(`Nama: "${oldService.name}" -> "${editService.name}"`);
      if (oldService.prefix_code !== editService.prefix_code.toUpperCase()) 
        changes.push(`Kode: "${oldService.prefix_code}" -> "${editService.prefix_code.toUpperCase()}"`);
      if (oldService.description !== editService.description)
        changes.push(`Deskripsi diubah`);
      if ((oldService.open_days || []).join(",") !== [...editService.open_days].sort((a, b) => a - b).join(","))
        changes.push("Hari operasional diubah");

      const detailLog = changes.length > 0 ? changes.join(", ") : "Tidak ada perubahan data";

      createLog(
        'SERVICE_CRUD', 
        `Admin mengubah layanan [${oldService.name}]: ${detailLog}`,
        'info',
        { before: oldService, after: editService }
      );

      toast.success("Perubahan Disimpan");
      setOpenEdit(false);
      fetchServices();
    } catch (error: any) {
      createLog('ERROR', `Gagal update layanan: ${error.message}`, 'error');
      toast.error("Gagal memperbarui layanan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDay = (target: "new" | "edit", dayValue: number, checked: boolean) => {
    if (target === "new") {
      setNewService((prev) => ({
        ...prev,
        open_days: checked
          ? [...prev.open_days, dayValue].filter((v, i, arr) => arr.indexOf(v) === i).sort((a, b) => a - b)
          : prev.open_days.filter((d) => d !== dayValue),
      }));
      return;
    }
    setEditService((prev) => ({
      ...prev,
      open_days: checked
        ? [...prev.open_days, dayValue].filter((v, i, arr) => arr.indexOf(v) === i).sort((a, b) => a - b)
        : prev.open_days.filter((d) => d !== dayValue),
    }));
  };

  const handleDelete = async (id: string) => {
    const serviceTarget = services.find(s => s.id === id);
    try {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;

      createLog(
        'SERVICE_CRUD', 
        `Admin menghapus layanan: ${serviceTarget?.name} (Kode: ${serviceTarget?.prefix_code})`,
        'warning',
        { deleted_data: serviceTarget }
      );

      toast.success("Layanan Dihapus");
      fetchServices();
    } catch (error: any) {
      createLog('ERROR', `Gagal hapus layanan: ${error.message}`, 'error');
      toast.error("Gagal menghapus layanan");
    } finally {
      setOpenDelete(null);
    }
  };

  return (
    <div className="flex h-screen w-full bg-sidebar text-foreground overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-sidebar">
        <div className="flex-1 overflow-y-auto bg-sidebar p-4 md:p-6 space-y-6 custom-scrollbar">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 font-bold">
            <div>
              <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter">Manajemen Layanan</h2>
              <p className="text-primary/80 text-[10px] font-black uppercase tracking-[0.2em]">Konfigurasi Kategori & Kode Prefix</p>
            </div>

            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary hover:brightness-95 text-foreground font-black h-10 px-6 rounded-xl shadow-lg gap-2 tracking-widest active:translate-y-[2px] active:border-b-0 transition-all border-b-4 border-black uppercase text-[10px]">
                  <Plus size={16} /> TAMBAH LAYANAN
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-black text-foreground rounded-[2.5rem] shadow-2xl p-10 max-w-lg border-2 [&>button]:hidden">
                <DialogHeader className="space-y-2">
                  <div className="p-3 bg-primary w-fit rounded-2xl mb-2 shadow-lg shadow-indigo-600/20"><Plus size={24} /></div>
                  <DialogTitle className="text-3xl font-black uppercase tracking-tight">Layanan Baru</DialogTitle>
                  <DialogDescription className="text-muted-foreground text-sm font-medium italic">Atur prefix kode dan detail pelayanan.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-6 pt-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-foreground/70 uppercase tracking-widest ml-1">Kode</label>
                      <Input
                        placeholder="A"
                        maxLength={2}
                        className="bg-background border-black h-14 rounded-2xl !text-slate-800 caret-slate-800 placeholder:text-slate-400 font-black text-center text-xl uppercase"
                        value={newService.prefix_code}
                        onChange={(e) => setNewService({ ...newService, prefix_code: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-3">
                      <label className="text-[10px] font-black text-foreground/70 uppercase tracking-widest ml-1">Nama Layanan</label>
                      <Input
                        placeholder="Nama layanan..."
                        className="bg-background border-black h-14 rounded-2xl !text-slate-800 caret-slate-800 placeholder:text-slate-400 font-bold"
                        value={newService.name}
                        onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-widest ml-1">Deskripsi Singkat</label>
                    <Input
                      placeholder="Keterangan..."
                      className="bg-background border-black h-14 rounded-2xl !text-slate-800 caret-slate-800 placeholder:text-slate-400"
                      value={newService.description}
                      onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-widest ml-1">Hari Operasional</label>
                    <div className="grid grid-cols-4 gap-2">
                      {DAY_OPTIONS.map((day) => (
                        <label key={day.value} className="h-10 rounded-xl border border-black bg-background px-2 flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={newService.open_days.includes(day.value)}
                            onCheckedChange={(checked) => toggleDay("new", day.value, checked === true)}
                          />
                          <span className="text-[10px] font-black uppercase text-slate-800">{day.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <Button type="button" onClick={() => setOpenAdd(false)} className="flex-1 h-16 bg-card text-muted-foreground font-black rounded-2xl hover:bg-accent uppercase tracking-widest text-[10px] border-b-4 border-black active:translate-y-[2px] active:border-b-0 transition-all">Batal</Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-[2] h-16 bg-primary text-foreground font-black text-lg rounded-2xl shadow-xl hover:brightness-95 tracking-tighter border-b-4 border-black active:translate-y-[2px] active:border-b-0 transition-all">SIMPAN LAYANAN</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </header>

          <div className="bg-card/40 border border-black p-4 rounded-3xl backdrop-blur-xl shrink-0">
            <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-2 xl:flex-1">
                <div className="w-full">
                  <label className="flex items-center gap-1.5 text-[9px] font-black text-foreground/70 uppercase tracking-widest ml-1 mb-1.5">
                    <Search size={11} className="text-primary" /> Cari Layanan / Kode
                  </label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                    <Input
                      placeholder="Contoh: Izin, Dispensasi, A..."
                      className="w-full bg-background/50 border-black h-10 pl-9 pr-3.5 !text-slate-800 caret-slate-800 placeholder:text-slate-400 rounded-xl focus:border-black/50 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="w-full">
                  <label className="flex items-center gap-1.5 text-[9px] font-black text-foreground/70 uppercase tracking-widest ml-1 mb-1.5">
                    <Settings2 size={11} className="text-primary" /> Prefix
                  </label>
                  <Select value={filterPrefix} onValueChange={(value) => setFilterPrefix(value)}>
                    <SelectTrigger className="w-full h-10 bg-background/50 border-black text-foreground rounded-xl font-bold uppercase text-[9px]">
                      <SelectValue placeholder="Semua Prefix" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-black text-foreground">
                      <SelectItem value="semua">Semua Prefix</SelectItem>
                      {prefixOptions.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full">
                  <label className="flex items-center gap-1.5 text-[9px] font-black text-foreground/70 uppercase tracking-widest ml-1 mb-1.5">
                    <Clock size={11} className="text-primary" /> Hari Buka
                  </label>
                  <Select value={filterDay} onValueChange={(value) => setFilterDay(value)}>
                    <SelectTrigger className="w-full h-10 bg-background/50 border-black text-foreground rounded-xl font-bold uppercase text-[9px]">
                      <SelectValue placeholder="Semua Hari" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-black text-foreground">
                      <SelectItem value="semua">Semua Hari</SelectItem>
                      {DAY_OPTIONS.map((day) => (
                        <SelectItem key={day.value} value={String(day.value)}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full">
                  <label className="flex items-center gap-1.5 text-[9px] font-black text-foreground/70 uppercase tracking-widest ml-1 mb-1.5">
                    <Clock size={11} className="text-primary" /> Durasi Estimasi
                  </label>
                  <Select value={filterDuration} onValueChange={(value) => setFilterDuration(value)}>
                    <SelectTrigger className="w-full h-10 bg-background/50 border-black text-foreground rounded-xl font-bold uppercase text-[9px]">
                      <SelectValue placeholder="Semua Durasi" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-black text-foreground">
                      <SelectItem value="semua">Semua Durasi</SelectItem>
                      {DURATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="h-10 min-w-[140px] self-start xl:self-end flex items-center justify-center px-5 bg-card border-2 border-black rounded-xl shadow-[4px_4px_0_var(--color-border)]">
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                  Total: <span className="text-primary text-lg ml-1 tabular-nums">{filteredServices.length}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-card/40 border border-black rounded-3xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-xl border-2">
            <div className="overflow-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-background text-[9px] font-black uppercase text-foreground/70 tracking-widest border-b border-black z-10">
                  <tr>
                    <th className="px-5 py-4 w-20 text-center">Kode</th>
                    <th className="px-5 py-4">Nama Layanan</th>
                    <th className="px-5 py-4">Deskripsi</th>
                    <th className="px-5 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/15">
                  {loading ? (
                    <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-800" size={24} /></td></tr>
                  ) : paginatedData.length === 0 ? (
                    <tr><td colSpan={4} className="py-12 text-center text-slate-800 font-bold uppercase text-[10px]">Data tidak ditemukan</td></tr>
                  ) : (
                    paginatedData.map((s) => (
                      <tr key={s.id} className="hover:bg-primary/[0.02] transition-colors group">
                        <td className="px-5 py-3 text-center">
                          <Badge className="bg-primary/20 text-primary border border-black font-black text-sm px-3 py-1 rounded-lg">
                            {s.prefix_code || "A"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-background rounded-lg border border-black text-primary"><Briefcase size={16} /></div>
                            <div className="min-w-0">
                              <span className="text-sm font-bold text-slate-800 uppercase block truncate">{s.name}</span>
                              <span className="text-[10px] text-muted-foreground uppercase">
                                {normalizeOpenDays(s.open_days).length === ALL_DAYS.length
                                  ? "Buka: Setiap Hari Kerja"
                                  : `Buka: ${DAY_OPTIONS.filter((d) => normalizeOpenDays(s.open_days).includes(d.value)).map((d) => d.label).join(", ")}`}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-[11px] text-muted-foreground truncate max-w-[250px]">{s.description || "-"}</td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <Button onClick={() => { setEditService({ id: s.id, name: s.name, description: s.description || "", estimated_duration: s.estimated_duration || 30, prefix_code: s.prefix_code || "", open_days: normalizeOpenDays(s.open_days) }); setOpenEdit(true); }} variant="outline" size="sm" className="h-9 w-9 p-0 bg-primary border-black hover:bg-primary/90 text-primary-foreground [&_svg]:text-primary-foreground transition-all border-b-4 border-black active:translate-y-[2px] active:border-b-0"><Pencil size={14} /></Button>
                            <Button onClick={() => setOpenDelete(s.id)} variant="outline" size="sm" className="h-9 w-9 p-0 bg-red-600 border-black hover:bg-red-700 text-white [&_svg]:text-white transition-all border-b-4 border-black active:translate-y-[2px] active:border-b-0"><Trash2 size={14} /></Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-background/50 p-4 border-t border-black flex justify-between items-center shrink-0">
              <p className="text-[10px] font-black text-foreground/70 uppercase">Halaman {currentPage} dari {totalPages || 1}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="h-9 w-9 p-0 bg-primary border-black text-primary-foreground hover:brightness-95 [&_svg]:text-primary-foreground border-b-4 border-black active:translate-y-[2px] active:border-b-0"><ChevronLeft size={16} /></Button>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage((p) => p + 1)} className="h-9 w-9 p-0 bg-primary border-black text-primary-foreground hover:brightness-95 [&_svg]:text-primary-foreground border-b-4 border-black active:translate-y-[2px] active:border-b-0"><ChevronRight size={16} /></Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal edit */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="bg-card border-black text-foreground rounded-[2.5rem] p-10 shadow-2xl border-2 [&>button]:hidden">
          <DialogHeader className="space-y-2">
            <div className="p-3 bg-amber-500/20 w-fit rounded-2xl mb-2 border border-amber-500/30 shadow-lg shadow-amber-500/10"><Settings2 size={24} className="text-amber-500" /></div>
            <DialogTitle className="text-3xl font-black uppercase tracking-tight text-foreground">Ubah Layanan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-6 pt-6">
             <div className="grid grid-cols-3 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-foreground/70 uppercase ml-1 tracking-widest">Kode</label>
                  <Input className="bg-background border-black h-16 rounded-2xl !text-slate-800 caret-slate-800 placeholder:text-slate-400 font-black text-center text-2xl uppercase" value={editService.prefix_code} onChange={(e) => setEditService({ ...editService, prefix_code: e.target.value })} required />
                </div>
                <div className="col-span-2 space-y-3">
                  <label className="text-[10px] font-black text-foreground/70 uppercase ml-1 tracking-widest">Nama Layanan</label>
                  <Input className="bg-background border-black h-16 rounded-2xl !text-slate-800 caret-slate-800 placeholder:text-slate-400 font-bold text-xl uppercase" value={editService.name} onChange={(e) => setEditService({ ...editService, name: e.target.value })} required />
                </div>
             </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-foreground/70 uppercase ml-1 tracking-widest">Deskripsi</label>
              <Input className="bg-background border-black h-16 rounded-2xl !text-slate-800 caret-slate-800 placeholder:text-slate-400" value={editService.description} onChange={(e) => setEditService({ ...editService, description: e.target.value })} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-foreground/70 uppercase ml-1 tracking-widest">Hari Operasional</label>
              <div className="grid grid-cols-4 gap-2">
                {DAY_OPTIONS.map((day) => (
                  <label key={day.value} className="h-10 rounded-xl border border-black bg-background px-2 flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={editService.open_days.includes(day.value)}
                      onCheckedChange={(checked) => toggleDay("edit", day.value, checked === true)}
                    />
                    <span className="text-[10px] font-black uppercase text-slate-800">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-4 pt-8">
              <Button type="button" onClick={() => setOpenEdit(false)} className="flex-1 h-16 bg-card text-muted-foreground font-black rounded-2xl hover:bg-accent uppercase tracking-widest text-[10px] border-b-4 border-black active:translate-y-[2px] active:border-b-0 transition-all">BATAL</Button>
              <Button type="submit" disabled={isSubmitting} className="h-16 flex-[2] bg-primary text-foreground font-black text-lg rounded-2xl shadow-xl hover:brightness-95 tracking-tighter border-b-4 border-black active:translate-y-[2px] active:border-b-0 transition-all">SIMPAN PERUBAHAN</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog hapus */}
      <AlertDialog open={!!openDelete} onOpenChange={(o) => !o && setOpenDelete(null)}>
        <AlertDialogContent className="bg-card border-black text-foreground rounded-[2.5rem] p-8 shadow-2xl border-2">
          <AlertDialogHeader className="space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 w-fit rounded-full text-red-500 mx-auto"><AlertCircle size={40} /></div>
            <div className="text-center space-y-2">
              <AlertDialogTitle className="text-2xl font-black uppercase">Konfirmasi Hapus</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">Yakin hapus layanan ini? Riwayat antrean mungkin terdampak. Tindakan ini <span className="text-red-400 font-bold underline uppercase">permanen</span>.</AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 flex gap-3 sm:justify-center">
            <AlertDialogCancel className="h-14 px-8 bg-card text-foreground border-none rounded-xl font-bold uppercase text-[10px] tracking-widest border-b-4 border-black active:translate-y-[2px] active:border-b-0 transition-all">BATAL</AlertDialogCancel>
            <AlertDialogAction onClick={() => openDelete && handleDelete(openDelete)} className="h-14 px-8 bg-red-600 text-foreground font-black rounded-xl hover:bg-red-500 shadow-lg shadow-red-600/20 uppercase text-[10px] tracking-widest border-b-4 border-red-800 active:translate-y-[2px] active:border-b-0 transition-all">YA, HAPUS</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
