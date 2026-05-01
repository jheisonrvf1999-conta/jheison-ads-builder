import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Autenticação',
    template: '%s | Jheison Ads Builder Pro',
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 mb-4">
            <span className="text-white font-bold text-xl">J</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Jheison Ads Builder Pro</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Campanhas Google Ads de alta performance
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
