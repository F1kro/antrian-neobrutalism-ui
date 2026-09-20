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
  Handshake,
} from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden">
      {/* Lampu latar */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/20 blur-[100px] rounded-full" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 md:py-24">
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
                <span className="text-red-600">BONA</span>
              </span>
            </h1>
            <div className="max-w-3xl rounded-[10px] border-2 border-black bg-card px-5 py-4 shadow-[5px_5px_0_#000]">
              <p className="text-[11px] md:text-sm font-black uppercase tracking-[0.18em] text-slate-800">
               Sistem Informasi Booking Online Nomer Antrian
              </p>
            </div>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed px-4">
            Cara baru urus antrean di DPMPTSP Lombok Barat. Lebih praktis,
            transparan, dan pastinya bisa dipantau dari manapun.
          </p>
        </section>

        {/* Bagian menu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <MenuCard
            href="/booking"
            title="Daftar Antrean"
            desc="Ambil nomor antrean secara online tanpa perlu datang langsung ke kantor."
            icon={<ClipboardCheck size={40} />}
            color="indigo"
          />
          <MenuCard
            href="/antrean"
            title="Cek Antrean"
            desc="Pantau nomor antrean yang sedang dilayani secara real-time dari HP Anda."
            icon={<MonitorPlay size={40} />}
            color="red"
          />
          {/* Menu riwayat */}
          <MenuCard
            href="/riwayat-antrian"
            title="Riwayat Saya"
            desc="Lihat kembali daftar tiket dan riwayat kunjungan antrean Anda sebelumnya."
            icon={<History size={40} />}
            color="yellow"
          />
          {/* Menu audiensi & investor */}
          <MenuCard
            href="/audiensi"
            title="Audiensi & Investor"
            desc="Ajukan jadwal audiensi atau konsultasi penanaman modal secara online dengan DPMPTSP."
            icon={<Handshake size={40} />}
            color="green"
          />
        </div>

        {/* Bagian bawah */}
        {/* Bagian bawah */}
        <footer className="mt-24 pt-12 border-t-2 border-black text-center space-y-6">
          <div className="space-y-1 px-4">
            <p className="text-foreground font-black tracking-[0.2em] text-sm uppercase">
              Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu
            </p>
            <p className="text-primary font-black tracking-[0.15em] text-xs uppercase">
              DPMPTSP Kabupaten Lombok Barat
            </p>
          </div>

          <div className="text-muted-foreground text-sm font-medium space-y-1">
            <p>Jalan TGH Lopan Labuapi, Lombok Barat, NTB 83361</p>
            <p>
              Telp.{" "}
              <a href="tel:+6285338401456" className="text-primary font-bold hover:underline">
                +62 853-3840-1456
              </a>
              {" · "}
              Email.{" "}
              <a href="mailto:dpm_ptsp_lobar@yahoo.com" className="text-primary font-bold hover:underline">
                dpm_ptsp_lobar@yahoo.com
              </a>
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
          "Pilih Audiensi & Investor untuk mengajukan jadwal audiensi atau konsultasi penanaman modal.",
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
  color: "indigo" | "red" | "yellow" | "green";
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
    green: {
      border: "border-black",
      icon: "text-primary-foreground bg-emerald-500 border-black",
      button: "bg-emerald-500 hover:bg-emerald-600 text-primary-foreground",
    },
  };

  return (
    <Card
      className={`h-full bg-card ${styles[color].border} rounded-[10px] p-6 transition-all border-2 flex flex-col shadow-[6px_6px_0_#000]`}
    >
      <CardContent className="p-0 flex flex-col items-center text-center space-y-6 flex-1">
        <div
          className={`p-5 rounded-[8px] border-2 ${styles[color].border} ${styles[color].icon} shadow-[4px_4px_0_#000]`}
        >
          {icon}
        </div>

        <div className="space-y-3 flex-1 w-full">
          <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter min-h-[4rem] flex items-center justify-center">
            {title}
          </h2>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed font-medium">
            {desc}
          </p>
        </div>

        <Link href={href} className="w-full">
          <Button
            className={`w-full h-14 rounded-[8px] text-base font-black uppercase tracking-wider gap-2 ${styles[color].button}`}
          >
            KLIK DI SINI <MousePointer2 size={18} />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}