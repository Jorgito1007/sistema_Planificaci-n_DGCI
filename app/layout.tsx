import React from "react"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from "sonner"
import AuthProvider from "@/components/auth-provider"

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Sistema de Control Interno UNCSM',
  description: 'Sistema de seguimiento y control de documentos internos institucional',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
