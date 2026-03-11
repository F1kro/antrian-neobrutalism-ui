'use client'
import Image from 'next/image'
import { 
  LayoutDashboard, 
  Database, 
  ClipboardList, 
  LogOut, 
  ChevronRight, 
  AlertCircle, 
  ListChecks,
  History,
  Loader2,
  BadgeInfo
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const menus = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20}/>, path: '/admin/dashboard' },
    { label: 'Manajemen Antrean', icon: <ListChecks size={20}/>, path: '/admin/antrian' },
    { label: 'Manajemen Layanan', icon: <Database size={20}/>, path: '/admin/services' },
    { label: 'Rekap Antrean', icon: <ClipboardList size={20}/>, path: '/admin/rekap' },
    { label: 'Log Sistem', icon: <History size={20}/>, path: '/admin/logs' }, // Menu log
    { label: 'Tentang SIBONA', icon: <BadgeInfo size={20}/>, path: '/admin/about' },
  ]

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      setShowLogoutDialog(false)
      
      await supabase.auth.signOut({ scope: 'global' })

      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
        })
      }

      window.location.href = '/admin/login'
      
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/admin/login'
    }
  }

  return (
    <>
      <aside className="w-72 bg-sidebar border-r-2 border-black hidden lg:flex flex-col h-screen shrink-0 sticky top-0 overflow-hidden">
        <div className="p-8 border-b-2 border-black flex items-center gap-3 shrink-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[6px] border-2 border-black bg-[#ef4444] shadow-[4px_4px_0_#000]">
            <Image src="/logo.png" alt="Logo DPMPTSP" width={20} height={26} className="h-6 w-auto object-contain" />
          </div>
          <div className="min-w-0">
            <span className="block text-xl font-black uppercase tracking-tight text-black">SI-BONA</span>
            <p className="mt-1 text-[8px] font-black uppercase tracking-[0.18em] text-black/60">
              Sistem Informasi Booking Online Antrean DPMPTSP LOBAR
            </p>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          {menus.map((menu) => (
            <button
              key={menu.path}
              onClick={() => router.push(menu.path)}
              className={`w-full flex items-center justify-between p-4 rounded-[8px] border-2 border-black font-black text-[10px] uppercase tracking-[0.16em] transition-all shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#000] ${
                pathname === menu.path 
                ? 'bg-[#ef4444] text-white' 
                : 'bg-card text-foreground hover:bg-accent'
              }`}
            >
              <div className="flex items-center gap-4">
                {menu.icon} {menu.label}
              </div>
              {pathname === menu.path && <ChevronRight size={14} />}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t-2 border-black shrink-0">
          <Button 
            variant="ghost" 
            onClick={() => setShowLogoutDialog(true)} 
            disabled={isLoggingOut}
            className="w-full justify-start bg-[#ef4444] hover:bg-[#dc2626] text-white font-black uppercase text-[10px] tracking-widest h-12 px-5 rounded-[8px] border-2 border-black gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoggingOut ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
            )}
            <span>{isLoggingOut ? 'Memproses...' : 'Keluar Sistem'}</span>
          </Button>
        </div>
      </aside>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-card border-2 border-black text-foreground rounded-[8px] p-8">
          <AlertDialogHeader className="space-y-4">
            <div className="p-4 bg-[#ef4444]/10 border-2 border-black w-fit rounded-[8px] text-[#ef4444] mx-auto">
              <AlertCircle size={40} />
            </div>
            <div className="text-center space-y-2">
              <AlertDialogTitle className="text-2xl font-black uppercase">
                Konfirmasi Logout
              </AlertDialogTitle>
              <AlertDialogDescription className="text-black/70 leading-relaxed">
                Apakah Anda yakin ingin keluar dari sistem? Anda harus{' '}
                <span className="text-[#ef4444] font-bold underline">
                  login kembali
                </span>
                {' '}untuk mengakses dashboard admin.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 flex gap-3 sm:justify-center">
            <AlertDialogCancel className="h-14 px-8 bg-white text-black border-2 border-black rounded-[8px] hover:bg-black hover:text-white transition-colors font-bold uppercase text-xs">
              BATAL
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="h-14 px-8 bg-[#ef4444] text-white font-black rounded-[8px] hover:bg-[#dc2626] border-2 border-black transition-all disabled:opacity-50"
            >
              {isLoggingOut ? 'MEMPROSES...' : 'YA, KELUAR SISTEM'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
