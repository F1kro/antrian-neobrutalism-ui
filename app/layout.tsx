import React from "react"
import type { Metadata } from 'next'
import { Space_Grotesk, IBM_Plex_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from "@/components/ui/sonner"
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "700"],
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: 'SIBONANZA | Sistem Informasi Booking Online Pelayanan Perizinan',
  description: 'SIBONANZA adalah layanan booking antrean online pelayanan dan perizinan untuk DPMPTSP Lombok Barat.',
  generator: 'Fiqro Najiah',
  icons: {
    icon: [
      {
        url: '/logo.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/logo.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/logo.png',
        type: 'image/png',
      },
    ],
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${plexMono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
