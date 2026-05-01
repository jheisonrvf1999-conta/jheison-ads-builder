import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { createPortalSession } from '@/lib/stripe'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ─── POST /api/billing/portal ─────────────────────────────────────────────────

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Look up stripe_customer_id from subscriptions table
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', session.user.id)
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !subscription?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'Nenhuma assinatura encontrada para este usuário' },
      { status: 404 }
    )
  }

  try {
    const returnUrl = `${APP_URL}/billing`
    const portalUrl = await createPortalSession(subscription.stripe_customer_id, returnUrl)
    return NextResponse.json({ url: portalUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: `Erro ao abrir portal de cobrança: ${message}` },
      { status: 500 }
    )
  }
}
