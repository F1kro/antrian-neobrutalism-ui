"use client";
import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createLog } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Building2,
    CheckCircle2,
    ClipboardCheck,
    Copy,
    Handshake,
    Home,
    Loader2,
    Search,
    Send,
} from "lucide-react";
import { toast } from "sonner";
import {
    JENIS_INVESTASI_OPTIONS,
    STATUS_LABEL,
    STATUS_STYLE,
    formatDateID,
    formatDateTimeID,
    formatRupiah,
    parseRupiahDigits,
    getMinAudiensiDate,
    getMaxAudiensiDate,
    mapRpcError,
    type AudiensiStatus,
} from "@/lib/audiensi";

type FormState = {
    nama_perusahaan: string;
    jenis_investasi: string;
    jenis_investasi_lainnya: string;
    nilai_investasi_display: string;
    estimasi_tenaga_kerja: string;
    tanggal_audiensi: string;
    nama_pemohon: string;
    no_whatsapp: string;
};

const EMPTY_FORM: FormState = {
    nama_perusahaan: "",
    jenis_investasi: "",
    jenis_investasi_lainnya: "",
    nilai_investasi_display: "",
    estimasi_tenaga_kerja: "",
    tanggal_audiensi: "",
    nama_pemohon: "",
    no_whatsapp: "",
};

type TrackResult = {
    out_kode: string;
    out_status: AudiensiStatus;
    out_nama_perusahaan: string;
    out_tanggal_audiensi: string;
    out_tanggal_ditetapkan: string | null;
    out_catatan_admin: string | null;
    out_created_at: string;
};

export default function AudiensiInvestorPage() {
    const supabase = createClient();
    const [tab, setTab] = useState<"ajukan" | "cek">("ajukan");
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [successKode, setSuccessKode] = useState<string | null>(null);

    const [cekKode, setCekKode] = useState("");
    const [cekWa, setCekWa] = useState("");
    const [checking, setChecking] = useState(false);
    const [cekError, setCekError] = useState<string | null>(null);
    const [cekResult, setCekResult] = useState<TrackResult | null>(null);

    const setField = (key: keyof FormState, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleNilaiChange = (raw: string) => {
        const digits = parseRupiahDigits(raw);
        setField("nilai_investasi_display", digits ? formatRupiah(digits) : "");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const jenis =
            form.jenis_investasi === "Lainnya"
                ? form.jenis_investasi_lainnya.trim()
                : form.jenis_investasi;

        if (!form.nama_perusahaan.trim()) return toast.error("Nama perusahaan wajib diisi.");
        if (!jenis) return toast.error("Pilih atau isi jenis investasi.");
        if (!form.nilai_investasi_display) return toast.error("Nilai investasi wajib diisi.");
        if (form.estimasi_tenaga_kerja === "") return toast.error("Estimasi tenaga kerja wajib diisi.");
        if (!form.tanggal_audiensi) return toast.error("Tanggal audiensi wajib dipilih.");
        if (!form.nama_pemohon.trim()) return toast.error("Nama pemohon wajib diisi.");
        if (!form.no_whatsapp.trim()) return toast.error("Nomor WhatsApp wajib diisi.");

        setSubmitting(true);
        try {
            const { data, error } = await supabase.rpc("create_audiensi", {
                p_nama_perusahaan: form.nama_perusahaan.trim(),
                p_jenis_investasi: jenis,
                p_nilai_investasi: parseRupiahDigits(form.nilai_investasi_display),
                p_estimasi_tenaga_kerja: form.estimasi_tenaga_kerja,
                p_tanggal_audiensi: form.tanggal_audiensi,
                p_nama_pemohon: form.nama_pemohon.trim(),
                p_no_whatsapp: form.no_whatsapp.replace(/[\s-]/g, ""),
            });

            if (error) throw error;

            const kode = Array.isArray(data) ? data[0]?.out_kode : data?.out_kode;
            if (!kode) throw new Error("Kode permohonan tidak diterima dari server.");

            createLog(
                "AUDIENSI",
                `Permohonan audiensi investor baru: ${kode} oleh ${form.nama_pemohon}`,
                "info",
                { kode }
            );

            setSuccessKode(kode);
            setForm(EMPTY_FORM);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err: any) {
            console.error(err);
            const msg = mapRpcError(err?.message || "");
            toast.error(msg);
            createLog("ERROR", `Gagal kirim permohonan audiensi investor: ${err?.message}`, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCek = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cekKode.trim() || !cekWa.trim()) return;

        setChecking(true);
        setCekError(null);
        setCekResult(null);
        try {
            const { data, error } = await supabase.rpc("cek_audiensi", {
                p_kode: cekKode.trim().toUpperCase(),
                p_no_whatsapp: cekWa.replace(/[\s-]/g, ""),
            });
            if (error) throw error;

            const row = Array.isArray(data) ? data[0] : data;
            if (!row) {
                setCekError("Kode permohonan atau nomor WhatsApp tidak cocok.");
                return;
            }
            setCekResult(row as TrackResult);
        } catch (err: any) {
            console.error(err);
            setCekError("Gagal memuat data. Silakan coba lagi.");
        } finally {
            setChecking(false);
        }
    };

    const copyKode = () => {
        if (!successKode) return;
        navigator.clipboard.writeText(successKode);
        toast.success("Kode disalin ke clipboard");
    };

    return (
        <main className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-400/20 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 md:py-10">
                {/* Header bar ringkas, gaya sama seperti header "Cek Antrean" */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 p-4 sm:p-5 rounded-[16px] border-2 border-black bg-card shadow-[5px_5px_0_#000]">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 flex items-center justify-center rounded-[10px] border-2 border-black bg-primary text-primary-foreground shrink-0">
                            <Handshake size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg font-black uppercase tracking-tight text-black">Audiensi Investor</h1>
                                <Badge className="bg-emerald-500 text-white border border-black text-[9px] font-black px-2">LIVE</Badge>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                                Sistem Permohonan Audiensi DPMPTSP - Lobar
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Link href="/booking" className="flex-1 sm:flex-none">
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto h-10 px-4 bg-primary border-black text-primary-foreground hover:brightness-95 font-black uppercase text-[10px] tracking-widest rounded-xl gap-2 border-b-4 active:translate-y-[2px] active:border-b-0"
                            >
                                <ClipboardCheck size={14} /> Daftar Antrean
                            </Button>
                        </Link>
                        <Link href="/" className="flex-1 sm:flex-none">
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto h-10 px-4 bg-primary border-black text-primary-foreground hover:brightness-95 font-black uppercase text-[10px] tracking-widest rounded-xl gap-2 border-b-4 active:translate-y-[2px] active:border-b-0"
                            >
                                <Home size={14} /> Menu Utama
                            </Button>
                        </Link>
                    </div>
                </div>


                {successKode && (
                    <div className="mb-8 rounded-[10px] border-2 border-black bg-emerald-500 text-white p-6 shadow-[5px_5px_0_#000] flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <CheckCircle2 size={40} className="shrink-0" />
                        <div className="flex-1">
                            <p className="font-black uppercase tracking-widest text-sm">Permohonan Berhasil Dikirim</p>
                            <p className="text-sm font-medium mt-1">Simpan kode berikut untuk memantau status:</p>
                        </div>
                        <button
                            type="button"
                            onClick={copyKode}
                            className="bg-white hover:bg-gray-100 text-black font-mono font-black text-lg px-4 py-3 rounded-[8px] tracking-widest flex items-center gap-2 border-2 border-black shadow-[3px_3px_0_#000]"
                        >
                            {successKode} <Copy size={16} />
                        </button>
                    </div>
                )}

                <div className="flex mb-8 rounded-[12px] border-2 border-black bg-muted shadow-[4px_4px_0_#000] p-1.5 gap-1.5">
                    <button
                        type="button"
                        onClick={() => setTab("ajukan")}
                        className={`flex-1 py-2.5 rounded-[7px] font-black uppercase text-xs tracking-widest transition-all ${tab === "ajukan"
                            ? "bg-primary text-primary-foreground"
                            : "text-black hover:bg-accent"
                            }`}
                    >
                        Ajukan Permohonan
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("cek")}
                        className={`flex-1 py-2.5 rounded-[7px] font-black uppercase text-xs tracking-widest transition-all ${tab === "cek"
                            ? "bg-primary text-primary-foreground"
                            : "text-black hover:bg-accent"
                            }`}
                    >
                        Cek Status
                    </button>
                </div>

                {tab === "ajukan" ? (
                    <Card className="bg-card border-2 border-black rounded-[10px] shadow-[5px_5px_0_#000]">
                        <CardContent className="p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-[8px] border-2 border-black bg-primary text-primary-foreground shadow-[4px_4px_0_#000]">
                                    <ClipboardCheck size={22} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight text-black">Formulir Permohonan</h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">Lengkapi data permohonan audiensi</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-black">Nama Perusahaan *</Label>
                                    <Input
                                        placeholder="PT / CV Nama Perusahaan"
                                        className="bg-background border-black h-12 rounded-[8px] text-black"
                                        value={form.nama_perusahaan}
                                        onChange={(e) => setField("nama_perusahaan", e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-black">Jenis Investasi *</Label>
                                    <Select value={form.jenis_investasi} onValueChange={(v) => setField("jenis_investasi", v)}>
                                        <SelectTrigger className="w-full h-12 bg-background border-black rounded-[8px] text-black">
                                            <SelectValue placeholder="Pilih sektor investasi" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-black text-black">
                                            {JENIS_INVESTASI_OPTIONS.map((o) => (
                                                <SelectItem key={o} value={o}>{o}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.jenis_investasi === "Lainnya" && (
                                        <Input
                                            placeholder="Sebutkan jenis investasi"
                                            className="bg-background border-black h-12 rounded-[8px] mt-2 text-black"
                                            value={form.jenis_investasi_lainnya}
                                            onChange={(e) => setField("jenis_investasi_lainnya", e.target.value)}
                                            required
                                        />
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-black">Nilai Investasi (Rp) *</Label>
                                        <Input
                                            placeholder="5.000.000.000"
                                            inputMode="numeric"
                                            className="bg-background border-black h-12 rounded-[8px] text-black"
                                            value={form.nilai_investasi_display}
                                            onChange={(e) => handleNilaiChange(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-black">Estimasi Tenaga Kerja *</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            placeholder="Jumlah orang"
                                            className="bg-background border-black h-12 rounded-[8px] text-black"
                                            value={form.estimasi_tenaga_kerja}
                                            onChange={(e) => setField("estimasi_tenaga_kerja", e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-black">Tanggal Audiensi yang Dimohonkan *</Label>
                                    <Input
                                        type="date"
                                        min={getMinAudiensiDate()}
                                        max={getMaxAudiensiDate()}
                                        className="bg-background border-black h-12 rounded-[8px] text-black"
                                        value={form.tanggal_audiensi}
                                        onChange={(e) => setField("tanggal_audiensi", e.target.value)}
                                        required
                                    />
                                    <p className="text-[10px] text-slate-600 font-medium">
                                        Minimal H+3 dari hari ini, hanya hari Senin-Jumat.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-black">Nama Pemohon *</Label>
                                        <Input
                                            placeholder="Nama lengkap yang bisa dihubungi"
                                            className="bg-background border-black h-12 rounded-[8px] text-black"
                                            value={form.nama_pemohon}
                                            onChange={(e) => setField("nama_pemohon", e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-black">No. WhatsApp *</Label>
                                        <Input
                                            placeholder="08xxxxxxxxxx"
                                            inputMode="tel"
                                            className="bg-background border-black h-12 rounded-[8px] text-black"
                                            value={form.no_whatsapp}
                                            onChange={(e) => setField("no_whatsapp", e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full h-14 bg-primary text-primary-foreground font-black text-base rounded-[8px] uppercase tracking-widest gap-2 shadow-[5px_5px_0_#000]"
                                >
                                    {submitting ? (
                                        <><Loader2 className="animate-spin" size={20} /> Memproses...</>
                                    ) : (
                                        <><Send size={20} /> Kirim Permohonan</>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="bg-card border-2 border-black rounded-[10px] shadow-[5px_5px_0_#000]">
                        <CardContent className="p-6 md:p-8 space-y-4">
                            <div className="flex items-center gap-2">
                                <Search size={18} className="text-primary" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-black">Cek Status Permohonan</h3>
                            </div>
                            <form onSubmit={handleCek} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    placeholder="Kode (contoh: AUD-20260101-AB12CD)"
                                    className="bg-background border-black h-12 rounded-[8px] font-mono uppercase text-black placeholder:text-[10px]"
                                    value={cekKode}
                                    onChange={(e) => setCekKode(e.target.value)}
                                    required
                                />
                                <Input
                                    placeholder="No. WhatsApp yang didaftarkan"
                                    className="bg-background border-black h-12 rounded-[8px] text-black"
                                    value={cekWa}
                                    onChange={(e) => setCekWa(e.target.value)}
                                    required
                                />
                                <Button
                                    type="submit"
                                    disabled={checking}
                                    className="md:col-span-2 h-12 bg-blue-800 text-background font-black rounded-[8px] uppercase tracking-widest gap-2 text-xs"
                                >
                                    {checking ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />} Lacak Permohonan
                                </Button>
                            </form>

                            {cekError && <p className="text-[11px] font-bold text-red-600">{cekError}</p>}

                            {cekResult && (
                                <div className="border-2 border-black rounded-[8px] p-4 space-y-2 bg-background">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-mono text-xs font-black text-black">{cekResult.out_kode}</span>
                                        <Badge className={`border border-black text-[9px] font-black uppercase ${STATUS_STYLE[cekResult.out_status]}`}>
                                            {STATUS_LABEL[cekResult.out_status]}
                                        </Badge>
                                    </div>
                                    <p className="text-xs font-bold flex items-center gap-1 text-black"><Building2 size={13} /> {cekResult.out_nama_perusahaan}</p>
                                    <div className="text-[10px] text-slate-600 space-y-1 font-medium">
                                        <p>Tanggal diajukan: <strong className="text-black">{formatDateID(cekResult.out_tanggal_audiensi)}</strong></p>
                                        {cekResult.out_tanggal_ditetapkan && (
                                            <p>Tanggal ditetapkan: <strong className="text-black">{formatDateID(cekResult.out_tanggal_ditetapkan)}</strong></p>
                                        )}
                                        <p>Diajukan pada: <strong className="text-black">{formatDateTimeID(cekResult.out_created_at)}</strong></p>
                                        {cekResult.out_catatan_admin && (
                                            <p>Catatan: <strong className="text-black">{cekResult.out_catatan_admin}</strong></p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <footer className="mt-16 pt-8 border-t-2 border-black text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                        DPMPTSP Kabupaten Lombok Barat © 2026
                    </p>
                </footer>
            </div>
        </main>
    );
}