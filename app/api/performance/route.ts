import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Campaigns with CPC data
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select(
      'id, product_name, estimated_cpc, real_cpc, cpc_deviation, sync_status, last_sync_at, status, created_at'
    )
    .eq('user_id', session.user.id)
    .is('deleted_at', null)
    .not('estimated_cpc', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50)

  // Per-keyword performance
  const campaignIds = (campaigns ?? []).map((c) => c.id)

  let keywordPerf: unknown[] = []
  if (campaignIds.length > 0) {
    const { data } = await supabase
      .from('campaign_performance')
      .select('id, campaign_id, keyword, estimated_cpc, real_cpc, impressions, clicks, recorded_at')
      .in('campaign_id', campaignIds)
      .order('recorded_at', { ascending: false })
      .limit(200)
    keywordPerf = data ?? []
  }

  // Summary stats
  const withReal = (campaigns ?? []).filter((c) => c.real_cpc != null)
  const avgDeviation =
    withReal.length > 0
      ? withReal.reduce((sum, c) => sum + Math.abs(Number(c.cpc_deviation ?? 0)), 0) / withReal.length
      : null

  return NextResponse.json({
    data: {
      campaigns: campaigns ?? [],
      keywordPerformance: keywordPerf,
      summary: {
        totalTracked: (campaigns ?? []).length,
        withRealCpc: withReal.length,
        avgCpcDeviation: avgDeviation !== null ? Math.round(avgDeviation * 100) / 100 : null,
      },
    },
  })
}
