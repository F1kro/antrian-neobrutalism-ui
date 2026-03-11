'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldCheck, Lock, Mail, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw new Error('Email atau kata sandi tidak valid.')

      if (data.session) {
        router.push('/admin/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 bg-background overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/15 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/15 blur-[120px]" />

      <div className="w-full max-w-[440px] z-10">
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex p-3 rounded-[8px] bg-primary border-2 border-black mb-2 shadow-[4px_4px_0_#000]">
            <ShieldCheck size={40} className="text-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Portal Administrasi</h1>
          <p className="text-muted-foreground text-sm font-medium">DPMPTSP Satu Pintu | Manajemen Antrean</p>
        </div>

        <Card className="bg-card border-black rounded-[10px] overflow-hidden">
          <CardContent className="p-8 md:p-10 space-y-6">
            {error && (
              <div className="p-4 bg-destructive/10 border-2 border-black rounded-[8px] flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="p-1 rounded-[4px] bg-destructive/20 border border-black">
                  <Lock size={14} className="text-destructive" />
                </div>
                <p className="text-destructive text-xs font-semibold">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold text-foreground/70 uppercase tracking-widest ml-1">
                  Email Petugas
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-primary transition-colors" size={18} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@dinas.go.id"
                    className="h-14 pl-12 rounded-[8px] text-foreground placeholder:text-foreground/40 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold text-foreground/70 uppercase tracking-widest ml-1">
                  Kata Sandi
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-primary transition-colors" size={18} />
                  <Input
                    id="password"
                    type="password"
                    placeholder="........"
                    className="h-14 pl-12 rounded-[8px] text-foreground placeholder:text-foreground/40 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-primary hover:brightness-95 text-foreground font-bold rounded-[8px] transition-all"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={20} className="animate-spin" />
                    <span>Otentikasi...</span>
                  </div>
                ) : (
                  'Masuk Dashboard'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors text-sm font-semibold">
            <ArrowLeft size={16} />
            <span>Kembali ke Halaman Publik</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
