import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Jheison Ads Builder Pro',
    template: '%s | Jheison Ads Builder Pro',
  },
  description:
    'Construa campanhas Google Ads de alta performance para seus produtos afiliados com IA.',
  keywords: ['google ads', 'campanhas', 'afiliados', 'marketing digital'],
  authors: [{ name: 'Jheison Ads Builder' }],
  creator: 'Jheison Ads Builder Pro',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    title: 'Jheison Ads Builder Pro',
    description: 'Construa campanhas Google Ads de alta performance',
    siteName: 'Jheison Ads Builder Pro',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
