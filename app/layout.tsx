import type { Metadata, Viewport } from 'next'
import { Manrope, Sora } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "ZingZing - Saudi Arabia's Influencer Marketplace",
  description:
    "Discover creators and collaborate through paid, barter, and hybrid partnerships on Saudi Arabia's premium influencer marketplace.",
  keywords: ['influencer marketing', 'Saudi Arabia', 'creators', 'brand collaborations', 'barter deals'],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml', sizes: '32x32' },
      { url: '/app-icon.svg', type: 'image/svg+xml', sizes: '80x80' },
    ],
    shortcut: ['/favicon.svg'],
    apple: [{ url: '/app-icon.svg', sizes: '80x80', type: 'image/svg+xml' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#16a34a',
  interactiveWidget: 'resizes-content',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${manrope.variable} ${sora.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster position="top-center" richColors />
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
