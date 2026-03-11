import { Loader2, Sparkles } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar px-6 py-12">
      <div className="w-full max-w-md rounded-[2rem] border-2 border-black bg-card p-8 text-center shadow-[10px_10px_0_#000]">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border-2 border-black bg-primary/10">
          <div className="relative flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" size={40} />
            <Sparkles className="absolute -right-5 -top-5 h-5 w-5 text-primary" />
          </div>
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.32em] text-primary">Memuat Sistem</p>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-foreground">
          Sinkronisasi Data
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Sistem sedang menyiapkan halaman dan mengambil data terbaru dari antrean layanan.
        </p>
        <div className="mt-6 rounded-2xl border border-black bg-sidebar px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-foreground/60">
            DPMPTSP Kabupaten Lombok Barat
          </p>
        </div>
      </div>
    </div>
  );
}
