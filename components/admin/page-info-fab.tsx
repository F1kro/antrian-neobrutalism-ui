'use client'

import { Info, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type AdminPageInfoFabProps = {
  title: string
  description: string
  points: string[]
}

export default function AdminPageInfoFab({
  title,
  description,
  points,
}: AdminPageInfoFabProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon"
          className="fixed right-6 bottom-6 z-40 h-14 w-14 rounded-full border-2 border-black bg-primary text-primary-foreground shadow-[6px_6px_0_#000] hover:brightness-95 lg:right-8 lg:bottom-8"
        >
          <Info size={20} />
          <span className="sr-only">Informasi halaman</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-3rem)] overflow-hidden sm:max-w-md rounded-[2rem] border-black bg-card p-0 text-foreground">
        <div className="border-b border-black bg-sidebar px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-black bg-primary text-primary-foreground">
              <Sparkles size={20} />
            </div>
            <DialogHeader className="gap-1 text-left">
              <DialogTitle className="text-xl font-black uppercase tracking-tight">
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-[0.18em] text-foreground/60">
                Informasi Menu
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>
        <div className="space-y-4 px-6 py-5">
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          <div className="space-y-2">
            {points.map((point) => (
              <div
                key={point}
                className="flex items-start gap-3 rounded-2xl border border-black bg-sidebar/70 px-4 py-3"
              >
                <span className="mt-1 block h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                <p className="text-sm font-bold leading-relaxed text-foreground">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
