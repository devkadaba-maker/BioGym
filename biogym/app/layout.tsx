import { type Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Inter, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import Navbar from '@/components/Navbar'
import { ThemeProvider } from '@/context/ThemeContext'
import { SubscriptionProvider } from '@/context/SubscriptionContext'
import SessionGuard from '@/components/SessionGuard'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'BioGym.fit - Smarter Training, Rapid Gains',
  description: 'Your body is almost there. We take you to the next level with AI anatomical analysis using muscle tissue, fat tissue, and machine learning.',
  keywords: ['fitness', 'AI', 'training', 'body composition', 'physique', 'workout', 'machine learning'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#D4FF00',
          colorBackground: '#252525',
          colorText: '#080808ff',
          colorTextSecondary: '#9ca3af',
        },
      }}
    >
      <html lang="en" className="dark">
        <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
          <ThemeProvider>
            <SubscriptionProvider>
              <SessionGuard>
                <Navbar />
                {children}
                <Toaster position="top-center" richColors />
              </SessionGuard>
            </SubscriptionProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}