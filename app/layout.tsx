import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Pitchdeck — Book smarter. Not louder.',
  description: 'A CRM and booking platform for independent DJs, selectors, and music artists.',
  keywords: ['DJ booking', 'venue CRM', 'DJ management', 'music outreach'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="bg-[#09090b] text-zinc-50 antialiased">
        {children}
      </body>
    </html>
  )
}
