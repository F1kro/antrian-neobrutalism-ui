'use client'

import Image from 'next/image'
import { BadgeInfo, Building2, Code2, ShieldCheck, Sparkles, Target } from 'lucide-react'

import Sidebar from '@/components/admin/sidebar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AboutSibonaPage() {
  return (
    <div className="flex h-screen w-full bg-sidebar text-foreground overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-sidebar">
        <div className="flex-1 overflow-y-auto bg-sidebar p-4 md:p-6 space-y-6 custom-scrollbar">
          <header className="flex flex-col gap-4 rounded-3xl border-2 border-black bg-card p-6 shadow-[6px_6px_0_#000]">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-black bg-primary text-primary-foreground">
                <BadgeInfo size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tight">Tentang SIBONANZA</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/70">
                  Sistem Informasi Booking Online Pelayanan Perizinan
                </p>
              </div>
            </div>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              SIBONANZA adalah platform antrean digital untuk membantu proses pendaftaran, pemantauan,
              dan pengelolaan antrean layanan secara lebih tertib, cepat, dan mudah dipantau.
            </p>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2 rounded-3xl border-2 border-black bg-card p-6 shadow-[6px_6px_0_#000]">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-black bg-amber-400 text-white">
                  <Building2 size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Detail Website</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-foreground/60">
                    Ringkasan Platform
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border-2 border-black bg-sidebar p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/60">Nama Sistem</p>
                  <p className="mt-2 text-lg font-black uppercase">SIBONANZA</p>
                </div>
                <div className="rounded-2xl border-2 border-black bg-sidebar p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/60">Kepanjangan</p>
                  <p className="mt-2 text-lg font-black uppercase">Sistem Informasi Booking Online Pelayanan Perizinan</p>
                </div>
                <div className="rounded-2xl border-2 border-black bg-sidebar p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/60">Instansi</p>
                  <p className="mt-2 text-lg font-black uppercase">Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu</p>
                </div>
                <div className="rounded-2xl border-2 border-black bg-sidebar p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/60">Fokus</p>
                  <p className="mt-2 text-lg font-black uppercase">Booking, monitoring, dan manajemen antrean layanan</p>
                </div>
                <div className="rounded-2xl border-2 border-black bg-sidebar p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/60">Periode Pengembangan</p>
                  <p className="mt-2 text-lg font-black uppercase">2026</p>
                </div>
                <div className="rounded-2xl border-2 border-black bg-sidebar p-4 md:col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/60">Tech Stack</p>
                  <p className="mt-2 text-lg font-black uppercase">Next.js, React, TypeScript, Tailwind CSS, Supabase, Sonner</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl border-2 border-black bg-card p-6 shadow-[6px_6px_0_#000]">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-black bg-red-600 text-white">
                  <Code2 size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Pengembang</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-foreground/60">
                    Profil Utama
                  </p>
                </div>
              </div>
              <div className="rounded-[1.75rem] border-2 border-black bg-sidebar p-4 text-center">
                <div className="mx-auto mb-4 h-36 w-36 overflow-hidden rounded-[1.75rem] border-2 border-black bg-white shadow-[5px_5px_0_#000]">
                  <Image src="/opik.jpeg" alt="Foto pengembang" width={320} height={420} className="h-full w-full object-cover object-center" />
                </div>
                <Badge className="bg-primary text-white border-black text-[10px] font-black uppercase">Pengembang Utama</Badge>
                <h3 className="mt-3 text-2xl font-black uppercase tracking-tight">Fiqro Najiah</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Perancang dan pengembang sistem booking antrean online berbasis web untuk mendukung pelayanan yang lebih tertib dan mudah dipantau.
                </p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-3xl border-2 border-black bg-card p-6 shadow-[6px_6px_0_#000]">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-black bg-emerald-600 text-white">
                  <Target size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Visi</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-foreground/60">
                    Arah Pengembangan
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border-2 border-black bg-sidebar p-5">
                <p className="text-sm leading-relaxed font-bold text-foreground">
                  Menjadi sistem antrean layanan publik yang modern, mudah diakses, dan mampu meningkatkan kualitas pengalaman masyarakat dalam mendapatkan layanan.
                </p>
              </div>
            </Card>

            <Card className="rounded-3xl border-2 border-black bg-card p-6 shadow-[6px_6px_0_#000]">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-black bg-primary text-white">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Misi</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-foreground/60">
                    Sasaran Utama
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  'Mempermudah masyarakat melakukan booking antrean secara online.',
                  'Menyediakan informasi antrean yang transparan dan dapat dipantau real-time.',
                  'Membantu petugas mengelola antrean layanan dengan lebih terstruktur.',
                  'Mendorong pelayanan publik yang lebih efisien, tertib, dan responsif.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border-2 border-black bg-sidebar p-4">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black bg-amber-400 text-white">
                      <Sparkles size={12} />
                    </div>
                    <p className="text-sm font-bold leading-relaxed text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

    </div>
  )
}
