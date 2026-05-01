import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = { params: Promise<{ id: string }> }

// Stub: Replace with real google-ads-api SDK calls when credentials are available.
async function fetchGoogleAdsCpcData(
  googleAdsCampaignId: string,
  _encryptedToken: string
): Promise<{ realCpc: number; impressions: number; clicks: number }> {
  // TODO: Replace this stub with the actual google-ads-api SDK integration.
  // Example real implementation:
  //   const { GoogleAdsApi } = await import('google-ads-api')
  //   const client = new GoogleAdsApi({ ... })
  //   const customer = client.Customer({ ... })
  //   const [campaign] = await customer.report({ ... })
  //   return { realCpc: campaign.metrics.average_cpc / 1_000_000, ... }

  // Stub returns synthetic data derived from the campaign ID for determinism
  const seed = googleAdsCampaignId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const realCpc = parseFloat((((seed % 300) + 50) / 100).toFixed(2))
  const impressions = (seed % 1000) + 500
  const clicks = Math.floor(impressions * 0.03)

  return { realCpc, impressions, clicks }
}

// ─── POST /api/google-ads/sync/[id] ──────────────────────────────────────────

export async function POST(_request: NextRequest, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createAdminClient()

  // Check that user has a pro or enterprise plan
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', session.user.id)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const plan = subscription?.plan ?? 'free'
  if (plan === 'free') {
    return NextResponse.json(
      { error: 'Sincronização com Google Ads requer plano Pro ou Enterprise' },
      { status: 403 }
    )
  }

  // Fetch campaign and verify ownership
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .is('deleted_at', null)
    .single()

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
  }

  if (!campaign.google_ads_campaign_id) {
    return NextResponse.json(
      { error: 'Campanha não vinculada ao Google Ads (google_ads_campaign_id ausente)' },
      { status: 400 }
    )
  }

  // Fetch user's encrypted OAuth token
  const { data: user } = await supabase
    .from('users')
    .select('google_oauth_token, google_ads_connected')
    .eq('id', session.user.id)
    .single()

  if (!user?.google_ads_connected || !user?.google_oauth_token) {
    return NextResponse.json(
      { error: 'Google Ads não conectado. Acesse /settings para conectar.' },
      { status: 400 }
    )
  }

  // Fetch CPC data (stub — replace with real SDK call)
  let cpcData: { realCpc: number; impressions: number; clicks: number }
  try {
    cpcData = await fetchGoogleAdsCpcData(
      campaign.google_ads_campaign_id,
      user.google_oauth_token
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: `Falha ao buscar dados do Google Ads: ${message}` },
      { status: 502 }
    )
  }

  const estimatedCpc: number = campaign.estimated_cpc ?? 0
  const cpcDeviation = estimatedCpc > 0
    ? parseFloat(((Math.abs(cpcData.realCpc - estimatedCpc) / estimatedCpc) * 100).toFixed(2))
    : null

  const now = new Date().toISOString()

  // Update campaign
  const { data: updatedCampaign, error: updateError } = await supabase
    .from('campaigns')
    .update({
      real_cpc: cpcData.realCpc,
      cpc_deviation: cpcDeviation,
      sync_status: 'synced',
      last_sync_at: now,
      updated_at: now,
    })
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: 'Erro ao atualizar campanha' }, { status: 500 })
  }

  // Save performance snapshot
  await supabase.from('campaign_performance').insert({
    campaign_id: id,
    keyword: '__aggregate__',
    estimated_cpc: estimatedCpc,
    real_cpc: cpcData.realCpc,
    impressions: cpcData.impressions,
    clicks: cpcData.clicks,
    recorded_at: now,
  })

  return NextResponse.json({
    data: updatedCampaign,
    performance: {
      realCpc: cpcData.realCpc,
      impressions: cpcData.impressions,
      clicks: cpcData.clicks,
      cpcDeviation,
    },
  })
}
