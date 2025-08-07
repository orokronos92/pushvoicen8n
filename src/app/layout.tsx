import './globals.css'
import PolyfillLoader from '@/components/PolyfillLoader'
import ErrorBoundary from '@/lib/errors/ErrorBoundary'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PushVoice',
  description: 'Application de communication vocale avec n8n',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <PolyfillLoader />
        <ErrorBoundary>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  )
}