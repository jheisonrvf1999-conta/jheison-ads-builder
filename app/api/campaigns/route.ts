import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateCampaign } from '@/lib/campaign-generator'
import type { CampaignSummary, PaginatedResponse } from '@/types'

const createCampaignSchema = z.object({
  productName: z.string().min(1, 'Nome do produto obrigatório').max(100),
  category: z.string().min(1, 'Categoria obrigatória'),
  objective: z.string().min(1, 'Objetivo obrigatório'),
  benefits: z.array(z.string()).min(1, 'Ao menos um benefício é obrigatório'),
  differentials: z.array(z.string()),
  offer: z.string().optional().default(''),
  affiliateUrl: z.string().url('URL do afiliado inválida'),
  keywords: z.array(
    z.object({
      keyword: z.string(),
      score: z.number(),
      matchType: z.enum(['Exact', 'Phrase', 'Broad']),
      selected: z.boolean(),
      isNegative: z.boolean(),
      monthlySearches: z.number().optional(),
      cpcAvg: z.number().optional(),
      competition: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    })
  ),
})

const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  pro: 50,
  enterprise: -1, // unlimited
}

// ─── GET /api/campaigns ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)))
  const status = searchParams.get('status')

  const supabase = createAdminClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('campaigns')
    .select(
      'id, name, product_name, category, status, ad_groups, google_ads_campaign_id, sync_status, estimated_cpc, real_cpc, created_at, updated_at',
      { count: 'exact' }
    )
    .eq('user_id', session.user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar campanhas' }, { status: 500 })
  }

  const campaigns: CampaignSummary[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    productName: row.product_name,
    category: row.category,
    status: row.status,
    adGroupCount: Array.isArray(row.ad_groups) ? row.ad_groups.length : 0,
    keywordCount: Array.isArray(row.ad_groups)
      ? (row.ad_groups as { keywords?: unknown[] }[]).reduce(
          (sum, ag) => sum + (ag.keywords?.length ?? 0),
          0
        )
      : 0,
    googleAdsCampaignId: row.google_ads_campaign_id ?? undefined,
    syncStatus: row.sync_status ?? undefined,
    estimatedCpc: row.estimated_cpc ?? undefined,
    realCpc: row.real_cpc ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  const total = count ?? 0
  const response: PaginatedResponse<CampaignSummary> = {
    data: campaigns,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }

  return NextResponse.json(response)
}

// ─── POST /api/campaigns ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const parsed = createCampaignSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const userId = session.user.id

  // Fetch user's current plan
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const plan: string = subscription?.plan ?? 'free'
  const campaignLimit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free

  // Count existing campaigns for limit check
  if (campaignLimit !== -1) {
    const { count } = await supabase
      .from('campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null)

    if ((count ?? 0) >= campaignLimit) {
      return NextResponse.json(
        {
          error: `Limite de campanhas atingido para o plano ${plan}. Faça upgrade para criar mais campanhas.`,
        },
        { status: 403 }
      )
    }
  }

  // Generate campaign structure
  const campaignInput = {
    ...parsed.data,
    benefits: parsed.data.benefits,
    differentials: parsed.data.differentials,
  }

  const campaign = generateCampaign(campaignInput)
  campaign.userId = userId

  // Persist to Supabase
  const now = new Date().toISOString()
  const { data: inserted, error: insertError } = await supabase
    .from('campaigns')
    .insert({
      id: campaign.id,
      user_id: userId,
      name: campaign.name,
      product_name: campaign.productName,
      category: campaign.category,
      objective: campaign.objective,
      benefits: campaign.benefits,
      differentials: campaign.differentials,
      offer: campaign.offer,
      affiliate_url: campaign.affiliateUrl,
      ad_groups: campaign.adGroups,
      extensions: campaign.extensions,
      negative_keywords: campaign.negativeKeywords,
      status: campaign.status,
      estimated_cpc: campaign.estimatedCpc ?? null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: 'Erro ao salvar campanha' }, { status: 500 })
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action: 'campaign.created',
    status: 'success',
    metadata: { campaign_id: campaign.id, campaign_name: campaign.name },
    created_at: now,
  })

  return NextResponse.json({ data: inserted }, { status: 201 })
}
