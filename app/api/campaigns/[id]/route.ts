import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  productName: z.string().min(1).max(100).optional(),
  category: z.string().optional(),
  objective: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  differentials: z.array(z.string()).optional(),
  offer: z.string().optional(),
  affiliateUrl: z.string().url().optional(),
  adGroups: z.array(z.unknown()).optional(),
  extensions: z.record(z.unknown()).optional(),
  negativeKeywords: z.array(z.string()).optional(),
  status: z.enum(['draft', 'active', 'exported', 'synced']).optional(),
  googleAdsCampaignId: z.string().optional(),
  estimatedCpc: z.number().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

// ─── GET /api/campaigns/[id] ─────────────────────────────────────────────────

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
  }

  return NextResponse.json({ data })
}

// ─── PUT /api/campaigns/[id] ─────────────────────────────────────────────────

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createAdminClient()

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from('campaigns')
    .select('id, user_id')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const parsed = updateCampaignSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const updates: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) updates.name = parsed.data.name
  if (parsed.data.productName !== undefined) updates.product_name = parsed.data.productName
  if (parsed.data.category !== undefined) updates.category = parsed.data.category
  if (parsed.data.objective !== undefined) updates.objective = parsed.data.objective
  if (parsed.data.benefits !== undefined) updates.benefits = parsed.data.benefits
  if (parsed.data.differentials !== undefined) updates.differentials = parsed.data.differentials
  if (parsed.data.offer !== undefined) updates.offer = parsed.data.offer
  if (parsed.data.affiliateUrl !== undefined) updates.affiliate_url = parsed.data.affiliateUrl
  if (parsed.data.adGroups !== undefined) updates.ad_groups = parsed.data.adGroups
  if (parsed.data.extensions !== undefined) updates.extensions = parsed.data.extensions
  if (parsed.data.negativeKeywords !== undefined) updates.negative_keywords = parsed.data.negativeKeywords
  if (parsed.data.status !== undefined) updates.status = parsed.data.status
  if (parsed.data.googleAdsCampaignId !== undefined) updates.google_ads_campaign_id = parsed.data.googleAdsCampaignId
  if (parsed.data.estimatedCpc !== undefined) updates.estimated_cpc = parsed.data.estimatedCpc
  updates.updated_at = new Date().toISOString()

  const { data: updated, error: updateError } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: 'Erro ao atualizar campanha' }, { status: 500 })
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: session.user.id,
    action: 'campaign.updated',
    status: 'success',
    metadata: { campaign_id: id, changes: Object.keys(updates) },
    created_at: new Date().toISOString(),
  })

  return NextResponse.json({ data: updated })
}

// ─── DELETE /api/campaigns/[id] ──────────────────────────────────────────────

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createAdminClient()

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from('campaigns')
    .select('id, name, user_id')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
  }

  const now = new Date().toISOString()

  // Soft delete
  const { error: deleteError } = await supabase
    .from('campaigns')
    .update({ deleted_at: now, updated_at: now })
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (deleteError) {
    return NextResponse.json({ error: 'Erro ao deletar campanha' }, { status: 500 })
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: session.user.id,
    action: 'campaign.deleted',
    status: 'success',
    metadata: { campaign_id: id, campaign_name: existing.name },
    created_at: now,
  })

  return NextResponse.json({ message: 'Campanha removida com sucesso' })
}
