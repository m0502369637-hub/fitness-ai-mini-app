import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { Toaster } from 'sonner'
import './globals.css'
import { TelegramProvider } from '@/providers/TelegramProvider'
import { ConvexClientProvider } from '@/providers/ConvexClientProvider'
import { AppDataProvider } from '@/providers/AppDataProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FitAI — Fitness AI Mini App',
  description: 'AI coaching and custom workout plans, powered by points.',
  formatDetection: { telephone: false },
  robots: 'noindex,nofollow',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  minimumScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>
        <TelegramProvider>
          <ConvexClientProvider>
            <AppDataProvider>{children}</AppDataProvider>
          </ConvexClientProvider>
          <Toaster richColors position="top-center" />
        </TelegramProvider>
      </body>
    </html>
  )
}
