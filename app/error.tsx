"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw, Siren } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("SYSTEM_CRASH:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar p-6 text-center">
      <div className="w-full max-w-xl rounded-[2rem] border-2 border-black bg-card p-8 shadow-[10px_10px_0_#000]">
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] border-2 border-black bg-red-500/10">
          <AlertTriangle size={52} className="text-red-600" />
          <Siren size={18} className="absolute -right-2 -top-2 text-red-600" />
        </div>

        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-red-600">Status Gangguan</p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-tighter text-foreground">
          Sistem Terhenti
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-relaxed text-muted-foreground">
          Terjadi gangguan pada sistem atau koneksi database terputus. Coba muat ulang halaman.
          Jika tetap gagal, periksa log sistem admin.
        </p>

        <div className="mt-6 rounded-2xl border border-black bg-sidebar px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-foreground/60">
            Error ID: {error.digest || "UNKNOWN_STATION"}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Button
            onClick={() => reset()}
            className="h-14 flex-1 bg-primary hover:brightness-95 text-foreground font-black rounded-2xl border-b-4 border-black active:translate-y-[2px] active:border-b-0 transition-all gap-2 uppercase text-xs"
          >
            <RefreshCw size={18} /> Muat Ulang
          </Button>
          <Link href="/" className="flex-1">
            <Button
              variant="outline"
              className="w-full h-14 bg-card border-black text-muted-foreground hover:text-foreground rounded-2xl border-b-4 border-black active:translate-y-[2px] active:border-b-0 transition-all gap-2 uppercase text-xs"
            >
              <Home size={18} /> Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
