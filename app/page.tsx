"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import AdminPageInfoFab from "@/components/admin/page-info-fab";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Analytics } from "@vercel/analytics/next"
import {
  ClipboardCheck,
  MonitorPlay,
  MousePointer2,
  History,
} from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden">
      {/* Lampu latar */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/20 blur-[100px] rounded-full" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-24">
        {/* Bagian hero */}
        <section className="text-center space-y-6 mb-16 md:mb-24">
          <div className="inline-flex max-w-4xl items-center gap-3 px-4 py-3 rounded-[8px] bg-secondary border-2 border-black text-black text-[10px] md:text-xs font-bold tracking-[0.14em] uppercase mb-4 shadow-[4px_4px_0_#000] text-left leading-tight">
            <Image src="/logo.png" alt="Logo DPMPTSP" width={22} height={28} className="h-7 w-auto shrink-0 object-contain rounded-sm" />
            <span>DINAS PENANAMAN MODAL DAN PELAYANAN TERPADU SATU PINTU LOMBOK BARAT</span>
          </div>
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-center leading-none">
              <span className="text-6xl md:text-8xl font-black tracking-tighter uppercase text-foreground">
                <span className="text-primary">SI</span>
                <span className="text-foreground">-</span>
                <span className="text-red-600">BONANZA</span>
              </span>
            </h1>
            <div className="max-w-3xl rounded-[10px] border-2 border-black bg-card px-5 py-4 shadow-[5px_5px_0_#000]">
              <p className="text-[11px] md:text-sm font-black uppercase tracking-[0.18em] text-slate-800">
                Sistem Informasi Booking Online Pelayanan Perizinan
              </p>
            </div>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed px-4">
            Cara baru urus antrean di DPMPTSP Lombok Barat. Lebih praktis,
            transparan, dan pastinya bisa dipantau dari manapun.
          </p>
        </section>

        {/* Bagian menu */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 max-w-6xl mx-auto">
          <MenuCard
            href="/booking"
            title="Daftar Antrean"
            desc="Ambil nomor antrean secara online tanpa perlu datang langsung ke kantor."
            icon={<ClipboardCheck size={48} />}
            color="indigo"
          />
          <MenuCard
            href="/antrean"
            title="Cek Antrean"
            desc="Pantau nomor antrean yang sedang dilayani secara real-time dari HP Anda."
            icon={<MonitorPlay size={48} />}
            color="red"
          />
          {/* Menu riwayat */}
          <MenuCard
            href="/riwayat-antrian"
            title="Riwayat Saya"
            desc="Lihat kembali daftar tiket dan riwayat kunjungan antrean Anda sebelumnya."
            icon={<History size={48} />}
            color="yellow"
          />
        </div>

        {/* Bagian bawah */}
        <footer className="mt-24 pt-12 border-t-2 border-black text-center space-y-6">
          <div className="space-y-2 px-4">
            <p className="text-foreground font-black tracking-[0.2em] text-base md:text-sm uppercase">
              DPMPTSP KABUPATEN LOMBOK BARAT
            </p>
            <p className="text-muted-foreground text-sm md:text-base font-medium leading-relaxed max-w-lg mx-auto italic">
              Jl. Soekarno - Hatta No. 1, Giri Menang, Gerung, Kabupaten Lombok
              Barat, Nusa Tenggara Barat.
            </p>
          </div>

          <div className="pt-6 border-t border-black/50 max-w-xs mx-auto">
            <p className="text-foreground/80 text-xs md:text-sm font-black uppercase tracking-widest">
              Sistem Antrean Terpadu © 2026
            </p>
            <p className="text-muted-foreground text-xs md:text-sm mt-1 italic font-mono">
              Layanan cepat, transparan, dan akuntabel.
            </p>
          </div>
        </footer>
      </div>
      <AdminPageInfoFab
        title="Menu Utama"
        description="Halaman ini adalah pintu masuk pengguna untuk memilih fitur utama pada sistem antrean online."
        points={[
          "Pilih Daftar Antrean untuk mengambil nomor antrean baru.",
          "Pilih Cek Antrean untuk memantau antrean berjalan secara live.",
          "Pilih Riwayat Saya untuk melihat tiket dan antrean yang pernah diambil.",
        ]}
      />
    </main>
  );
}

function MenuCard({
  href,
  title,
  desc,
  icon,
  color,
}: {
  href: string;
  title: string;
  desc: string;
  icon: any;
  color: "indigo" | "red" | "yellow";
}) {
  const styles = {
    indigo: {
      border: "border-black",
      icon: "text-primary-foreground bg-primary border-black",
      button: "bg-primary hover:brightness-95 text-primary-foreground",
    },
    red: {
      border: "border-black",
      icon: "text-primary-foreground bg-red-600 border-black",
      button: "bg-red-600 hover:bg-red-700 text-primary-foreground",
    },
    yellow: {
      border: "border-black",
      icon: "text-primary-foreground bg-amber-400 border-black",
      button: "bg-amber-400 hover:bg-amber-500 text-primary-foreground",
    },
  };

  return (
    <Card
      className={`h-full bg-card ${styles[color].border} rounded-[10px] p-8 md:p-10 transition-all border-2 flex flex-col`}
    >
      <CardContent className="p-0 flex flex-col items-center text-center space-y-8 flex-1">
        <div
          className={`p-6 rounded-[8px] border-2 ${styles[color].border} ${styles[color].icon} shadow-[4px_4px_0_#000]`}
        >
          {icon}
        </div>

        <div className="space-y-4 flex-1">
          <h2 className="text-3xl md:text-3xl font-black text-foreground uppercase tracking-tighter">
            {title}
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed font-medium">
            {desc}
          </p>
        </div>

        <Link href={href} className="w-full">
          <Button
            className={`w-full h-16 rounded-[8px] text-lg font-black uppercase tracking-widest gap-3 ${styles[color].button}`}
          >
            KLIK DI SINI <MousePointer2 size={20} />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
