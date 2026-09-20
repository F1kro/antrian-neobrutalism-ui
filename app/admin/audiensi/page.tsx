"use client";
import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/admin/sidebar";
import { createLog } from "@/lib/logger";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Loader2,
  MessageCircle,
  Search,
  UserRound,
  CheckCircle2,
  XCircle,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  STATUS_LABEL,
  STATUS_STYLE,
  STATUS_ORDER,
  formatDateID,
  formatDateTimeID,
  formatRupiah,
  toWaLink,
  type AudiensiRow,
  type AudiensiStatus,
} from "@/lib/audiensi";

export default function ManajemenAudiensiInvestor() {
  const supabase = createClient();
  const [rows, setRows] = useState<AudiensiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [openDetail, setOpenDetail] = useState(false);
  const [selected, setSelected] = useState<AudiensiRow | null>(null);
  const [editStatus, setEditStatus] = useState<AudiensiStatus>("menunggu");
  const [editNote, setEditNote] = useState("");
  const [editTanggalDitetapkan, setEditTanggalDitetapkan] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("audiensi_investor")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Gagal memuat data audiensi investor");
      console.error(error);
    } else {
      setRows((data || []) as AudiensiRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(
    () => ({
      total: rows.length,
      menunggu: rows.filter((r) => r.status === "menunggu").length,
      disetujui: rows.filter((r) => r.status === "disetujui").length,
      ditolak: rows.filter((r) => r.status === "ditolak").length,
    }),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        row.kode.toLowerCase().includes(q) ||
        row.nama_perusahaan.toLowerCase().includes(q) ||
        row.nama_pemohon.toLowerCase().includes(q);
      const matchesStatus = filterStatus === "semua" || row.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [rows, searchQuery, filterStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const openDetailModal = (row: AudiensiRow) => {
    setSelected(row);
    setEditStatus(row.status);
    setEditNote(row.catatan_admin || "");
    setEditTanggalDitetapkan(row.tanggal_ditetapkan || "");
    setOpenDetail(true);
  };

  const requiresTanggalDitetapkan = editStatus === "disetujui" || editStatus === "dijadwalkan_ulang";
  const requiresCatatan = editStatus === "ditolak";

  const handleSave = async () => {
    if (!selected) return;

    if (requiresTanggalDitetapkan && !editTanggalDitetapkan) {
      toast.error("Tanggal ditetapkan wajib diisi untuk status ini.");
      return;
    }
    if (requiresCatatan && !editNote.trim()) {
      toast.error("Catatan alasan penolakan wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<AudiensiRow> = {
        status: editStatus,
        catatan_admin: editNote.trim() || null,
        tanggal_ditetapkan: requiresTanggalDitetapkan ? editTanggalDitetapkan : null,
      };

      const { error } = await supabase
        .from("audiensi_investor")
        .update(payload)
        .eq("id", selected.id);
      if (error) throw error;

      createLog(
        "AUDIENSI",
        `Admin memperbarui audiensi investor [${selected.kode}] status: ${selected.status} -> ${editStatus}`,
        editStatus === "ditolak" ? "warning" : "info",
        { kode: selected.kode, before: selected.status, after: editStatus }
      );

      toast.success("Perubahan berhasil disimpan");
      setOpenDetail(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      createLog("ERROR", `Gagal update audiensi investor: ${err.message}`, "error");
      toast.error("Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  };

  const StatCard = ({
    label,
    value,
    icon,
    color,
  }: {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
  }) => (
    <Card className="bg-card border-2 border-black rounded-[10px] shadow-[5px_5px_0_#000]">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-3 rounded-[8px] border-2 border-black text-white shadow-[3px_3px_0_#000] ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-black tabular-nums leading-none text-black">{value}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-screen w-full bg-sidebar text-foreground overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-sidebar">
        <div className="flex-1 overflow-y-auto bg-sidebar p-4 md:p-6 space-y-6 custom-scrollbar">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
            <div>
              <h2 className="text-3xl font-black text-black uppercase tracking-tighter">Audiensi Investor</h2>
              <p className="text-primary/80 text-[10px] font-black uppercase tracking-[0.2em]">
                Manajemen Permohonan Audiensi Penanaman Modal
              </p>
            </div>
            <Button
              onClick={fetchData}
              variant="outline"
              className="h-10 px-5 bg-card border-black text-black font-black uppercase text-[10px] tracking-widest rounded-xl gap-2 shadow-lg"
            >
              <Clock size={14} /> REFRESH DATA
            </Button>
          </header>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Permohonan" value={stats.total} icon={<FileText size={20} />} color="bg-primary" />
            <StatCard label="Menunggu" value={stats.menunggu} icon={<Clock size={20} />} color="bg-amber-400" />
            <StatCard label="Disetujui" value={stats.disetujui} icon={<CheckCircle2 size={20} />} color="bg-emerald-500" />
            <StatCard label="Ditolak" value={stats.ditolak} icon={<XCircle size={20} />} color="bg-red-600" />
          </div>

          <div className="bg-card border-2 border-black p-4 rounded-[10px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="w-full">
                <Label className="flex items-center gap-1.5 text-[9px] font-black text-black uppercase tracking-widest ml-1 mb-1.5">
                  <Search size={11} className="text-primary" /> Cari Kode / Perusahaan / Pemohon
                </Label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                  <Input
                    placeholder="Contoh: AUD-..., PT Maju, Budi"
                    className="w-full bg-background border-black h-10 pl-9 pr-3.5 rounded-xl text-sm text-black"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="w-full">
                <Label className="flex items-center gap-1.5 text-[9px] font-black text-black uppercase tracking-widest ml-1 mb-1.5">
                  <CheckCircle2 size={11} className="text-primary" /> Status
                </Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full h-10 bg-background border-black text-black rounded-xl font-bold uppercase text-[10px]">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-black text-black">
                    <SelectItem value="semua">Semua Status</SelectItem>
                    {STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-card border-2 border-black rounded-[10px] overflow-hidden flex flex-col shadow-2xl">
            <div className="overflow-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-background text-[9px] font-black uppercase text-black tracking-widest border-b border-black z-10">
                  <tr>
                    <th className="px-5 py-4">Kode</th>
                    <th className="px-5 py-4">Perusahaan / Pemohon</th>
                    <th className="px-5 py-4">Nilai Investasi</th>
                    <th className="px-5 py-4 text-center">Status</th>
                    <th className="px-5 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/15">
                  {loading ? (
                    <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={24} /></td></tr>
                  ) : paginated.length === 0 ? (
                    <tr><td colSpan={5} className="py-12 text-center text-slate-600 font-bold uppercase text-[10px]">Tidak ada data ditemukan</td></tr>
                  ) : (
                    paginated.map((row) => (
                      <tr key={row.id} className="hover:bg-primary/[0.03] transition-colors group">
                        <td className="px-5 py-3">
                          <span className="font-mono text-[11px] font-black block text-black">{row.kode}</span>
                          <span className="text-[9px] text-slate-600 font-bold">{formatDateTimeID(row.created_at)}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-bold text-black uppercase block truncate max-w-[200px]">{row.nama_perusahaan}</span>
                          <span className="text-[10px] text-slate-600 block truncate max-w-[200px]">{row.nama_pemohon}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[11px] font-bold text-black">Rp {formatRupiah(row.nilai_investasi)}</span>
                          <span className="text-[10px] text-slate-600 block">{row.estimasi_tenaga_kerja} tenaga kerja</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Badge className={`border border-black text-[9px] font-black uppercase ${STATUS_STYLE[row.status]}`}>
                            {STATUS_LABEL[row.status]}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-center gap-2">
                            <Button
                              onClick={() => openDetailModal(row)}
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0 bg-primary border-black hover:brightness-95 text-primary-foreground border-b-4 border-black active:translate-y-[2px] active:border-b-0"
                            >
                              <Eye size={14} />
                            </Button>
                            <a
                              href={toWaLink(row.no_whatsapp, `Halo ${row.nama_pemohon}, terkait permohonan audiensi ${row.kode}...`)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 w-9 p-0 bg-emerald-500 border-black hover:brightness-95 text-white border-b-4 border-black active:translate-y-[2px] active:border-b-0"
                              >
                                <MessageCircle size={14} />
                              </Button>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-background p-4 border-t border-black flex justify-between items-center shrink-0">
              <p className="text-[10px] font-black text-black uppercase">Halaman {currentPage} dari {totalPages}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="h-9 w-9 p-0 bg-primary border-black text-primary-foreground border-b-4 border-black active:translate-y-[2px] active:border-b-0"
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="h-9 w-9 p-0 bg-primary border-black text-primary-foreground border-b-4 border-black active:translate-y-[2px] active:border-b-0"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog dilebarkan jadi max-w-4xl + layout 2 kolom agar muat tanpa banyak scroll */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="bg-card border-2 border-black text-black rounded-[10px] p-6 md:p-8 shadow-2xl max-w-4xl max-h-[92vh] overflow-y-auto custom-scrollbar">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary w-fit rounded-[8px] border-2 border-black text-primary-foreground shadow-[4px_4px_0_#000]">
                <Building2 size={22} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight text-black">Detail Permohonan</DialogTitle>
                <DialogDescription className="font-mono text-xs font-black text-primary">{selected?.kode}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selected && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* Kolom kiri: data permohonan */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 text-xs">
                  <div className="flex items-center gap-2 p-3 bg-background rounded-[8px] border-2 border-black">
                    <Building2 size={16} className="text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase text-slate-600">Perusahaan</p>
                      <p className="font-bold truncate text-black">{selected.nama_perusahaan}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-background rounded-[8px] border-2 border-black">
                    <UserRound size={16} className="text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase text-slate-600">Pemohon</p>
                      <p className="font-bold truncate text-black">{selected.nama_pemohon} · {selected.no_whatsapp}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-background rounded-[8px] border-2 border-black">
                    <FileText size={16} className="text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase text-slate-600">Jenis Investasi</p>
                      <p className="font-bold truncate text-black">{selected.jenis_investasi}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-background rounded-[8px] border-2 border-black">
                    <CalendarClock size={16} className="text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase text-slate-600">Tanggal Dimohonkan</p>
                      <p className="font-bold truncate text-black">{formatDateID(selected.tanggal_audiensi)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-background rounded-[8px] border-2 border-black">
                    <p className="text-[9px] font-black uppercase text-slate-600">Nilai Investasi</p>
                    <p className="font-bold text-black">Rp {formatRupiah(selected.nilai_investasi)}</p>
                  </div>
                  <div className="p-3 bg-background rounded-[8px] border-2 border-black">
                    <p className="text-[9px] font-black uppercase text-slate-600">Tenaga Kerja</p>
                    <p className="font-bold text-black">{selected.estimasi_tenaga_kerja} orang</p>
                  </div>
                </div>

                <a
                  href={toWaLink(selected.no_whatsapp, `Halo ${selected.nama_pemohon}, terkait permohonan audiensi ${selected.kode}...`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button
                    type="button"
                    className="w-full h-12 bg-emerald-500 text-white font-black rounded-[8px] uppercase tracking-widest text-[10px] gap-2 border-b-4 border-black active:translate-y-[2px] active:border-b-0"
                  >
                    <MessageCircle size={16} /> Hubungi via WA
                  </Button>
                </a>
              </div>

              {/* Kolom kanan: form update status */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-black">Status Permohonan</Label>
                  <Select value={editStatus} onValueChange={(v) => setEditStatus(v as AudiensiStatus)}>
                    <SelectTrigger className="w-full h-12 bg-background border-black text-black rounded-[8px] font-bold uppercase text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-black text-black">
                      {STATUS_ORDER.map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {requiresTanggalDitetapkan && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-black">Tanggal Ditetapkan *</Label>
                    <Input
                      type="date"
                      className="bg-background border-black h-12 rounded-[8px] text-black"
                      value={editTanggalDitetapkan}
                      onChange={(e) => setEditTanggalDitetapkan(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-black">
                    Catatan Admin {requiresCatatan && "*"}
                  </Label>
                  <Textarea
                    placeholder={requiresCatatan ? "Wajib diisi: alasan penolakan" : "Catatan untuk pemohon (opsional)"}
                    className="bg-background border-black rounded-[8px] min-h-[110px] text-black"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                  />
                </div>

                <Button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="w-full h-14 bg-primary text-primary-foreground font-black rounded-[8px] uppercase tracking-widest text-xs gap-2 border-b-4 border-black active:translate-y-[2px] active:border-b-0"
                >
                  {saving ? (<><Loader2 className="animate-spin" size={16} /> Menyimpan...</>) : "Simpan Perubahan"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}