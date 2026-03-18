"use client"

import type { CSSProperties } from "react"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-[14px] border-2 border-black bg-card text-white shadow-[6px_6px_0_#000] p-4 font-bold gap-3 !text-white",
          title: "text-[13px] font-black uppercase tracking-[0.16em] text-white",
          description: "text-[12px] font-bold text-white/90 leading-relaxed",
          content: "gap-1.5",
          icon: "mt-0.5 text-white",
          actionButton:
            "rounded-xl border-2 border-black bg-white text-black font-black uppercase text-[10px] shadow-[4px_4px_0_#000]",
          cancelButton:
            "rounded-xl border-2 border-black bg-black text-white font-black uppercase text-[10px] shadow-[4px_4px_0_#000]",
          success: "bg-emerald-600 text-white border-black",
          error: "bg-red-600 text-white border-black",
          warning: "bg-amber-500 text-white border-black",
          info: "bg-primary text-white border-black",
          loading: "bg-slate-800 text-white border-black",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-5 text-white" />,
        info: <InfoIcon className="size-5 text-white" />,
        warning: <TriangleAlertIcon className="size-5 text-white" />,
        error: <OctagonXIcon className="size-5 text-white" />,
        loading: <Loader2Icon className="size-5 animate-spin text-white" />,
      }}
      style={
        {
          "--normal-bg": "var(--color-card)",
          "--normal-text": "var(--color-foreground)",
          "--normal-border": "var(--color-border)",
          "--success-bg": "rgb(5 150 105)",
          "--success-text": "rgb(255 255 255)",
          "--success-border": "rgb(0 0 0)",
          "--error-bg": "rgb(220 38 38)",
          "--error-text": "rgb(255 255 255)",
          "--error-border": "rgb(0 0 0)",
          "--warning-bg": "rgb(245 158 11)",
          "--warning-text": "rgb(255 255 255)",
          "--warning-border": "rgb(0 0 0)",
          "--info-bg": "var(--color-primary)",
          "--info-text": "rgb(255 255 255)",
          "--info-border": "var(--color-border)",
          "--border-radius": "14px",
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
