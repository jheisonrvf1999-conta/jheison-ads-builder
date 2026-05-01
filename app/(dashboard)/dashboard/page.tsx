import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'
import { Plus, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentCampaigns } from '@/components/dashboard/recent-campaigns'
import type { DashboardStats, CampaignSummary } from '@/types'
import { PLANS } from '@/types'

export const metadata = { title: 'Dashboard' }

async function getDashboardData(userId: string) {
  const supabase = createAdminClient()

  const [campaignsResult, subResult] = await Promise.all([
    supabase
      .from('campaigns')
      .select(
        'id, product_name, category, status, google_ads_campaign_id, estimated_cpc, real_cpc, created_at, updated_at, keywords, ad_groups'
      )
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle(),
  ])

  const campaigns = campaignsResult.data ?? []
  const plan = (subResult.data?.plan as string) ?? 'free'
  const planConfig = PLANS[plan] ?? PLANS.free

  const stats: DashboardStats = {
    totalCampaigns: campaigns.length,
    draftCampaigns: campaigns.filter((c) => c.status === 'draft').length,
    activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
    exportedCampaigns: campaigns.filter((c) => c.status === 'exported').length,
    syncedCampaigns: campaigns.filter((c) => c.status === 'synced').length,
    monthlySpend: 0,
    planName: planConfig.name,
    campaignsUsed: campaigns.length,
    campaignsLimit: planConfig.campaigns,
  }

  const recentCampaigns: CampaignSummary[] = campaigns.slice(0, 8).map((c) => ({
    id: c.id,
    name: c.product_name ?? 'Sem nome',
    productName: c.product_name ?? 'Sem nome',
    category: c.category ?? 'outro',
    status: c.status as CampaignSummary['status'],
    adGroupCount: Array.isArray(c.ad_groups) ? c.ad_groups.length : 0,
    keywordCount: Array.isArray(c.keywords) ? c.keywords.length : 0,
    googleAdsCampaignId: c.google_ads_campaign_id,
    estimatedCpc: c.estimated_cpc,
    realCpc: c.real_cpc,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }))

  return { stats, recentCampaigns }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { stats, recentCampaigns } = await getDashboardData(session.user.id)

  const nearLimit =
    stats.campaignsLimit > 0 &&
    stats.campaignsUsed / stats.campaignsLimit >= 0.9

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Bom dia, {session.user.name?.split(' ')[0] ?? 'usuário'} 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Aqui está um resumo das suas campanhas.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova Campanha
          </Link>
        </Button>
      </div>

      {/* Near-limit warning */}
      {nearLimit && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
          <TrendingUp className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Você usou {stats.campaignsUsed} de {stats.campaignsLimit} campanhas do seu plano.{' '}
            <Link href="/billing" className="font-medium underline underline-offset-2">
              Faça upgrade
            </Link>{' '}
            para criar mais.
          </span>
        </div>
      )}

      {/* Stats cards */}
      <StatsCards stats={stats} />

      {/* Recent campaigns */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Campanhas Recentes</CardTitle>
          <Button variant="ghost" size="sm" asChild className="text-indigo-400 hover:text-indigo-300">
            <Link href="/campaigns">Ver todas</Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-0 px-0">
          <Suspense fallback={<RecentCampaigns loading />}>
            <RecentCampaigns campaigns={recentCampaigns} />
          </Suspense>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-dashed hover:border-indigo-500/50 transition-colors cursor-pointer">
          <CardContent className="p-5">
            <Link href="/campaigns/new" className="flex flex-col gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
                <Plus className="h-5 w-5 text-indigo-400" />
              </div>
              <p className="font-medium text-foreground text-sm">Nova Campanha</p>
              <p className="text-xs text-muted-foreground">
                Analise uma página e gere anúncios em minutos.
              </p>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-dashed hover:border-purple-500/50 transition-colors cursor-pointer">
          <CardContent className="p-5">
            <Link href="/templates" className="flex flex-col gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <p className="font-medium text-foreground text-sm">Usar Template</p>
              <p className="text-xs text-muted-foreground">
                Suplemento, Curso, Software e mais.
              </p>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-dashed hover:border-green-500/50 transition-colors cursor-pointer">
          <CardContent className="p-5">
            <Link href="/performance" className="flex flex-col gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
              <p className="font-medium text-foreground text-sm">Ver Performance</p>
              <p className="text-xs text-muted-foreground">
                CPC estimado vs. real para suas campanhas.
              </p>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
