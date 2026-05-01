import { createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { sendCampaignPausedEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
    const expectedBuf = Buffer.from(expected, 'hex')
    const signatureBuf = Buffer.from(signature, 'hex')
    if (expectedBuf.length !== signatureBuf.length) return false
    return timingSafeEqual(expectedBuf, signatureBuf)
  } catch {
    return false
  }
}

interface GoogleAdsPayload {
  campaignId: string
  event_type: 'campaign.updated' | 'campaign.paused' | 'campaign.deleted'
  data: Record<string, unknown>
}

async function getUserEmailByCampaignId(campaignId: string): Promise<{ email: string | null; userId: string | null }> {
  const supabase = createAdminClient()
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('user_id')
    .eq('google_ads_campaign_id', campaignId)
    .single()

  if (!campaign?.user_id) return { email: null, userId: null }

  const { data: user } = await supabase
    .from('users')
    .select('email')
    .eq('id', campaign.user_id)
    .single()

  return { email: user?.email ?? null, userId: campaign.user_id }
}

// ─── POST /api/webhooks/google-ads ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-google-ads-signature') ?? ''

  const secret = process.env.GOOGLE_ADS_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret não configurado' }, { status: 500 })
  }

  if (!signature || !verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
  }

  let payload: GoogleAdsPayload
  try {
    payload = JSON.parse(rawBody) as GoogleAdsPayload
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  const { campaignId, event_type, data } = payload

  if (!campaignId || !event_type) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes: campaignId, event_type' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  try {
    switch (event_type) {
      // ── campaign.updated ────────────────────────────────────────────────────
      case 'campaign.updated': {
        await supabase
          .from('campaigns')
          .update({
            sync_status: 'synced',
            last_sync_at: now,
            updated_at: now,
            ...(data.name ? { name: data.name as string } : {}),
            ...(data.status ? { status: data.status as string } : {}),
          })
          .eq('google_ads_campaign_id', campaignId)
        break
      }

      // ── campaign.paused ─────────────────────────────────────────────────────
      case 'campaign.paused': {
        const { data: updated } = await supabase
          .from('campaigns')
          .update({ status: 'active', sync_status: 'synced', last_sync_at: now, updated_at: now })
          .eq('google_ads_campaign_id', campaignId)
          .select('name')
          .single()

        const { email } = await getUserEmailByCampaignId(campaignId)
        if (email && updated?.name) {
          await sendCampaignPausedEmail(email, updated.name).catch(() => null)
        }
        break
      }

      // ── campaign.deleted ────────────────────────────────────────────────────
      case 'campaign.deleted': {
        const { data: deleted } = await supabase
          .from('campaigns')
          .update({ deleted_at: now, updated_at: now, sync_status: 'synced' })
          .eq('google_ads_campaign_id', campaignId)
          .select('name, user_id')
          .single()

        const { email } = await getUserEmailByCampaignId(campaignId)
        if (email && deleted?.name) {
          await sendCampaignPausedEmail(email, `${deleted.name} (removida)`).catch(() => null)
        }
        break
      }

      default:
        // Unknown event type — acknowledged, not processed
        break
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error(`[google-ads-webhook] error handling ${event_type}:`, message)
  }

  return NextResponse.json({ received: true })
}
