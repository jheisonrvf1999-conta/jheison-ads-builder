'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { cn } from '@/lib/utils'

interface DashboardShellProps {
  children: React.ReactNode
  googleAdsConnected?: boolean
  lastSyncAt?: string | null
  userPlan?: string
  userName?: string | null
  userEmail?: string | null
}

export function DashboardShell({
  children,
  googleAdsConnected,
  lastSyncAt,
  userPlan,
  userName,
  userEmail,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — hidden on mobile, shown on lg+ */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-30 lg:static lg:z-auto lg:flex',
          mobileOpen ? 'flex' : 'hidden'
        )}
      >
        <Sidebar
          googleAdsConnected={googleAdsConnected}
          lastSyncAt={lastSyncAt}
          userPlan={userPlan}
          userName={userName ?? undefined}
          userEmail={userEmail ?? undefined}
        />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMobileMenuToggle={() => setMobileOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
