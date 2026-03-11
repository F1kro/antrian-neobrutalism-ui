import Link from "next/link";
import { ArrowLeft, MapPinned, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar p-6 text-center">
      <div className="w-full max-w-xl rounded-[2rem] border-2 border-black bg-card p-8 shadow-[10px_10px_0_#000]">
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] border-2 border-black bg-primary/10">
          <SearchX size={46} className="text-primary" />
          <MapPinned size={18} className="absolute -right-2 -top-2 text-primary" />
        </div>

        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Status 404</p>
        <h1 className="mt-3 text-6xl font-black uppercase tracking-tighter text-foreground">
          Halaman Hilang
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Tautan atau halaman yang Anda buka tidak tersedia, sudah dipindahkan, atau alamatnya tidak valid.
        </p>

        <div className="mt-6 rounded-2xl border border-black bg-sidebar px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-foreground/60">
            Periksa URL atau kembali ke beranda sistem
          </p>
        </div>

        <Link href="/" className="mt-8 inline-flex">
          <Button className="h-14 px-10 bg-primary hover:brightness-95 text-foreground font-black rounded-2xl border-b-4 border-black active:translate-y-[2px] active:border-b-0 transition-all gap-3 uppercase text-xs">
            <ArrowLeft size={18} /> Kembali ke Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
