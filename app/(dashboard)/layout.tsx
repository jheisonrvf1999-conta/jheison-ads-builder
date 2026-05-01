import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const supabase = createAdminClient()

  const [userResult, subResult] = await Promise.all([
    supabase
      .from('users')
      .select('google_ads_connected, last_sync_at')
      .eq('id', session.user.id)
      .single(),
    supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .maybeSingle(),
  ])

  const googleAdsConnected = userResult.data?.google_ads_connected ?? false
  const lastSyncAt = userResult.data?.last_sync_at ?? null
  const userPlan = subResult.data?.plan ?? 'free'

  return (
    <DashboardShell
      googleAdsConnected={googleAdsConnected}
      lastSyncAt={lastSyncAt}
      userPlan={userPlan}
      userName={session.user.name}
      userEmail={session.user.email}
    >
      {children}
    </DashboardShell>
  )
}
