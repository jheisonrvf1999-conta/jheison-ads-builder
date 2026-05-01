import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { exportToCsv, exportToXml } from '@/lib/export'
import type { Campaign } from '@/types'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') ?? 'csv'

  if (format !== 'csv' && format !== 'xml') {
    return NextResponse.json(
      { error: "Formato inválido. Use 'csv' ou 'xml'." },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { data: row, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .is('deleted_at', null)
    .single()

  if (error || !row) {
    return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
  }

  // Map DB row to Campaign type
  const campaign: Campaign = {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    productName: row.product_name,
    category: row.category,
    objective: row.objective,
    benefits: row.benefits ?? [],
    differentials: row.differentials ?? [],
    offer: row.offer,
    affiliateUrl: row.affiliate_url,
    adGroups: row.ad_groups ?? [],
    extensions: row.extensions ?? { sitelinks: [], callouts: [], structuredSnippets: [] },
    negativeKeywords: row.negative_keywords ?? [],
    status: row.status,
    googleAdsCampaignId: row.google_ads_campaign_id ?? undefined,
    estimatedCpc: row.estimated_cpc ?? undefined,
    realCpc: row.real_cpc ?? undefined,
    cpcDeviation: row.cpc_deviation ?? undefined,
    syncStatus: row.sync_status ?? undefined,
    lastSyncAt: row.last_sync_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    exportedAt: row.exported_at ?? undefined,
  }

  let content: string
  let contentType: string
  let filename: string

  if (format === 'xml') {
    content = exportToXml(campaign)
    contentType = 'application/xml; charset=utf-8'
    filename = `${campaign.name.replace(/[^a-z0-9]/gi, '_')}.xml`
  } else {
    content = exportToCsv(campaign)
    contentType = 'text/csv; charset=utf-8'
    filename = `${campaign.name.replace(/[^a-z0-9]/gi, '_')}.csv`
  }

  // Update campaign status and exportedAt
  const now = new Date().toISOString()
  await supabase
    .from('campaigns')
    .update({ status: 'exported', exported_at: now, updated_at: now })
    .eq('id', id)
    .eq('user_id', session.user.id)

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
