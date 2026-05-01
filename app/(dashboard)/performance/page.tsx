import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'
import type { Metadata } from 'next'
import { CpcComparisonTable } from '@/components/performance/cpc-comparison-table'
import { CpcSummaryCards } from '@/components/performance/cpc-summary-cards'
import { KeywordPerformanceTable } from '@/components/performance/keyword-performance-table'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = { title: 'Performance' }

interface CampaignRow {
  id: string
  product_name: string
  estimated_cpc: number | null
  real_cpc: number | null
  cpc_deviation: number | null
  sync_status: string | null
  last_sync_at: string | null
  status: string
  created_at: string
}

interface KeywordPerfRow {
  id: string
  campaign_id: string
  keyword: string
  estimated_cpc: number
  real_cpc: number | null
  impressions: number | null
  clicks: number | null
  recorded_at: string
}

async function getPerformanceData(userId: string) {
  const supabase = createAdminClient()

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select(
      'id, product_name, estimated_cpc, real_cpc, cpc_deviation, sync_status, last_sync_at, status, created_at'
    )
    .eq('user_id', userId)
    .is('deleted_at', null)
    .not('estimated_cpc', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50)

  const campaignIds = (campaigns ?? []).map((c) => c.id)
  let keywordPerf: KeywordPerfRow[] = []

  if (campaignIds.length > 0) {
    const { data } = await supabase
      .from('campaign_performance')
      .select('id, campaign_id, keyword, estimated_cpc, real_cpc, impressions, clicks, recorded_at')
      .in('campaign_id', campaignIds)
      .order('recorded_at', { ascending: false })
      .limit(200)
    keywordPerf = (data ?? []) as KeywordPerfRow[]
  }

  const typedCampaigns = (campaigns ?? []) as CampaignRow[]
  const withReal = typedCampaigns.filter((c) => c.real_cpc != null)
  const avgDev =
    withReal.length > 0
      ? withReal.reduce((sum, c) => sum + Math.abs(Number(c.cpc_deviation ?? 0)), 0) / withReal.length
      : null

  return {
    campaigns: typedCampaigns,
    keywordPerf,
    summary: {
      totalTracked: typedCampaigns.length,
      withRealCpc: withReal.length,
      avgCpcDeviation: avgDev !== null ? Math.round(avgDev * 1000) / 10 : null, // percentage
    },
  }
}

export default async function PerformancePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { campaigns, keywordPerf, summary } = await getPerformanceData(session.user.id)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Performance</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Comparativo de CPC estimado vs. real para suas campanhas no Google Ads.
        </p>
      </div>

      <CpcSummaryCards summary={summary} />

      <Separator />

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-foreground">CPC por Campanha</h3>
        <CpcComparisonTable campaigns={campaigns} />
      </section>

      {keywordPerf.length > 0 && (
        <>
          <Separator />
          <section className="space-y-3">
            <h3 className="text-base font-semibold text-foreground">
              Histórico por Palavra-chave
            </h3>
            <KeywordPerformanceTable rows={keywordPerf} campaigns={campaigns} />
          </section>
        </>
      )}

      {campaigns.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground text-sm">
            Nenhuma campanha com dados de CPC ainda.
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            Conecte o Google Ads e sincronize suas campanhas para ver os dados de performance.
          </p>
        </div>
      )}
    </div>
  )
}
